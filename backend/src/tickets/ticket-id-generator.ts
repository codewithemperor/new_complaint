import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Generates sequential ticket codes in the format KWMOC-YYYY-NNNNNN.
 * SQLite-safe: uses upsert instead of SELECT FOR UPDATE.
 */
@Injectable()
export class TicketIdGenerator {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Atomically reserves the next sequence number for the given year and
   * returns the formatted ticket code. Must be called inside a transaction.
   */
  async nextCode(tx: any): Promise<string> {
    const year = new Date().getFullYear();

    // SQLite doesn't support SELECT FOR UPDATE, so we use upsert.
    const seq = await tx.ticketSequence.upsert({
      where: { year },
      update: { lastValue: { increment: 1 } },
      create: { id: year, year, lastValue: 1 },
    });

    return `KWMOC-${year}-${String(seq.lastValue).padStart(6, '0')}`;
  }
}
