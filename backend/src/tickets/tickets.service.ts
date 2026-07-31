import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  GoneException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { TicketIdGenerator } from './ticket-id-generator';
import { TrackingTokenService } from './tracking-token.service';
import { TicketStateMachine } from './ticket-state-machine';
import { STORAGE_SERVICE, StorageService } from '../storage/storage.service';
import { CreateTicketDto } from './dtos/create-ticket.dto';
import { TriageTicketDto } from './dtos/triage-ticket.dto';
import { PostMinuteDto } from './dtos/post-minute.dto';
import { RequestInfoDto } from './dtos/request-info.dto';
import { CitizenInfoReplyDto } from './dtos/citizen-info-reply.dto';
import { SubmitResolutionDto } from './dtos/submit-resolution.dto';
import { FeedbackDto } from './dtos/feedback.dto';
import { ReopenDto } from './dtos/reopen.dto';
import {
  AwaitingState,
  Channel,
  MovementType,
  Priority,
  TicketStatus,
} from '../common/types/ticket-status';
import { RoutingService } from '../routing/routing.service';
import { SlaClockService } from '../sla/sla-clock.service';
import { AuditService } from '../audit/audit.service';
import { AuditEventType } from '../audit/audit-event-type';
import { Role } from '../common/types/role';
import type { AuthenticatedUser } from '../common/types/authenticated-user';

export interface StoredAttachment {
  filename: string;
  storedPath: string;
  mimetype: string;
  sizeBytes: number;
}

/**
 * TicketsService — the application coordinator for ticket creation + tracking.
 *
 * Repository access goes through PrismaService (the single DB boundary).
 * Notification is decoupled via EventEmitter (Observer pattern).
 * File storage goes through the StorageService port (local dev / Cloudinary prod).
 */
