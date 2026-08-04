import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Generates sequential ticket codes in the format KWMOC-YYYY-NNNNNN.
 * Transaction-safe: uses upsert instead of SELECT FOR UPDATE, and reconciles
 * the sequence counter against the highest existing code on each call so a
 * drifted counter (after a seed/restore/year rollover) can never hand out a
 * code that already exists.
 */
@Injectable()
export class TicketIdGenerator {
  private readonly logger = new Logger(TicketIdGenerator.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Atomically reserves the next sequence number for the current year and
   * returns the formatted ticket code. Must be called inside a transaction.
   */
  async nextCode(tx: any): Promise<string> {
    const year = new Date().getFullYear();

    // Defensive sync: find the max existing numeric suffix for this year so the
    // counter never lags behind real rows (which would cause a unique violation
    // on ticket_code). Cheap (one indexed scan on ticket_code) and rare to drift.
    const latest = await tx.ticket.findFirst({
      where: { ticketCode: { startsWith: `KWMOC-${year}-` } },
      orderBy: { ticketCode: 'desc' },
      select: { ticketCode: true },
    });
    const maxExisting = latest
      ? parseInt(latest.ticketCode.split('-').pop() ?? '0', 10) || 0
      : 0;

    const current = await tx.ticketSequence.findUnique({ where: { year } });
    const base = Math.max(current?.lastValue ?? 0, maxExisting);
    const nextValue = base + 1;

    // Upsert keeps a single row per year and persists the reconciled counter.
    await tx.ticketSequence.upsert({
      where: { year },
      update: { lastValue: nextValue },
      create: { id: year, year, lastValue: nextValue },
    });

    const code = `KWMOC-${year}-${String(nextValue).padStart(6, '0')}`;

    // If we had to jump the counter forward, surface it so it's not silent.
    if (current && nextValue > current.lastValue + 1) {
      this.logger.warn(
        `TicketSequence for ${year} jumped ${current.lastValue} → ${nextValue} (max existing code: ${maxExisting}).`,
      );
    }
    return code;
  }
}

