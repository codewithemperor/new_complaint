import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { SlaClockService } from '../sla/sla-clock.service';
import { TicketStateMachine } from '../tickets/ticket-state-machine';
import { EscalationService } from './escalation.service';
import { ApproveDto, ReturnDto, EscalateDto, ReferDto } from './dtos/decision.dtos';
import { ApproverRole, AwaitingState, TicketStatus } from '../common/types/ticket-status';
import type { AuthenticatedUser } from '../common/types/authenticated-user';

type TxClient = Parameters<Parameters<PrismaService['$transaction']>[0]>[0];

/**
 * ApprovalWorkflowService — owns the approval decision flow.
 *
 * Coordinates: state-machine legality, the approval-request row update (with a
 * concurrency guard so two simultaneous decides yield one winner + one 409),
 * SLA pause/resume, the system minute + movement per decision, and the domain
 * events that drive notification emails.
 *
 * Per planning/03-ticket-workflow.md §5, every status change writes a movement;
 * per spec §6 every decision also appends a system minute.
 */
@Injectable()
export class ApprovalWorkflowService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stateMachine: TicketStateMachine,
    private readonly slaClock: SlaClockService,
    private readonly escalation: EscalationService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Approve at the current tier. HOD approval is sufficient (departmental
   * sign-off) → ticket returns to officer (APPROVED → IN_PROGRESS). PS /
   * Commissioner approvals likewise complete the chain and resume the SLA clock.
   */
  async approve(
    ticketId: string,
    dto: ApproveDto,
    user: AuthenticatedUser,
  ): Promise<{ status: string }> {
    const { request, ticket } = await this.loadAndAuthorize(ticketId, user);

    const now = new Date();
    await this.prisma.$transaction(async (tx) => {
      // Concurrency guard: only the first decide flips PENDING → APPROVED.
      // The WHERE clause ensures a second concurrent attempt updates 0 rows.
      const updated = await tx.approvalRequest.updateMany({
        where: { id: request.id, status: 'PENDING' },
        data: {
          status: 'APPROVED',
          actionedById: user.id,
          decision: dto.comment ?? null,
          decidedAt: now,
        },
      });
      if (updated.count === 0) {
        throw new ConflictException('This approval request has already been decided.');
      }

      this.stateMachine.assertCanTransition(
        ticket.status as TicketStatus,
        TicketStatus.APPROVED,
      );
      await tx.ticket.update({
        where: { id: ticketId },
        data: { status: TicketStatus.APPROVED },
      });
      // APPROVED → IN_PROGRESS (back to officer to finalise resolution, M6).
      await tx.ticket.update({
        where: { id: ticketId },
        data: { status: TicketStatus.IN_PROGRESS },
      });
      await this.slaClock.resume(tx, ticketId);

      await this.recordDecision(tx, ticketId, user, 'APPROVED', dto.comment);
    });

    this.eventEmitter.emit('ticket.approved', {
      ticketId,
      approverName: user.fullName,
      approverRole: user.role,
      comment: dto.comment,
    });
    return { status: TicketStatus.IN_PROGRESS };
  }

  /** Return to the officer with mandatory feedback. Resumes the SLA clock. */
  async return(
    ticketId: string,
    dto: ReturnDto,
    user: AuthenticatedUser,
  ): Promise<{ status: string }> {
    const { request, ticket } = await this.loadAndAuthorize(ticketId, user);

    await this.prisma.$transaction(async (tx) => {
      const updated = await tx.approvalRequest.updateMany({
        where: { id: request.id, status: 'PENDING' },
        data: {
          status: 'RETURNED',
          actionedById: user.id,
          decision: dto.comment,
          decidedAt: new Date(),
        },
      });
      if (updated.count === 0) {
        throw new ConflictException('This approval request has already been decided.');
      }

      this.stateMachine.assertCanTransition(
        ticket.status as TicketStatus,
        TicketStatus.IN_PROGRESS,
      );
      await tx.ticket.update({
        where: { id: ticketId },
        data: { status: TicketStatus.IN_PROGRESS },
      });
      await this.slaClock.resume(tx, ticketId);

      await this.recordDecision(tx, ticketId, user, 'RETURNED', dto.comment);
    });

    this.eventEmitter.emit('ticket.returned', {
      ticketId,
      approverName: user.fullName,
      approverRole: user.role,
      comment: dto.comment,
    });
    return { status: TicketStatus.IN_PROGRESS };
  }

  /**
   * Escalate to the next tier (HOD → PS, PS → Commissioner). The ticket stays
   * PENDING_APPROVAL and the *same* approval request advances its
   * `approverRole` / `currentApproverId` to the next tier — the request is
   * still in-flight, just held higher up. (The decision history is captured
   * via the movement + system minute, not by closing the request.)
   */
  async escalate(
    ticketId: string,
    dto: EscalateDto,
    user: AuthenticatedUser,
  ): Promise<{ escalatedTo: string }> {
    const { request, ticket } = await this.loadAndAuthorize(ticketId, user);

    if (ticket.status !== TicketStatus.PENDING_APPROVAL) {
      throw new BadRequestException('Only pending-approval tickets can be escalated.');
    }

    let newRole: ApproverRole;
    await this.prisma.$transaction(async (tx) => {
      // Advance FIRST (while the request is still PENDING — advance() looks up
      // the active PENDING request). It updates approverRole + currentApproverId
      // on the same row and writes the ESCALATED movement.
      const result = await this.escalation.advance(tx, ticketId, user.id, dto.reason);
      newRole = result.newApproverRole;

      // Concurrency guard: ensure nobody else decided between our load and now.
      const stillPending = await tx.approvalRequest.count({
        where: { id: request.id, status: 'PENDING' },
      });
      if (stillPending === 0) {
        throw new ConflictException('This approval request has already been decided.');
      }

      await this.recordDecision(tx, ticketId, user, 'ESCALATED', dto.reason);
    });

    const eventName =
      newRole! === ApproverRole.COMMISSIONER
        ? 'escalation.to.commissioner'
        : 'escalation.to.ps';

    this.eventEmitter.emit(eventName, {
      ticketId,
      escalatedByName: user.fullName,
      reason: dto.reason,
    });

    return { escalatedTo: newRole! };
  }

  /**
   * Refer externally (e.g. to the Public Complaints Commission). Terminal:
   * status → REFERRED. Citizen is notified naming the body.
   */
  async refer(
    ticketId: string,
    dto: ReferDto,
    user: AuthenticatedUser,
  ): Promise<{ status: string }> {
    const { request, ticket } = await this.loadAndAuthorize(ticketId, user);

    await this.prisma.$transaction(async (tx) => {
      const updated = await tx.approvalRequest.updateMany({
        where: { id: request.id, status: 'PENDING' },
        data: {
          status: 'REFERRED',
          actionedById: user.id,
          decision: dto.reason ?? null,
          referredBody: dto.referredBody,
          decidedAt: new Date(),
        },
      });
      if (updated.count === 0) {
        throw new ConflictException('This approval request has already been decided.');
      }

      this.stateMachine.assertCanTransition(
        ticket.status as TicketStatus,
        TicketStatus.REFERRED,
      );
      await tx.ticket.update({
        where: { id: ticketId },
        data: { status: TicketStatus.REFERRED },
      });

      await this.recordDecision(tx, ticketId, user, 'REFERRED', dto.reason);
    });

    this.eventEmitter.emit('external.referral', {
      ticketId,
      referredBody: dto.referredBody,
      reason: dto.reason,
    });
    return { status: TicketStatus.REFERRED };
  }

  /**
   * Load the ticket + its active PENDING approval request, and verify the
   * caller is the current approver (or an active delegate for PS).
   */
  private async loadAndAuthorize(ticketId: string, user: AuthenticatedUser) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { id: true, status: true, departmentId: true },
    });
    if (!ticket) throw new NotFoundException('Ticket not found');

    const request = await this.prisma.approvalRequest.findFirst({
      where: { ticketId, status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
    });
    if (!request) {
      throw new NotFoundException('No pending approval request for this ticket.');
    }

    await this.assertApprover(request, ticket, user);
    return { request, ticket };
  }

  /**
   * The caller must be the request's currentApprover. For the PS tier, an
   * active delegate may also act. SUPER_ADMIN bypasses.
   */
  private async assertApprover(
    request: { id: string; approverRole: string; currentApproverId: string | null },
    ticket: { departmentId: string | null },
    user: AuthenticatedUser,
  ): Promise<void> {
    const { Role } = await import('../common/types/role');
    if (user.role === Role.SUPER_ADMIN) return;

    if (request.currentApproverId === user.id) return;

    // Delegation: PS-tier request where the caller is the PS's active delegate.
    if (request.approverRole === ApproverRole.PERMANENT_SECRETARY && request.currentApproverId) {
      const now = new Date();
      const delegation = await this.prisma.delegation.findFirst({
        where: {
          delegatorId: request.currentApproverId,
          delegateId: user.id,
          isActive: true,
          validFrom: { lte: now },
          validTo: { gte: now },
        },
      });
      if (delegation) return;
    }

    throw new ForbiddenException('You are not the current approver for this ticket.');
  }

  /**
   * Append a system minute + a TicketMovement capturing the decision, per
   * spec §6 ("each decision appends a TicketMovement and a system Minute").
   */
  private async recordDecision(
    tx: TxClient,
    ticketId: string,
    user: AuthenticatedUser,
    decision: string,
    comment: string | undefined,
  ): Promise<void> {
    await tx.minute.create({
      data: {
        ticketId,
        authorId: user.id,
        body: `[${decision}] ${comment ?? ''}`.trim(),
        isInternal: true,
      },
    });
    await tx.ticketMovement.create({
      data: {
        ticketId,
        type: decision === 'APPROVED' ? 'APPROVED' : 'ESCALATED',
        fromUserId: user.id,
        note: `${decision}${comment ? ': ' + comment : ''}`,
      },
    });
  }

  /**
   * List approval requests for an approver's inbox. Filters by the caller's
   * tier (role) and optional status. Eager-loads ticket + officer for display.
   */
  async findInbox(filters: {
    approverRole?: ApproverRole;
    status?: string;
    currentApproverId?: string;
    page?: number;
    pageSize?: number;
  }) {
    const { approverRole, status, currentApproverId, page = 1, pageSize = 20 } = filters;
    const where: Record<string, unknown> = {};
    if (approverRole) where.approverRole = approverRole;
    if (status) where.status = status;
    if (currentApproverId) where.currentApproverId = currentApproverId;

    const [items, total] = await Promise.all([
      this.prisma.approvalRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          ticket: {
            select: {
              id: true,
              ticketCode: true,
              subject: true,
              priority: true,
              status: true,
              department: { select: { name: true } },
              assignedOfficer: { select: { fullName: true } },
              minutes: {
                where: { isInternal: false },
                orderBy: { createdAt: 'asc' },
                take: 1,
                select: { body: true },
              },
            },
          },
        },
      }),
      this.prisma.approvalRequest.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }
}
