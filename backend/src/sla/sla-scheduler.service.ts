import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { SlaPolicy } from './sla-policy';
import { SlaClockService } from './sla-clock.service';
import { EscalationService } from '../approvals/escalation.service';
import { AwaitingState, Priority, TicketStatus } from '../common/types/ticket-status';
import { EventEmitter2 } from '@nestjs/event-emitter';

/**
 * SlaScheduler — the SLA enforcement engine.
 *
 * Two idempotent hourly crons:
 *  - checkWarnings: at 80% of target, emit SLA_WARNING (once — guarded by a
 *    NotificationLog existence check).
 *  - checkBreaches: when remaining ≤ 0, set slaBreached, auto-advance one
 *    approval tier via EscalationService, emit SLA_BREACH_ESCALATION (guarded
 *    by the slaBreached flag).
 *
 * Paused tickets (awaiting != NONE) are excluded — a paused clock cannot
 * breach. Per planning/05-sla-matrix.md §5 and milestone-7 §4.1.
 *
 * Note: a Sentinel system user id is used for auto-escalation movements. The
 * EscalationService.advance expects an escalatedById; we pass a constant
 * marker. The fromUserId on the movement is nullable (SetNull), so a missing
 * system user is fine.
 */
@Injectable()
export class SlaScheduler {
  private readonly logger = new Logger(SlaScheduler.name);
  /** Marker for system-initiated movements (no real user). */
  private static readonly SYSTEM_ACTOR = '00000000-0000-0000-0000-000000000000';

  /** Active statuses whose SLA clock is running. */
  private static readonly ACTIVE_STATUSES = [
    TicketStatus.ASSIGNED,
    TicketStatus.IN_PROGRESS,
    TicketStatus.PENDING_APPROVAL,
    TicketStatus.APPROVED,
  ];

  constructor(
    private readonly prisma: PrismaService,
    private readonly policy: SlaPolicy,
    private readonly clock: SlaClockService,
    private readonly escalation: EscalationService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /** Hourly — emit SLA_WARNING at the warning threshold (idempotent). */
  @Cron(CronExpression.EVERY_HOUR)
  async checkWarnings() {
    const candidates = await this.fetchActiveClockRunning();
    let warned = 0;
    const threshold = this.policy.warningThreshold();

    for (const t of candidates) {
      if (t.slaBreached) continue;
      const remaining = await this.clock.remainingHours(t.id);
      if (remaining === null || remaining > threshold * (t.slaTargetHours ?? 0)) continue;

      // Idempotency: only warn once per ticket.
      const already = await this.prisma.notificationLog.findFirst({
        where: { ticketId: t.id, eventId: 'SLA_WARNING', status: 'SENT' },
      });
      if (already) continue;

      this.eventEmitter.emit('sla.warning', {
        ticketId: t.id,
        percentElapsed: Math.round(
          (1 - remaining / (t.slaTargetHours ?? 1)) * 100,
        ),
        dueAt: t.slaStartedAt
          ? new Date(t.slaStartedAt.getTime() + (t.slaTargetHours ?? 0) * 3600_000)
          : null,
      });
      warned++;
    }
    if (warned > 0) this.logger.log(`SLA warnings emitted: ${warned}`);
  }

  /** Hourly — detect breaches, set slaBreached, auto-escalate one tier. */
  @Cron(CronExpression.EVERY_HOUR)
  async checkBreaches() {
    const candidates = await this.fetchActiveClockRunning();
    let breached = 0;

    for (const t of candidates) {
      if (t.slaBreached) continue;
      const remaining = await this.clock.remainingHours(t.id);
      if (remaining === null || remaining > 0) continue;

      // Breach detected.
      await this.prisma.ticket.update({
        where: { id: t.id },
        data: { slaBreached: true },
      });

      await this.handleAutoEscalation(t.id, t.priority as Priority | null, t.status as TicketStatus);
      breached++;
    }
    if (breached > 0) this.logger.log(`SLA breaches processed: ${breached}`);
  }

  /**
   * Auto-escalate a breached ticket one tier. If there's an active
   * ApprovalRequest, advance it (PENDING_APPROVAL). Otherwise (ticket stuck in
   * ASSIGNED/IN_PROGRESS with no officer action), create an approval request
   * addressed to the HOD — the first escalation target. Writes an
   * AUTO_ESCALATED movement either way.
   */
  private async handleAutoEscalation(
    ticketId: string,
    priority: Priority | null,
    status: TicketStatus,
  ) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { id: true, departmentId: true },
    });
    if (!ticket) return;

    try {
      if (status === TicketStatus.PENDING_APPROVAL) {
        // Advance the existing approval chain one tier.
        await this.prisma.$transaction(async (tx) => {
          await this.escalation.advance(
            tx,
            ticketId,
            SlaScheduler.SYSTEM_ACTOR,
            'SLA breach auto-escalation',
          );
        });
      } else {
        // No active approval — escalate to the HOD (create a PENDING request).
        const hodId = await this.escalation.resolveApprover(
          'DIRECTOR' as any,
          ticket.departmentId,
        );
        await this.prisma.$transaction(async (tx) => {
          await tx.approvalRequest.create({
            data: {
              ticketId,
              requestedById: SlaScheduler.SYSTEM_ACTOR,
              approverRole: 'DIRECTOR',
              currentApproverId: hodId,
              status: 'PENDING',
            },
          });
          await tx.ticketMovement.create({
            data: {
              ticketId,
              type: 'AUTO_ESCALATED',
              toUserId: hodId,
              note: 'SLA breach auto-escalation to HOD',
            },
          });
        });
      }
    } catch (err) {
      // Already at top tier is fine; log and continue.
      this.logger.warn(`Auto-escalation for ${ticketId}: ${(err as Error).message}`);
    }

    const chain = this.policy.escalationChain(priority ?? Priority.P4);
    const escalatedToRole = chain[0] ?? 'DIRECTOR';
    this.eventEmitter.emit('sla.breach', { ticketId, escalatedToRole });
  }

  /**
   * Fetch active, clock-running tickets (awaiting = NONE, not breached unless
   * the warning check needs them). Paginated to stay bounded.
   */
  private async fetchActiveClockRunning() {
    return this.prisma.ticket.findMany({
      where: {
        status: { in: SlaScheduler.ACTIVE_STATUSES as any },
        awaiting: AwaitingState.NONE as any,
        slaStartedAt: { not: null },
        slaTargetHours: { not: null },
      },
      select: {
        id: true,
        status: true,
        priority: true,
        slaStartedAt: true,
        slaTargetHours: true,
        slaBreached: true,
      },
      take: 500,
    });
  }
}