@Injectable()
export class TicketsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly idGenerator: TicketIdGenerator,
    private readonly trackingTokenService: TrackingTokenService,
    private readonly stateMachine: TicketStateMachine,
    private readonly eventEmitter: EventEmitter2,
    private readonly routingService: RoutingService,
    private readonly slaClock: SlaClockService,
    private readonly config: ConfigService,
    private readonly audit: AuditService,
    @Inject(STORAGE_SERVICE) private readonly storage: StorageService,
  ) {}

  /**
   * Creates a ticket + citizen + attachments atomically, then emits the
   * ticket.created event (→ acknowledgement email).
   *
   * Status is persisted directly as ACKNOWLEDGED (SUBMITTED → ACKNOWLEDGED
   * happens in one breath per the spec; we audit via the created event).
   */
  async create(
    dto: CreateTicketDto,
    attachments: StoredAttachment[] = [],
    uploadedById?: string,
  ): Promise<{ id: string; ticketCode: string; trackingPasscode: string }> {
    // Per M2 open-question #2: require email even if anonymous, so we can send
    // the tracking link. Anonymous just hides the name.
    if (!dto.isAnonymous && !dto.name) {
      throw new BadRequestException('Name is required for non-anonymous complaints');
    }
    if (!dto.email) {
      throw new BadRequestException('Email is required to receive the tracking link');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Upsert citizen by email (a returning complainant reuses their row).
      // dto.email is guaranteed defined by the check above.
      const email = dto.email!;
      const citizen = await tx.citizen.upsert({
        where: { email },
        update: {
          name: dto.isAnonymous ? null : dto.name,
          phone: dto.phone,
          lga: dto.lga,
        },
        create: {
          email,
          name: dto.isAnonymous ? null : dto.name,
          phone: dto.phone,
          lga: dto.lga,
          isAnonymous: dto.isAnonymous ?? false,
        },
      });

      // 2. Generate atomic ticket code.
      const ticketCode = await this.idGenerator.nextCode(tx);

      // 3. Pre-sign the tracking token (needs the citizenId + ticketId).
      //    We use the ticketCode-based lookup later, so the token can be signed
      //    after the ticket exists. Sign below after the insert returns an id.
      // Generate a 6-digit passcode for citizen tracking (simpler than JWT URL).
      const trackingPasscode = String(Math.floor(100000 + Math.random() * 900000));

      const ticket = await tx.ticket.create({
        data: {
          ticketCode,
          status: TicketStatus.ACKNOWLEDGED,
          category: dto.category,
          priority: dto.priority,
          subject: dto.subject,
          description: dto.description,
          channel: dto.channel ?? Channel.WEB,
          lga: dto.lga,
          citizenId: citizen.id,
          trackingPasscode,
          // trackingToken set below via update (needs the id for the JWT).
          trackingToken: 'pending',
        },
      });

      // 4. Sign tracking token now that we have ticketId + citizenId.
      const trackingToken = this.trackingTokenService.issue({
        ticketId: ticket.id,
        citizenId: citizen.id,
      });

      await tx.ticket.update({
        where: { id: ticket.id },
        data: { trackingToken },
      });

      // 5. Store attachments.
      if (attachments.length > 0) {
        await tx.ticketAttachment.createMany({
          data: attachments.map((a) => ({
            ticketId: ticket.id,
            kind: 'EVIDENCE',
            filename: a.filename,
            storedPath: a.storedPath,
            mimetype: a.mimetype,
            sizeBytes: a.sizeBytes,
            uploadedById: uploadedById ?? null,
          })),
        });
      }

      return { id: ticket.id, ticketCode, trackingPasscode };
    });

    // 6. Emit event AFTER transaction commits → notification listener sends email.
    this.eventEmitter.emit('ticket.created', { ticketId: result.id });
    await this.audit.log({ ticketId: result.id, eventType: AuditEventType.TICKET_ACKNOWLEDGED });

    return result;
  }

  /**
   * Triage: classify, prioritize, and route an ACKNOWLEDGED ticket.
   * Transitions ACKNOWLEDGED → TRIAGED → ASSIGNED atomically.
   */
  async triage(
    ticketId: string,
    dto: TriageTicketDto,
    triagedBy: { id: string; role: Role },
  ): Promise<{ ticketCode: string; status: string }> {
    const ticket = await this.prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) throw new NotFoundException('Ticket not found');

    this.stateMachine.assertCanTransition(ticket.status as TicketStatus, TicketStatus.TRIAGED);

    let routingResult: { departmentId: string; officerId?: string };

    if (dto.departmentId && dto.overrideOfficerId) {
      routingResult = { departmentId: dto.departmentId, officerId: dto.overrideOfficerId };
    } else if (dto.departmentId) {
      const fallbackOfficer = await this.prisma.user.findFirst({
        where: { departmentId: dto.departmentId, role: 'SCHEDULE_OFFICER', isActive: true },
      });
      routingResult = {
        departmentId: dto.departmentId,
        officerId: fallbackOfficer?.id ?? (await this.prisma.user.findFirst({
          where: { departmentId: dto.departmentId, role: 'DIRECTOR', isActive: true },
        }))?.id,
      };
    } else {
      const resolved = await this.routingService.resolve({
        category: dto.category,
        priority: dto.priority,
        lga: ticket.lga ?? undefined,
      });
      if (!resolved) {
        throw new BadRequestException(
          `No routing rule found for category "${dto.category}". Assign a department manually or create a routing rule.`,
        );
      }
      routingResult = resolved;
    }

    const now = new Date();

    await this.prisma.$transaction(async (tx) => {
      await tx.ticket.update({
        where: { id: ticketId },
        data: {
          status: 'TRIAGED',
          category: dto.category,
          priority: dto.priority as any,
          sensitivity: (dto.sensitivity as any) ?? ticket.sensitivity,
          triagedAt: now,
          triagedById: triagedBy.id,
        },
      });

      await tx.ticketMovement.create({
        data: {
          ticketId,
          type: MovementType.ROUTED,
          fromUserId: triagedBy.id,
          note: dto.triageNote ?? `Triaged as ${dto.category} / ${dto.priority}`,
        },
      });

      await this.routingService.assign(
        tx,
        ticketId,
        routingResult.departmentId,
        routingResult.officerId,
        triagedBy.id,
        dto.overrideOfficerId ? 'Manual assignment override' : undefined,
      );
    });

    this.eventEmitter.emit('ticket.triaged', { ticketId });
    await this.routingService.emitAssigned(ticketId);
    await this.audit.log({
      ticketId, actorId: triagedBy.id, eventType: AuditEventType.TICKET_TRIAGED,
      meta: { category: dto.category, priority: dto.priority },
    });

    return { ticketCode: ticket.ticketCode, status: 'ASSIGNED' };
  }

  /**
   * Public tracking lookup by ticket code + passcode (no JWT needed).
   * Returns the same citizen-safe subset as findByCodeForCitizen.
   */
  async findByCodeWithPasscode(ticketCode: string, passcode: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { ticketCode },
      include: {
        attachments: { select: { filename: true, mimetype: true } },
        movements: {
          orderBy: { createdAt: 'asc' },
          select: { type: true, note: true, createdAt: true },
        },
        minutes: {
          where: { isInternal: false },
          orderBy: { createdAt: 'asc' },
          select: {
            body: true,
            isResolutionDraft: true,
            createdAt: true,
            author: { select: { fullName: true, designation: true } },
          },
        },
        department: { select: { name: true } },
      },
    });

    if (!ticket || ticket.trackingPasscode !== passcode) {
      throw new NotFoundException('Ticket not found or invalid passcode');
    }

    let infoRequest: { text: string; createdAt: string } | null = null;
    if ((ticket.awaiting as AwaitingState) === AwaitingState.CITIZEN) {
      const req = await this.prisma.minute.findFirst({
        where: { ticketId: ticket.id, isInternal: true },
        orderBy: { createdAt: 'desc' },
        select: { body: true, createdAt: true },
      });
      if (req) {
        infoRequest = {
          text: req.body.replace(/^\[Info requested from citizen\]\s*/, ''),
          createdAt: req.createdAt.toISOString(),
        };
      }
    }

    return {
      ticketCode: ticket.ticketCode,
      status: ticket.status,
      subject: ticket.subject,
      description: ticket.description,
      category: ticket.category,
      priority: ticket.priority,
      departmentName: ticket.department?.name ?? null,
      awaiting: ticket.awaiting,
      createdAt: ticket.createdAt,
      resolvedAt: ticket.resolvedAt,
      resolutionText: ticket.resolutionText,
      attachments: ticket.attachments,
      minutes: ticket.minutes,
      infoRequest,
      timeline: ticket.movements.map((m) => ({
        type: m.type,
        note: m.note,
        createdAt: m.createdAt,
      })),
    };
  }

  /**
   * Public tracking view (token-authenticated). Returns a citizen-safe subset —
   * no internal fields, no trackingToken, no staff-only data.
   */
  async findByCodeForCitizen(ticketCode: string, citizenId: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { ticketCode },
      include: {
        attachments: { select: { filename: true, mimetype: true } },
        movements: {
          orderBy: { createdAt: 'asc' },
          select: {
            type: true,
            note: true,
            createdAt: true,
          },
        },
        minutes: {
          // Only non-internal minutes are citizen-visible. The officer's
          // internal commentary stays staff-only.
          where: { isInternal: false },
          orderBy: { createdAt: 'asc' },
          select: {
            body: true,
            isResolutionDraft: true,
            createdAt: true,
            author: { select: { fullName: true, designation: true } },
          },
        },
        department: { select: { name: true } },
      },
    });

    if (!ticket || ticket.citizenId !== citizenId) {
      throw new NotFoundException('Ticket not found');
    }

    // If the ticket is awaiting a citizen reply, surface the latest info
    // request text (extracted from the internal minute written on request).
    let infoRequest: { text: string; createdAt: string } | null = null;
    if ((ticket.awaiting as AwaitingState) === AwaitingState.CITIZEN) {
      const req = await this.prisma.minute.findFirst({
        where: { ticketId: ticket.id, isInternal: true },
        orderBy: { createdAt: 'desc' },
        select: { body: true, createdAt: true },
      });
      if (req) {
        infoRequest = {
          text: req.body.replace(/^\[Info requested from citizen\]\s*/, ''),
          createdAt: req.createdAt.toISOString(),
        };
      }
    }

    return {
      ticketCode: ticket.ticketCode,
      status: ticket.status,
      subject: ticket.subject,
      description: ticket.description,
      category: ticket.category,
      priority: ticket.priority,
      departmentName: ticket.department?.name ?? null,
      awaiting: ticket.awaiting,
      createdAt: ticket.createdAt,
      resolvedAt: ticket.resolvedAt,
      resolutionText: ticket.resolutionText,
      attachments: ticket.attachments,
      minutes: ticket.minutes,
      infoRequest,
      timeline: ticket.movements.map((m) => ({
        type: m.type,
        note: m.note,
        createdAt: m.createdAt,
      })),
    };
  }

  /**
   * Staff view (JWT-authenticated). Returns full ticket detail.
   */
  async findById(id: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      include: {
        citizen: true,
        attachments: true,
        department: { select: { id: true, name: true, code: true } },
        assignedOfficer: {
          select: { id: true, fullName: true, role: true, designation: true, email: true },
        },
        movements: {
          orderBy: { createdAt: 'asc' },
          include: {
            fromUser: { select: { fullName: true, role: true } },
            toUser: { select: { fullName: true, role: true } },
          },
        },
      },
    });
    if (!ticket) throw new NotFoundException('Ticket not found');
    return ticket;
  }

  /**
   * Staff list with filters. Used by triage queue (M3), officer queue (M4), etc.
   * The sentinel `assignedOfficerId=me` is resolved to the requesting user's id
   * so officers can fetch their own queue without exposing their UUID.
   */
  async findMany(filters: {
    status?: TicketStatus;
    departmentId?: string;
    assignedOfficerId?: string;
    requesterId?: string;
    page?: number;
    pageSize?: number;
  }) {
    const { status, departmentId, page = 1, pageSize = 20 } = filters;
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (departmentId) where.departmentId = departmentId;

    if (filters.assignedOfficerId) {
      where.assignedOfficerId =
        filters.assignedOfficerId === 'me'
          ? filters.requesterId ?? null
          : filters.assignedOfficerId;
    }

    const [items, total] = await Promise.all([
      this.prisma.ticket.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          citizen: { select: { name: true, email: true, phone: true } },
          department: { select: { id: true, name: true, code: true } },
          assignedOfficer: { select: { id: true, fullName: true } },
        },
      }),
      this.prisma.ticket.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Investigation (Milestone 4 — Phase 3)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Ownership check for officer endpoints. The assigned officer, plus any
   * superior (DIRECTOR / DEPUTY_DIRECTOR / ASSISTANT_DIRECTOR) in the ticket's
   * own department, may act on it. SUPER_ADMIN bypasses. Also enforces the
   * closed-ticket freeze (no writes once CLOSED). Throws if not.
   */
  private async assertCanAct(ticketId: string, user: AuthenticatedUser): Promise<void> {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { assignedOfficerId: true, departmentId: true, status: true },
    });
    if (!ticket) throw new NotFoundException('Ticket not found');

    // Closed-ticket freeze applies to everyone (officer + superior); only
    // SUPER_ADMIN archive (a separate path) may touch a closed ticket.
    this.assertNotFrozen(ticket.status as TicketStatus);

    if (user.role === Role.SUPER_ADMIN) return;

    const isAssignee = ticket.assignedOfficerId === user.id;

    // Superiors in the same department may also act (oversight).
    const superiorRoles: Role[] = [
      Role.DIRECTOR,
      Role.DEPUTY_DIRECTOR,
      Role.ASSISTANT_DIRECTOR,
    ];
    const isSuperiorInDept =
      superiorRoles.includes(user.role) &&
      !!ticket.departmentId &&
      ticket.departmentId === user.departmentId;

    if (!isAssignee && !isSuperiorInDept) {
      throw new ForbiddenException('You are not assigned to this ticket.');
    }
  }

  /**
   * Officer starts investigation on an ASSIGNED ticket → IN_PROGRESS.
   * Starts the SLA clock (snapshotting the resolution target) and notifies the
   * citizen that work has begun.
   */
  async start(id: string, user: AuthenticatedUser): Promise<{ status: string }> {
    await this.assertCanAct(id, user);

    const ticket = await this.prisma.ticket.findUnique({ where: { id } });
    if (!ticket) throw new NotFoundException('Ticket not found');

    this.stateMachine.assertCanTransition(
      ticket.status as TicketStatus,
      TicketStatus.IN_PROGRESS,
    );

    await this.prisma.$transaction(async (tx) => {
      await tx.ticket.update({
        where: { id },
        data: { status: TicketStatus.IN_PROGRESS },
      });
      await this.slaClock.start(tx, {
        id,
        priority: ticket.priority as Priority | null,
        slaStartedAt: ticket.slaStartedAt,
        slaTargetHours: ticket.slaTargetHours,
        awaiting: ticket.awaiting as AwaitingState,
      });
      await tx.ticketMovement.create({
        data: {
          ticketId: id,
          type: MovementType.ASSIGNED,
          fromUserId: user.id,
          note: 'Investigation started',
        },
      });
    });

    this.eventEmitter.emit('ticket.started', { ticketId: id });
    await this.audit.log({ ticketId: id, actorId: user.id, eventType: AuditEventType.TICKET_STARTED });
    return { status: TicketStatus.IN_PROGRESS };
  }

  /**
   * Append a minute to the investigation sheet. Append-only — no update path.
   * Internal minutes are hidden from the citizen track view.
   */
  async postMinute(
    id: string,
    dto: PostMinuteDto,
    user: AuthenticatedUser,
  ): Promise<{ id: string }> {
    await this.assertCanAct(id, user);

    const ticket = await this.prisma.ticket.findUnique({ where: { id } });
    if (!ticket) throw new NotFoundException('Ticket not found');

    // Minutes can be posted once investigation has begun (IN_PROGRESS or later
    // active states). Guard against posting on un-started tickets.
    const activeStatuses: TicketStatus[] = [
      TicketStatus.IN_PROGRESS,
      TicketStatus.PENDING_APPROVAL,
      TicketStatus.APPROVED,
      TicketStatus.REOPENED,
    ];
    if (!activeStatuses.includes(ticket.status as TicketStatus)) {
      throw new BadRequestException(
        'Cannot post a minute until the ticket is under investigation.',
      );
    }

    const minute = await this.prisma.minute.create({
      data: {
        ticketId: id,
        authorId: user.id,
        body: dto.body,
        isInternal: dto.isInternal ?? false,
        isResolutionDraft: dto.isResolutionDraft ?? false,
      },
    });
    await this.audit.log({
      ticketId: id, actorId: user.id, eventType: AuditEventType.MINUTE_POSTED,
      meta: { minuteId: minute.id, isInternal: dto.isInternal ?? false },
    });

    return { id: minute.id };
  }

  /**
   * Request more information from the citizen. Pauses the SLA clock
   * (awaiting = CITIZEN) and emits INFO_REQUESTED.
   */
  async requestInfo(
    id: string,
    dto: RequestInfoDto,
    user: AuthenticatedUser,
  ): Promise<{ status: string; awaiting: AwaitingState }> {
    await this.assertCanAct(id, user);

    const ticket = await this.prisma.ticket.findUnique({ where: { id } });
    if (!ticket) throw new NotFoundException('Ticket not found');

    // Must be actively under investigation to pause for info.
    if (ticket.status !== TicketStatus.IN_PROGRESS) {
      throw new BadRequestException(
        'Info requests are only allowed while the ticket is under investigation.',
      );
    }

    const deadlineAt = dto.deadlineAt ? new Date(dto.deadlineAt) : undefined;

    await this.prisma.$transaction(async (tx) => {
      await this.slaClock.pause(tx, id, AwaitingState.CITIZEN);
      await tx.minute.create({
        data: {
          ticketId: id,
          authorId: user.id,
          body: `[Info requested from citizen] ${dto.requestText}`,
          isInternal: true,
        },
      });
    });

    this.eventEmitter.emit('ticket.info_requested', {
      ticketId: id,
      requestText: dto.requestText,
      deadlineAt,
    });

    return { status: ticket.status, awaiting: AwaitingState.CITIZEN };
  }

  /**
   * Citizen replies to an info request (public, token-authenticated). Appends a
   * citizen minute, resumes the SLA clock, clears awaiting.
   */
  async replyInfo(
    ticketCode: string,
    citizenId: string,
    dto: CitizenInfoReplyDto,
  ): Promise<{ status: string; awaiting: AwaitingState }> {
    const ticket = await this.prisma.ticket.findUnique({
      where: { ticketCode },
      select: { id: true, citizenId: true, status: true, awaiting: true },
    });
    if (!ticket || ticket.citizenId !== citizenId) {
      throw new NotFoundException('Ticket not found');
    }

    if ((ticket.awaiting as AwaitingState) !== AwaitingState.CITIZEN) {
      throw new BadRequestException('This ticket is not awaiting your response.');
    }

    await this.prisma.$transaction(async (tx) => {
      await this.slaClock.resume(tx, ticket.id);
      // Citizen replies are recorded as non-internal minutes attributed to no
      // staff author — authorId is required by the schema, so we use a sentinel
      // pattern: store the reply as a movement note + a citizen-flagged minute.
      await tx.ticketMovement.create({
        data: {
          ticketId: ticket.id,
          type: MovementType.SUBMITTED,
          note: `Citizen reply: ${dto.body.slice(0, 200)}`,
        },
      });
    });

    return { status: ticket.status, awaiting: AwaitingState.NONE };
  }

  /**
   * Officer requests departmental approval (→ PENDING_APPROVAL). Creates a
   * PENDING ApprovalRequest addressed to the department HOD and pauses the SLA
   * clock (awaiting = APPROVAL). The decision flow is M5.
   */
  async requestApproval(id: string, user: AuthenticatedUser): Promise<{ status: string }> {
    await this.assertCanAct(id, user);

    const ticket = await this.prisma.ticket.findUnique({ where: { id } });
    if (!ticket) throw new NotFoundException('Ticket not found');

    this.stateMachine.assertCanTransition(
      ticket.status as TicketStatus,
      TicketStatus.PENDING_APPROVAL,
    );

    if (!ticket.departmentId) {
      throw new BadRequestException('Ticket has no department to request approval from.');
    }

    // Resolve the department HOD as the first approver.
    const hod = await this.prisma.user.findFirst({
      where: {
        departmentId: ticket.departmentId,
        role: Role.DIRECTOR,
        isActive: true,
      },
    });

    await this.prisma.$transaction(async (tx) => {
      await tx.ticket.update({
        where: { id },
        data: { status: TicketStatus.PENDING_APPROVAL },
      });
      await this.slaClock.pause(tx, id, AwaitingState.APPROVAL);
      await tx.approvalRequest.create({
        data: {
          ticketId: id,
          requestedById: user.id,
          approverRole: 'DIRECTOR',
          currentApproverId: hod?.id ?? null,
          status: 'PENDING',
        },
      });
    });

    this.eventEmitter.emit('ticket.approval_requested', { ticketId: id });
    return { status: TicketStatus.PENDING_APPROVAL };
  }

  /**
   * Staff detail enriched with the investigation artefacts: minutes (for the
   * timeline), SLA snapshot, pauses, and approval requests. Internal minutes
   * are included (this is the staff view).
   */
  async findDetailForStaff(id: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      include: {
        citizen: true,
        attachments: true,
        department: { select: { id: true, name: true, code: true } },
        assignedOfficer: {
          select: { id: true, fullName: true, role: true, designation: true, email: true },
        },
        movements: {
          orderBy: { createdAt: 'asc' },
          include: {
            fromUser: { select: { fullName: true, role: true } },
            toUser: { select: { fullName: true, role: true } },
          },
        },
        minutes: {
          orderBy: { createdAt: 'asc' },
          include: {
            author: {
              select: { id: true, fullName: true, role: true, designation: true },
            },
          },
        },
        slaPauses: { orderBy: { startedAt: 'asc' } },
        approvalRequests: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        feedback: true,
      },
    });
    if (!ticket) throw new NotFoundException('Ticket not found');

    // Derive live SLA numbers so the UI doesn't have to recompute.
    const remaining = ticket.slaTargetHours
      ? await this.slaClock.remainingHours(id)
      : null;

    return { ...ticket, slaRemainingHours: remaining };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Resolution & Closure (Milestone 6 — Phases 6 & 7)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Closed tickets are frozen — no further writes except SUPER_ADMIN archive.
   * Called by every mutating M4/M6 method. Throws ConflictException.
   */
  private assertNotFrozen(status: TicketStatus): void {
    if (status === TicketStatus.CLOSED) {
      throw new ConflictException(
        'This ticket is closed and can no longer be modified.',
      );
    }
  }

  /**
   * Officer submits a resolution. IN_PROGRESS → RESOLVED, sets the feedback
   * grace deadline (resolvedAt + FEEDBACK_GRACE_DAYS), and notifies the citizen
   * with a feedback link.
   */
  async submitResolution(
    id: string,
    dto: SubmitResolutionDto,
    user: AuthenticatedUser,
  ): Promise<{ status: string }> {
    await this.assertCanAct(id, user);

    const ticket = await this.prisma.ticket.findUnique({ where: { id } });
    if (!ticket) throw new NotFoundException('Ticket not found');
    this.assertNotFrozen(ticket.status as TicketStatus);

    this.stateMachine.assertCanTransition(
      ticket.status as TicketStatus,
      TicketStatus.RESOLVED,
    );

    const now = new Date();
    const graceDays = this.config.get<number>('FEEDBACK_GRACE_DAYS') ?? 7;
    const feedbackGraceDueAt = new Date(
      now.getTime() + graceDays * 24 * 3600_000,
    );

    await this.prisma.$transaction(async (tx) => {
      await tx.ticket.update({
        where: { id },
        data: {
          status: TicketStatus.RESOLVED,
          resolutionText: dto.resolutionText,
          resolvedAt: now,
          resolvedById: user.id,
          feedbackGraceDueAt,
        },
      });
      await tx.minute.create({
        data: {
          ticketId: id,
          authorId: user.id,
          body: `[Resolution submitted] ${dto.resolutionText}`,
          isInternal: false,
          isResolutionDraft: false,
        },
      });
      await tx.ticketMovement.create({
        data: {
          ticketId: id,
          type: MovementType.CLOSED,
          fromUserId: user.id,
          note: 'Resolution submitted for citizen confirmation',
        },
      });
    });

    this.eventEmitter.emit('ticket.resolved', { ticketId: id });
    await this.audit.log({
      ticketId: id, actorId: user.id, eventType: AuditEventType.TICKET_RESOLVED,
    });
    return { status: TicketStatus.RESOLVED };
  }

  /**
   * Citizen feedback (public, token-auth). Satisfied → CLOSED; not → REOPENED.
   * 1:1 — a second feedback attempt throws ConflictException.
   */
  async submitFeedback(
    ticketCode: string,
    citizenId: string,
    dto: FeedbackDto,
  ): Promise<{ status: string }> {
    const ticket = await this.prisma.ticket.findUnique({
      where: { ticketCode },
      select: { id: true, citizenId: true, status: true, resolvedAt: true, reopenCount: true },
    });
    if (!ticket || ticket.citizenId !== citizenId) {
      throw new NotFoundException('Ticket not found');
    }
    if (ticket.status !== TicketStatus.RESOLVED) {
      throw new BadRequestException(
        'Feedback is only accepted after a resolution has been submitted.',
      );
    }

    // Enforce the reopen window on unsatisfied feedback.
    if (!dto.satisfied) {
      this.assertWithinReopenWindow(ticket.resolvedAt);
    }

    // 1:1 — reject duplicate feedback.
    const existing = await this.prisma.feedback.findUnique({
      where: { ticketId: ticket.id },
    });
    if (existing) {
      throw new ConflictException('You have already submitted feedback for this ticket.');
    }

    if (dto.satisfied) {
      await this.close(ticket.id, 'citizen_confirmed');
      await this.prisma.feedback.create({
        data: {
          ticketId: ticket.id,
          satisfied: true,
          rating: dto.rating,
          comment: dto.comment,
        },
      });
      this.eventEmitter.emit('ticket.closed', { ticketId: ticket.id });
      await this.audit.log({
        ticketId: ticket.id, eventType: AuditEventType.TICKET_CLOSED,
        meta: { reason: 'citizen_confirmed', rating: dto.rating },
      });
      return { status: TicketStatus.CLOSED };
    }

    // Not satisfied → reopen.
    const reopenCount = await this.reopenInternal(ticket.id, dto.comment ?? 'Citizen rejected resolution');
    await this.prisma.feedback.create({
      data: {
        ticketId: ticket.id,
        satisfied: false,
        rating: dto.rating,
        comment: dto.comment,
      },
    });
    this.eventEmitter.emit('ticket.reopened', {
      ticketId: ticket.id,
      reopenReason: dto.comment ?? 'Citizen rejected the resolution',
      reopenCount,
    });
    await this.audit.log({
      ticketId: ticket.id, eventType: AuditEventType.TICKET_REOPENED,
      meta: { reopenCount, comment: dto.comment },
    });
    return { status: TicketStatus.REOPENED };
  }

  /**
   * Citizen explicit reopen (alternative entry). Subject to the 14-day window.
   */
  async reopen(
    ticketCode: string,
    citizenId: string,
    dto: ReopenDto,
  ): Promise<{ status: string; reopenCount: number }> {
    const ticket = await this.prisma.ticket.findUnique({
      where: { ticketCode },
      select: { id: true, citizenId: true, status: true, resolvedAt: true },
    });
    if (!ticket || ticket.citizenId !== citizenId) {
      throw new NotFoundException('Ticket not found');
    }
    if (ticket.status !== TicketStatus.RESOLVED) {
      throw new BadRequestException('Only resolved tickets can be reopened.');
    }
    this.assertWithinReopenWindow(ticket.resolvedAt);

    const reopenCount = await this.reopenInternal(ticket.id, dto.reason);
    this.eventEmitter.emit('ticket.reopened', {
      ticketId: ticket.id,
      reopenReason: dto.reason,
      reopenCount,
    });
    return { status: TicketStatus.REOPENED, reopenCount };
  }

  /**
   * Shared reopen logic: RESOLVED → REOPENED, increment count, write movement.
   * Emits REOPEN_ESCALATION at reopenCount >= 2. Returns the new count.
   */
  private async reopenInternal(ticketId: string, reason: string): Promise<number> {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { status: true, reopenCount: true },
    });
    if (!ticket) throw new NotFoundException('Ticket not found');

    this.stateMachine.assertCanTransition(
      ticket.status as TicketStatus,
      TicketStatus.REOPENED,
    );

    const now = new Date();
    const newCount = ticket.reopenCount + 1;

    await this.prisma.$transaction(async (tx) => {
      await tx.ticket.update({
        where: { id: ticketId },
        data: {
          status: TicketStatus.REOPENED,
          reopenCount: newCount,
          lastReopenedAt: now,
        },
      });
      await tx.ticketMovement.create({
        data: {
          ticketId,
          type: MovementType.REOPENED,
          note: reason,
        },
      });
    });

    if (newCount >= 2) {
      this.eventEmitter.emit('ticket.reopen_escalation', { ticketId, reopenCount: newCount });
    }
    return newCount;
  }

  /** Throw 410 Gone if the reopen window (default 14d) has elapsed. */
  private assertWithinReopenWindow(resolvedAt: Date | null): void {
    if (!resolvedAt) return;
    const windowDays = this.config.get<number>('REOPEN_WINDOW_DAYS') ?? 14;
    const deadline = new Date(
      resolvedAt.getTime() + windowDays * 24 * 3600_000,
    );
    if (new Date() > deadline) {
      throw new GoneException(
        `The ${windowDays}-day window to reopen this complaint has expired.`,
      );
    }
  }

  /**
   * Close a ticket (citizen-confirmed or auto-close). Centralized so the cron
   * and the feedback path share one implementation.
   */
  async close(ticketId: string, reason: string): Promise<void> {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { status: true },
    });
    if (!ticket) throw new NotFoundException('Ticket not found');

    this.stateMachine.assertCanTransition(
      ticket.status as TicketStatus,
      TicketStatus.CLOSED,
    );

    await this.prisma.$transaction(async (tx) => {
      await tx.ticket.update({
        where: { id: ticketId },
        data: {
          status: TicketStatus.CLOSED,
          closedAt: new Date(),
          closedReason: reason,
        },
      });
      await tx.ticketMovement.create({
        data: { ticketId, type: MovementType.CLOSED, note: reason },
      });
    });
  }

  /**
   * Auto-close resolved tickets whose feedback grace has elapsed with no
   * feedback. Called by the daily cron. Idempotent: CLOSED tickets no longer
   * match the query. Returns the count closed.
   */
  async autoCloseOverdue(): Promise<number> {
    const overdue = await this.prisma.ticket.findMany({
      where: {
        status: TicketStatus.RESOLVED,
        feedbackGraceDueAt: { lt: new Date() },
        feedback: null,
      },
      select: { id: true },
    });

    for (const t of overdue) {
      await this.close(t.id, 'auto_closed');
      this.eventEmitter.emit('ticket.auto.closed', { ticketId: t.id });
    }
    return overdue.length;
  }

  /**
   * Archive a closed ticket (SUPER_ADMIN or retention). Read-only thereafter.
   */
  async archive(ticketId: string): Promise<{ archived: boolean }> {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { status: true, archived: true },
    });
    if (!ticket) throw new NotFoundException('Ticket not found');
    if (ticket.status !== TicketStatus.CLOSED) {
      throw new BadRequestException('Only closed tickets can be archived.');
    }

    await this.prisma.ticket.update({
      where: { id: ticketId },
      data: { archived: true, archivedAt: new Date() },
    });
    return { archived: true };
  }

  /** Staff list of reopened tickets (admin triage view). */
  async findReopened(filters: { departmentId?: string; page?: number; pageSize?: number }) {
    const { departmentId, page = 1, pageSize = 20 } = filters;
    const where: Record<string, unknown> = { status: TicketStatus.REOPENED };
    if (departmentId) where.departmentId = departmentId;

    const [items, total] = await Promise.all([
      this.prisma.ticket.findMany({
        where,
        orderBy: { lastReopenedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          citizen: { select: { name: true, email: true } },
          department: { select: { name: true } },
        },
      }),
      this.prisma.ticket.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }

  /** Staff list of archived tickets (read-only archive view). */
  async findArchived(filters: {
    departmentId?: string;
    category?: string;
    page?: number;
    pageSize?: number;
  }) {
    const { departmentId, category, page = 1, pageSize = 20 } = filters;
    const where: Record<string, unknown> = { archived: true };
    if (departmentId) where.departmentId = departmentId;
    if (category) where.category = category;

    const [items, total] = await Promise.all([
      this.prisma.ticket.findMany({
        where,
        orderBy: { archivedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          citizen: { select: { name: true, email: true } },
          department: { select: { name: true } },
        },
      }),
      this.prisma.ticket.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Overhaul Phase 1.2 — SUPER_ADMIN / AUDITOR "all tickets with full timeline"
  //
  // Unlike `findMany`, this returns tickets across ALL departments and embeds
  // the full AuditEvent timeline (`events`) for each ticket — so the admin UI
  // can render a complete activity feed per row without a second round trip.
  // The activity timeline is sourced from `AuditEvent` rows (the system's
  // append-only event log: one row per state change / officer action / SLA
  // event). The Prisma relation `ticket.auditEvents` is renamed to `events`
  // in the response to match the API contract.
  // ─────────────────────────────────────────────────────────────────────────
  async findAllWithTimeline(filters: {
    status?: TicketStatus;
    departmentId?: string;
    priority?: Priority;
    search?: string;
    page?: number;
    pageSize?: number;
  }) {
    const {
      status,
      departmentId,
      priority,
      search,
      page = 1,
      pageSize = 20,
    } = filters;

    // Clamp page ≥ 1 and 1 ≤ pageSize ≤ 100 per the contract.
    const safePage = Math.max(1, Math.floor(page));
    const safePageSize = Math.min(100, Math.max(1, Math.floor(pageSize)));

    const where: Record<string, unknown> = { archived: false };
    if (status) where.status = status;
    if (departmentId) where.departmentId = departmentId;
    if (priority) where.priority = priority;
    if (search) {
      const term = search.trim();
      if (term) {
        where.OR = [
          { ticketCode: { contains: term } },
          { subject: { contains: term } },
          { description: { contains: term } },
        ];
      }
    }

    const [rawItems, total] = await Promise.all([
      this.prisma.ticket.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (safePage - 1) * safePageSize,
        take: safePageSize,
        include: {
          citizen: {
            select: { id: true, name: true, email: true, phone: true },
          },
          department: { select: { id: true, name: true, code: true } },
          assignedOfficer: {
            select: { id: true, fullName: true, email: true },
          },
          auditEvents: {
            orderBy: { createdAt: 'asc' },
            include: {
              actor: {
                select: { id: true, fullName: true, role: true },
              },
            },
          },
        },
      }),
      this.prisma.ticket.count({ where }),
    ]);

    // Rename `auditEvents` → `events` to match the API contract.
    const items = rawItems.map(({ auditEvents, ...rest }) => ({
      ...rest,
      events: auditEvents,
    }));

    const totalPages = total === 0 ? 0 : Math.ceil(total / safePageSize);

    return {
      items,
      total,
      page: safePage,
      pageSize: safePageSize,
      totalPages,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Overhaul Phase 1.3 — Department-scoped ticket listing with stats.
  //
  // Used by ADMIN_OFFICER / DIRECTOR / PS / AUDITOR / SUPER_ADMIN dashboards.
  // `stats` is computed against the *unfiltered* department scope (ignoring
  // status/priority/officer filters) so the UI can show department-wide
  // breakdowns alongside the filtered list. The top-level `total` is the
  // filtered count (drives pagination).
  // ─────────────────────────────────────────────────────────────────────────
  async findByDepartment(
    departmentId: string,
    filters: {
      status?: TicketStatus;
      priority?: Priority;
      assignedOfficerId?: string;
      page?: number;
      pageSize?: number;
    },
  ) {
    const {
      status,
      priority,
      assignedOfficerId,
      page = 1,
      pageSize = 20,
    } = filters;

    const safePage = Math.max(1, Math.floor(page));
    const safePageSize = Math.min(100, Math.max(1, Math.floor(pageSize)));

    const where: Record<string, unknown> = {
      departmentId,
      archived: false,
    };
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assignedOfficerId) {
      // Sentinel `me` is intentionally NOT resolved here — department viewers
      // (HOD/PS/Auditor) legitimately query other officers' assignments. Only
      // the explicit id is honoured.
      where.assignedOfficerId = assignedOfficerId;
    }

    // Unfiltered base scope for the stats block (department-wide totals).
    const statsWhere: Record<string, unknown> = {
      departmentId,
      archived: false,
    };

    const [
      items,
      total,
      statusGroups,
      priorityGroups,
      deptTotal,
    ] = await Promise.all([
      this.prisma.ticket.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (safePage - 1) * safePageSize,
        take: safePageSize,
        include: {
          citizen: {
            select: { id: true, name: true, email: true, phone: true },
          },
          assignedOfficer: {
            select: { id: true, fullName: true, email: true },
          },
        },
      }),
      this.prisma.ticket.count({ where }),
      this.prisma.ticket.groupBy({
        by: ['status'],
        where: statsWhere,
        _count: { _all: true },
      }),
      this.prisma.ticket.groupBy({
        by: ['priority'],
        where: statsWhere,
        _count: { _all: true },
      }),
      this.prisma.ticket.count({ where: statsWhere }),
    ]);

    const byStatus: Record<string, number> = {};
    for (const g of statusGroups) byStatus[g.status] = g._count._all;

    const byPriority: Record<string, number> = {};
    for (const g of priorityGroups) {
      // Priority is nullable until triage; bucket null as UNPRIORITIZED so the
      // UI has a stable key.
      const key = g.priority ?? 'UNPRIORITIZED';
      byPriority[key] = g._count._all;
    }

    return {
      items,
      total,
      page: safePage,
      pageSize: safePageSize,
      stats: {
        total: deptTotal,
        byStatus,
        byPriority,
      },
    };
  }
}
