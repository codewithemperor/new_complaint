import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SlaPolicy } from './sla-policy';
import { AwaitingState, Priority } from '../common/types/ticket-status';

/**
 * Prisma transaction client type (subset used by the clock). Using `any` here
 * matches the established pattern in RoutingService.assign — the tx client is
 * structurally identical to PrismaService but typed loosely at the seam.
 */
type TxClient = Parameters<Parameters<PrismaService['$transaction']>[0]>[0];

/** Shape of a ticket row carrying the SLA fields the clock reads/writes. */
interface SlaTicket {
  id: string;
  priority: Priority | null;
  slaStartedAt: Date | null;
  slaTargetHours: number | null;
  awaiting: AwaitingState;
}

/**
 * SlaClockService — owns the SLA clock lifecycle.
 *
 * Per planning/05-sla-matrix.md §2: elapsed time is *derived*, not stored.
 * We keep slaStartedAt + slaTargetHours (snapshot at start) + the SlaPause[]
 * rows, and compute dueAt / elapsed / remaining on demand. This is simpler and
 * stays correct across any number of pause/resume cycles.
 *
 * start() captures the target snapshot so later policy edits never move the
 * goalposts on an open ticket (§4 of the matrix).
 *
 * Pause/resume write SlaPause rows: pause opens a new row (resumes any open
 * one first so there is at most one open pause per ticket); resume closes it.
 */
@Injectable()
export class SlaClockService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly policy: SlaPolicy,
  ) {}

  /**
   * Start the clock for a ticket (officer clicks Start → IN_PROGRESS).
   * Snapshots the resolution target for the ticket's priority.
   */
  async start(tx: TxClient, ticket: SlaTicket): Promise<void> {
    const priority = ticket.priority ?? Priority.P4;
    const targetHours = this.policy.resolutionHours(priority);
    const now = new Date();

    await tx.ticket.update({
      where: { id: ticket.id },
      data: {
        slaStartedAt: now,
        slaFirstRespondedAt: now,
        slaTargetHours: targetHours,
        slaDueAt: new Date(now.getTime() + targetHours * 3600_000),
        slaPausedAt: null,
      },
    });
  }

  /**
   * Pause the clock for an out-of-officer-hands wait (info request, approval,
   * inter-dept consultation). Closes any already-open pause first.
   */
  async pause(tx: TxClient, ticketId: string, reason: AwaitingState): Promise<void> {
    const now = new Date();

    // Close any currently-open pause for this ticket.
    await tx.slaPause.updateMany({
      where: { ticketId, resumedAt: null },
      data: { resumedAt: now },
    });

    // Open a new pause interval.
    await tx.slaPause.create({
      data: { ticketId, reason, startedAt: now },
    });

    await tx.ticket.update({
      where: { id: ticketId },
      data: { slaPausedAt: now, awaiting: reason },
    });
  }

  /**
   * Resume the clock (e.g. citizen replied to an info request). Closes the
   * open pause and clears the awaiting flag.
   */
  async resume(tx: TxClient, ticketId: string): Promise<void> {
    await tx.slaPause.updateMany({
      where: { ticketId, resumedAt: null },
      data: { resumedAt: new Date() },
    });

    await tx.ticket.update({
      where: { id: ticketId },
      data: { slaPausedAt: null, awaiting: AwaitingState.NONE },
    });
  }

  /**
   * Net elapsed hours since the clock started, minus all closed pause
   * intervals. If a pause is currently open, the elapsed time stops at the
   * pause start (the clock is "off").
   */
  async elapsedHours(ticketId: string): Promise<number> {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { slaStartedAt: true },
    });
    if (!ticket?.slaStartedAt) return 0;

    const pauses = await this.prisma.slaPause.findMany({
      where: { ticketId },
      select: { startedAt: true, resumedAt: true },
    });

    const now = new Date();
    let pausedMs = 0;
    for (const p of pauses) {
      const end = p.resumedAt ?? now; // open pause: count up to now
      pausedMs += end.getTime() - p.startedAt.getTime();
    }

    const elapsedMs = now.getTime() - ticket.slaStartedAt.getTime() - pausedMs;
    return Math.max(0, elapsedMs / 3600_000);
  }

  /**
   * Remaining hours before breach. Negative ⇒ already breached. Returns null
   * if the clock hasn't started or has no target snapshot.
   */
  async remainingHours(ticketId: string): Promise<number | null> {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { slaTargetHours: true },
    });
    if (!ticket?.slaTargetHours) return null;

    const elapsed = await this.elapsedHours(ticketId);
    return ticket.slaTargetHours - elapsed;
  }
}
