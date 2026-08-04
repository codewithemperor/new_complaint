import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EmailService } from './notifications.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TicketNotificationsListener {
  private readonly logger = new Logger(TicketNotificationsListener.name);

  constructor(
    private readonly emailService: EmailService,
    private readonly prisma: PrismaService,
  ) {}

  @OnEvent('ticket.created')
  async handleTicketCreated(payload: { ticketId: string }) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: payload.ticketId },
      include: { citizen: true },
    });
    if (!ticket || !ticket.citizen?.email) {
      this.logger.warn(`ticket.created: ticket ${payload.ticketId} has no citizen email — skipping`);
      return;
    }

    const appUrl = process.env.APP_URL ?? 'http://localhost:3000';
    const trackUrl = `${appUrl}/track`;

    await this.emailService.send({
      to: ticket.citizen.email,
      subject: `Complaint received — ${ticket.ticketCode}`,
      template: 'ticket-acknowledged',
      eventId: 'TICKET_ACKNOWLEDGED',
      ticketId: ticket.id,
      context: {
        ticketCode: ticket.ticketCode,
        subject: ticket.subject,
        trackUrl,
        trackingPasscode: ticket.trackingPasscode,
        citizenName: ticket.citizen.isAnonymous ? null : ticket.citizen.name,
      },
    });
  }

  @OnEvent('ticket.assigned')
  async handleTicketAssigned(payload: { ticketId: string }) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: payload.ticketId },
      include: {
        assignedOfficer: true,
        department: true,
      },
    });
    if (!ticket) {
      this.logger.warn(`ticket.assigned: ticket ${payload.ticketId} not found — skipping`);
      return;
    }

    const appUrl = process.env.APP_URL ?? 'http://localhost:3000';

    if (ticket.assignedOfficer?.email) {
      await this.emailService.send({
        to: ticket.assignedOfficer.email,
        subject: `New ticket assigned: ${ticket.ticketCode}`,
        template: 'ticket-assigned',
        eventId: 'TICKET_ASSIGNED',
        ticketId: ticket.id,
        context: {
          ticketCode: ticket.ticketCode,
          subject: ticket.subject,
          priority: ticket.priority,
          departmentName: ticket.department?.name ?? 'N/A',
          officerName: ticket.assignedOfficer.fullName,
          queueUrl: `${appUrl}/dashboard/queue`,
        },
      });
    }

    if (ticket.departmentId) {
      const hod = await this.prisma.user.findFirst({
        where: {
          departmentId: ticket.departmentId,
          role: 'DEPARTMENT_HOD',
          isActive: true,
        },
      });

      if (hod?.email) {
        await this.emailService.send({
          to: hod.email,
          subject: `New ticket routed to your department`,
          template: 'ticket-routed',
          eventId: 'TICKET_ROUTED',
          ticketId: ticket.id,
          context: {
            ticketCode: ticket.ticketCode,
            subject: ticket.subject,
            departmentName: ticket.department?.name ?? 'N/A',
            officerName: ticket.assignedOfficer?.fullName ?? 'Unassigned',
            hodName: hod.fullName,
          },
        });
      }
    }
  }

  /**
   * Officer started investigation → notify the citizen (TICKET_STARTED).
   */
  @OnEvent('ticket.started')
  async handleTicketStarted(payload: { ticketId: string }) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: payload.ticketId },
      include: { citizen: true, department: true },
    });
    if (!ticket || !ticket.citizen?.email) {
      this.logger.warn(`ticket.started: ticket ${payload.ticketId} has no citizen email — skipping`);
      return;
    }

    const appUrl = process.env.APP_URL ?? 'http://localhost:3000';
    const trackUrl = `${appUrl}/track`;

    await this.emailService.send({
      to: ticket.citizen.email,
      subject: `Investigation started — ${ticket.ticketCode}`,
      template: 'ticket-started',
      eventId: 'TICKET_STARTED',
      ticketId: ticket.id,
      context: {
        ticketCode: ticket.ticketCode,
        subject: ticket.subject,
        departmentName: ticket.department?.name ?? 'N/A',
        trackUrl,
        citizenName: ticket.citizen.isAnonymous ? null : ticket.citizen.name,
      },
    });
  }

  /**
   * Officer requested more info from the citizen → INFO_REQUESTED (pauses SLA).
   */
  @OnEvent('ticket.info_requested')
  async handleInfoRequested(payload: {
    ticketId: string;
    requestText: string;
    deadlineAt?: Date;
  }) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: payload.ticketId },
      include: { citizen: true },
    });
    if (!ticket || !ticket.citizen?.email) {
      this.logger.warn(`ticket.info_requested: ticket ${payload.ticketId} has no citizen email — skipping`);
      return;
    }

    const appUrl = process.env.APP_URL ?? 'http://localhost:3000';
    const trackUrl = `${appUrl}/track`;

    await this.emailService.send({
      to: ticket.citizen.email,
      subject: `Information requested — ${ticket.ticketCode}`,
      template: 'info-requested',
      eventId: 'INFO_REQUESTED',
      ticketId: ticket.id,
      context: {
        ticketCode: ticket.ticketCode,
        subject: ticket.subject,
        requestText: payload.requestText,
        deadlineAt: payload.deadlineAt
          ? new Date(payload.deadlineAt).toLocaleDateString()
          : null,
        trackUrl,
        citizenName: ticket.citizen.isAnonymous ? null : ticket.citizen.name,
      },
    });
  }

  /**
   * Officer requested departmental approval → APPROVAL_REQUESTED to the HOD.
   * The decision flow (approve/reject/return) is M5.
   */
  @OnEvent('ticket.approval_requested')
  async handleApprovalRequested(payload: { ticketId: string }) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: payload.ticketId },
      include: {
        assignedOfficer: true,
        department: true,
      },
    });
    if (!ticket || !ticket.departmentId) {
      this.logger.warn(`ticket.approval_requested: ticket ${payload.ticketId} has no department — skipping`);
      return;
    }

    const hod = await this.prisma.user.findFirst({
      where: { departmentId: ticket.departmentId, role: 'DEPARTMENT_HOD', isActive: true },
    });
    if (!hod?.email) {
      this.logger.warn(`ticket.approval_requested: no active HOD for dept ${ticket.departmentId} — skipping`);
      return;
    }

    const appUrl = process.env.APP_URL ?? 'http://localhost:3000';

    await this.emailService.send({
      to: hod.email,
      subject: `Approval requested: ${ticket.ticketCode}`,
      template: 'approval-requested',
      eventId: 'APPROVAL_REQUESTED',
      ticketId: ticket.id,
      context: {
        ticketCode: ticket.ticketCode,
        subject: ticket.subject,
        priority: ticket.priority,
        departmentName: ticket.department?.name ?? 'N/A',
        officerName: ticket.assignedOfficer?.fullName ?? 'Officer',
        hodName: hod.fullName,
        inboxUrl: `${appUrl}/dashboard/approvals`,
      },
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Milestone 5 — Approval decisions & escalation
  // ─────────────────────────────────────────────────────────────────────────

  /** Approver approved → notify the assigned officer (TICKET_APPROVED). */
  @OnEvent('ticket.approved')
  async handleTicketApproved(payload: {
    ticketId: string;
    approverName: string;
    approverRole: string;
    comment?: string;
  }) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: payload.ticketId },
      include: { assignedOfficer: true },
    });
    if (!ticket?.assignedOfficer?.email) {
      this.logger.warn(`ticket.approved: no officer email — skipping`);
      return;
    }

    const appUrl = process.env.APP_URL ?? 'http://localhost:3000';
    await this.emailService.send({
      to: ticket.assignedOfficer.email,
      subject: `Approved — ${ticket.ticketCode}`,
      template: 'ticket-approved',
      eventId: 'TICKET_APPROVED',
      ticketId: ticket.id,
      context: {
        ticketCode: ticket.ticketCode,
        officerName: ticket.assignedOfficer.fullName,
        approverName: payload.approverName,
        approverRole: payload.approverRole,
        comment: payload.comment,
        queueUrl: `${appUrl}/dashboard/queue`,
      },
    });
  }

  /** Approver returned → notify the assigned officer (TICKET_RETURNED). */
  @OnEvent('ticket.returned')
  async handleTicketReturned(payload: {
    ticketId: string;
    approverName: string;
    approverRole: string;
    comment: string;
  }) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: payload.ticketId },
      include: { assignedOfficer: true },
    });
    if (!ticket?.assignedOfficer?.email) {
      this.logger.warn(`ticket.returned: no officer email — skipping`);
      return;
    }

    const appUrl = process.env.APP_URL ?? 'http://localhost:3000';
    await this.emailService.send({
      to: ticket.assignedOfficer.email,
      subject: `Returned with comments — ${ticket.ticketCode}`,
      template: 'ticket-returned',
      eventId: 'TICKET_RETURNED',
      ticketId: ticket.id,
      context: {
        ticketCode: ticket.ticketCode,
        officerName: ticket.assignedOfficer.fullName,
        approverName: payload.approverName,
        approverRole: payload.approverRole,
        comment: payload.comment,
        queueUrl: `${appUrl}/dashboard/queue`,
      },
    });
  }

  /** HOD escalated → notify the PS (ESCALATION_TO_PS). */
  @OnEvent('escalation.to.ps')
  async handleEscalationToPs(payload: {
    ticketId: string;
    escalatedByName: string;
    reason?: string;
  }) {
    await this.notifyApproverTier(payload.ticketId, 'PERMANENT_SECRETARY', {
      eventId: 'ESCALATION_TO_PS',
      template: 'escalation-to-ps',
      subjectPrefix: 'Escalation to your office',
      escalatedByName: payload.escalatedByName,
      reason: payload.reason,
      inboxRoute: '/ps/inbox',
    });
  }

  /** PS escalated → notify the Commissioner (ESCALATION_TO_COMMISSIONER). */
  @OnEvent('escalation.to.commissioner')
  async handleEscalationToCommissioner(payload: {
    ticketId: string;
    escalatedByName: string;
    reason?: string;
  }) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: payload.ticketId },
      include: { minutes: { where: { isInternal: false }, orderBy: { createdAt: 'asc' }, take: 1 } },
    });
    const summary = ticket?.minutes[0]?.body?.slice(0, 200);

    await this.notifyApproverTier(payload.ticketId, 'COMMISSIONER', {
      eventId: 'ESCALATION_TO_COMMISSIONER',
      template: 'escalation-to-commissioner',
      subjectPrefix: 'Policy matter requires your direction',
      escalatedByName: payload.escalatedByName,
      reason: payload.reason,
      summary,
      inboxRoute: '/commissioner/inbox',
    });
  }

  /** PS / Commissioner decided → notify the officer + HOD (PS_DECISION / COMMISSIONER_DECISION). */
  @OnEvent('approver.decision')
  async handleApproverDecision(payload: {
    ticketId: string;
    decidedByName: string;
    tier: 'PERMANENT_SECRETARY' | 'COMMISSIONER';
    decision: string;
    directive?: string;
  }) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: payload.ticketId },
      include: {
        assignedOfficer: true,
        department: true,
      },
    });
    if (!ticket) return;

    const appUrl = process.env.APP_URL ?? 'http://localhost:3000';
    const eventId = payload.tier === 'COMMISSIONER' ? 'COMMISSIONER_DECISION' : 'PS_DECISION';
    const template = payload.tier === 'COMMISSIONER' ? 'commissioner-decision' : 'ps-decision';
    const recipients: { email: string; name: string }[] = [];

    if (ticket.assignedOfficer?.email) {
      recipients.push({ email: ticket.assignedOfficer.email, name: ticket.assignedOfficer.fullName });
    }
    if (ticket.departmentId) {
      const hod = await this.prisma.user.findFirst({
        where: { departmentId: ticket.departmentId, role: 'DEPARTMENT_HOD', isActive: true },
      });
      if (hod?.email) recipients.push({ email: hod.email, name: hod.fullName });
    }

    for (const r of recipients) {
      await this.emailService.send({
        to: r.email,
        subject: `Directive received — ${ticket.ticketCode}`,
        template,
        eventId,
        ticketId: ticket.id,
        context: {
          ticketCode: ticket.ticketCode,
          subject: ticket.subject,
          recipientName: r.name,
          decidedByName: payload.decidedByName,
          decision: payload.decision,
          directive: payload.directive,
          queueUrl: `${appUrl}/dashboard/queue`,
        },
      });
    }
  }

  /** PS / Commissioner referred externally → notify the citizen (EXTERNAL_REFERRAL). */
  @OnEvent('external.referral')
  async handleExternalReferral(payload: {
    ticketId: string;
    referredBody: string;
    reason?: string;
  }) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: payload.ticketId },
      include: { citizen: true },
    });
    if (!ticket?.citizen?.email) {
      this.logger.warn(`external.referral: no citizen email — skipping`);
      return;
    }

    const appUrl = process.env.APP_URL ?? 'http://localhost:3000';
    const trackUrl = `${appUrl}/track`;

    await this.emailService.send({
      to: ticket.citizen.email,
      subject: `Your complaint referred to ${payload.referredBody}`,
      template: 'external-referral',
      eventId: 'EXTERNAL_REFERRAL',
      ticketId: ticket.id,
      context: {
        ticketCode: ticket.ticketCode,
        subject: ticket.subject,
        referredBody: payload.referredBody,
        reason: payload.reason,
        trackUrl,
        citizenName: ticket.citizen.isAnonymous ? null : ticket.citizen.name,
      },
    });
  }

  /**
   * Helper: resolve the active user occupying an approver tier (with delegation
   * substitution for PS) and send an escalation email to them.
   */
  private async notifyApproverTier(
    ticketId: string,
    role: 'PERMANENT_SECRETARY' | 'COMMISSIONER',
    ctx: {
      eventId: string;
      template: string;
      subjectPrefix: string;
      escalatedByName: string;
      reason?: string;
      summary?: string;
      inboxRoute: string;
    },
  ) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { id: true, ticketCode: true, subject: true },
    });
    if (!ticket) return;

    // Resolve the approver user (with PS delegation substitution).
    let approverEmail: string | undefined;
    if (role === 'PERMANENT_SECRETARY') {
      const ps = await this.prisma.user.findFirst({
        where: { role: 'PERMANENT_SECRETARY', isActive: true },
      });
      if (ps) {
        const now = new Date();
        const delegation = await this.prisma.delegation.findFirst({
          where: { delegatorId: ps.id, isActive: true, validFrom: { lte: now }, validTo: { gte: now } },
          include: { delegate: true },
        });
        approverEmail = delegation?.delegate?.email ?? ps.email ?? undefined;
      }
    } else {
      const commissioner = await this.prisma.user.findFirst({
        where: { role: 'COMMISSIONER', isActive: true },
      });
      approverEmail = commissioner?.email ?? undefined;
    }

    if (!approverEmail) {
      this.logger.warn(`${ctx.eventId}: no active ${role} user — skipping`);
      return;
    }

    const appUrl = process.env.APP_URL ?? 'http://localhost:3000';
    await this.emailService.send({
      to: approverEmail,
      subject: `${ctx.subjectPrefix} — ${ticket.ticketCode}`,
      template: ctx.template,
      eventId: ctx.eventId,
      ticketId: ticket.id,
      context: {
        ticketCode: ticket.ticketCode,
        subject: ticket.subject,
        escalatedByName: ctx.escalatedByName,
        reason: ctx.reason,
        summary: ctx.summary,
        inboxUrl: `${appUrl}${ctx.inboxRoute}`,
      },
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Milestone 6 — Resolution & Closure
  // ─────────────────────────────────────────────────────────────────────────

  /** Officer submitted a resolution → notify the citizen (TICKET_RESOLVED). */
  @OnEvent('ticket.resolved')
  async handleTicketResolved(payload: { ticketId: string }) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: payload.ticketId },
      include: { citizen: true },
    });
    if (!ticket?.citizen?.email) {
      this.logger.warn(`ticket.resolved: no citizen email — skipping`);
      return;
    }

    const appUrl = process.env.APP_URL ?? 'http://localhost:3000';
    const feedbackUrl = `${appUrl}/track`;
    const graceDays = Number(process.env.FEEDBACK_GRACE_DAYS ?? 7);
    const feedbackDeadline = ticket.feedbackGraceDueAt
      ? new Date(ticket.feedbackGraceDueAt).toLocaleDateString()
      : `${graceDays} days from now`;

    await this.emailService.send({
      to: ticket.citizen.email,
      subject: `Your complaint has been resolved — ${ticket.ticketCode}`,
      template: 'ticket-resolved',
      eventId: 'TICKET_RESOLVED',
      ticketId: ticket.id,
      context: {
        ticketCode: ticket.ticketCode,
        resolutionText: ticket.resolutionText,
        feedbackUrl,
        feedbackDeadline,
        citizenName: ticket.citizen.isAnonymous ? null : ticket.citizen.name,
      },
    });
  }

  /** Citizen confirmed satisfaction → CLOSED (TICKET_CLOSED to citizen). */
  @OnEvent('ticket.closed')
  async handleTicketClosed(payload: { ticketId: string }) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: payload.ticketId },
      include: { citizen: true },
    });
    if (!ticket?.citizen?.email) return;

    await this.emailService.send({
      to: ticket.citizen.email,
      subject: `Complaint closed — ${ticket.ticketCode}`,
      template: 'ticket-closed',
      eventId: 'TICKET_CLOSED',
      ticketId: ticket.id,
      context: {
        ticketCode: ticket.ticketCode,
        closedReason: ticket.closedReason ?? 'closed',
        citizenName: ticket.citizen.isAnonymous ? null : ticket.citizen.name,
      },
    });
  }

  /** Grace period elapsed with no feedback → auto-closed (TICKET_AUTO_CLOSED). */
  @OnEvent('ticket.auto.closed')
  async handleTicketAutoClosed(payload: { ticketId: string }) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: payload.ticketId },
      include: { citizen: true },
    });
    if (!ticket?.citizen?.email) return;

    const graceDays = Number(process.env.FEEDBACK_GRACE_DAYS ?? 7);
    await this.emailService.send({
      to: ticket.citizen.email,
      subject: `Complaint auto-closed — ${ticket.ticketCode}`,
      template: 'ticket-auto-closed',
      eventId: 'TICKET_AUTO_CLOSED',
      ticketId: ticket.id,
      context: {
        ticketCode: ticket.ticketCode,
        graceDays,
        citizenName: ticket.citizen.isAnonymous ? null : ticket.citizen.name,
      },
    });
  }

  /** Citizen rejected / reopened → notify citizen, officer, admin (TICKET_REOPENED). */
  @OnEvent('ticket.reopened')
  async handleTicketReopened(payload: {
    ticketId: string;
    reopenReason: string;
    reopenCount: number;
  }) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: payload.ticketId },
      include: { citizen: true, assignedOfficer: true, department: true },
    });
    if (!ticket) return;

    const build = (recipientName: string | null) => ({
      ticketCode: ticket.ticketCode,
      reopenReason: payload.reopenReason,
      reopenCount: payload.reopenCount,
      citizenName: recipientName,
    });

    // Citizen
    if (ticket.citizen?.email) {
      await this.emailService.send({
        to: ticket.citizen.email,
        subject: `Complaint reopened — ${ticket.ticketCode}`,
        template: 'ticket-reopened',
        eventId: 'TICKET_REOPENED',
        ticketId: ticket.id,
        context: build(ticket.citizen.isAnonymous ? null : ticket.citizen.name),
      });
    }
    // Assigned officer
    if (ticket.assignedOfficer?.email) {
      await this.emailService.send({
        to: ticket.assignedOfficer.email,
        subject: `Ticket reopened — ${ticket.ticketCode}`,
        template: 'ticket-reopened',
        eventId: 'TICKET_REOPENED',
        ticketId: ticket.id,
        context: build(ticket.assignedOfficer.fullName),
      });
    }
    // Admin complaints desk (the first ADMIN user).
    const admin = await this.prisma.user.findFirst({
      where: { role: 'ADMIN', isActive: true },
    });
    if (admin?.email) {
      await this.emailService.send({
        to: admin.email,
        subject: `Ticket reopened — ${ticket.ticketCode}`,
        template: 'ticket-reopened',
        eventId: 'TICKET_REOPENED',
        ticketId: ticket.id,
        context: build(admin.fullName),
      });
    }
  }

  /** reopenCount >= 2 → escalate to the HOD (REOPEN_ESCALATION). */
  @OnEvent('ticket.reopen_escalation')
  async handleReopenEscalation(payload: { ticketId: string; reopenCount: number }) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: payload.ticketId },
      select: { id: true, ticketCode: true, subject: true, departmentId: true },
    });
    if (!ticket?.departmentId) return;

    const hod = await this.prisma.user.findFirst({
      where: { departmentId: ticket.departmentId, role: 'DEPARTMENT_HOD', isActive: true },
    });
    if (!hod?.email) return;

    const appUrl = process.env.APP_URL ?? 'http://localhost:3000';
    await this.emailService.send({
      to: hod.email,
      subject: `Repeated reopen — review required`,
      template: 'reopen-escalation',
      eventId: 'REOPEN_ESCALATION',
      ticketId: ticket.id,
      context: {
        ticketCode: ticket.ticketCode,
        subject: ticket.subject,
        reopenCount: payload.reopenCount,
        hodName: hod.fullName,
        reviewUrl: `${appUrl}/dashboard/reopened`,
      },
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Milestone 7 — SLA warning & breach
  // ─────────────────────────────────────────────────────────────────────────

  /** 80% of SLA elapsed → warn the officer + HOD (once). */
  @OnEvent('sla.warning')
  async handleSlaWarning(payload: {
    ticketId: string;
    percentElapsed: number;
    dueAt: Date | null;
  }) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: payload.ticketId },
      include: { assignedOfficer: true, department: true },
    });
    if (!ticket) return;

    const appUrl = process.env.APP_URL ?? 'http://localhost:3000';
    const dueAt = payload.dueAt ? new Date(payload.dueAt).toLocaleString() : 'N/A';
    const recipients: { email: string; name: string }[] = [];

    if (ticket.assignedOfficer?.email) {
      recipients.push({ email: ticket.assignedOfficer.email, name: ticket.assignedOfficer.fullName });
    }
    if (ticket.departmentId) {
      const hod = await this.prisma.user.findFirst({
        where: { departmentId: ticket.departmentId, role: 'DEPARTMENT_HOD', isActive: true },
      });
      if (hod?.email) recipients.push({ email: hod.email, name: hod.fullName });
    }

    for (const r of recipients) {
      await this.emailService.send({
        to: r.email,
        subject: `SLA warning — ${ticket.ticketCode}`,
        template: 'sla-warning',
        eventId: 'SLA_WARNING',
        ticketId: ticket.id,
        context: {
          ticketCode: ticket.ticketCode,
          subject: ticket.subject,
          percentElapsed: payload.percentElapsed,
          dueAt,
          officerName: r.name,
          queueUrl: `${appUrl}/dashboard/queue`,
        },
      });
    }
  }

  /** SLA breached → notify the next-tier approver. */
  @OnEvent('sla.breach')
  async handleSlaBreach(payload: { ticketId: string; escalatedToRole: string }) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: payload.ticketId },
      select: { id: true, ticketCode: true, subject: true, departmentId: true },
    });
    if (!ticket) return;

    // Resolve the approver user for the escalated tier (reuse the same logic
    // as the escalation emails — DEPARTMENT_HOD by department, PS/COMMISSIONER global).
    let approverEmail: string | undefined;
    let approverName = 'Approver';
    if (payload.escalatedToRole === 'DEPARTMENT_HOD' && ticket.departmentId) {
      const hod = await this.prisma.user.findFirst({
        where: { departmentId: ticket.departmentId, role: 'DEPARTMENT_HOD', isActive: true },
      });
      approverEmail = hod?.email;
      approverName = hod?.fullName ?? approverName;
    } else if (payload.escalatedToRole === 'PERMANENT_SECRETARY') {
      const ps = await this.prisma.user.findFirst({ where: { role: 'PERMANENT_SECRETARY', isActive: true } });
      approverEmail = ps?.email;
      approverName = ps?.fullName ?? approverName;
    } else {
      const c = await this.prisma.user.findFirst({ where: { role: 'COMMISSIONER', isActive: true } });
      approverEmail = c?.email;
      approverName = c?.fullName ?? approverName;
    }
    if (!approverEmail) return;

    const appUrl = process.env.APP_URL ?? 'http://localhost:3000';
    const inboxRoute =
      payload.escalatedToRole === 'COMMISSIONER' ? '/commissioner/inbox'
        : payload.escalatedToRole === 'PERMANENT_SECRETARY' ? '/ps/inbox'
          : '/dashboard/approvals';

    await this.emailService.send({
      to: approverEmail,
      subject: `SLA breach escalation — ${ticket.ticketCode}`,
      template: 'sla-breach-escalation',
      eventId: 'SLA_BREACH_ESCALATION',
      ticketId: ticket.id,
      context: {
        ticketCode: ticket.ticketCode,
        subject: ticket.subject,
        approverName,
        escalatedToRole: payload.escalatedToRole,
        breachedAt: new Date().toLocaleString(),
        inboxUrl: `${appUrl}${inboxRoute}`,
      },
    });
  }
}
