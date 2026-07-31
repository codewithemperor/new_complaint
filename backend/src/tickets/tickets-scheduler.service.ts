import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { TicketsService } from './tickets.service';
import { AuditService } from '../audit/audit.service';
import { AuditEventType } from '../audit/audit-event-type';
import { EventEmitter2 } from '@nestjs/event-emitter';

/**
 * TicketsScheduler — time-based ticket lifecycle jobs.
 *
 *  - Daily 02:00: auto-close resolved tickets past the feedback grace (M6).
 *  - Daily 03:00: archive closed tickets older than ARCHIVE_RETENTION_DAYS (M8).
 *
 * Both are idempotent by construction (the WHERE clause excludes already-
 * processed rows). Per planning/milestone-6 §4.4 and milestone-8 §4.4.
 */
@Injectable()
export class TicketsScheduler {
  private readonly logger = new Logger(TicketsScheduler.name);

  constructor(
    private readonly ticketsService: TicketsService,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly audit: AuditService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /** Daily 02:00 — auto-close resolved tickets past the feedback grace. */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async autoCloseOverdue() {
    this.logger.log('Running daily auto-close sweep…');
    try {
      const closed = await this.ticketsService.autoCloseOverdue();
      this.logger.log(`Auto-close complete: ${closed} ticket(s) closed.`);
    } catch (err) {
      this.logger.error(`Auto-close failed: ${(err as Error).message}`);
    }
  }

  /** Daily 03:00 — archive closed tickets past the retention window. */
  @Cron('0 3 * * *')
  async archiveRetained() {
    this.logger.log('Running daily archival sweep…');
    try {
      const days = this.config.get<number>('ARCHIVE_RETENTION_DAYS') ?? 90;
      const cutoff = new Date(Date.now() - days * 24 * 3_600_000);
      const retained = await this.prisma.ticket.findMany({
        where: { status: 'CLOSED', closedAt: { lt: cutoff }, archived: false },
        select: { id: true },
      });
      for (const t of retained) {
        await this.prisma.ticket.update({
          where: { id: t.id },
          data: { archived: true, archivedAt: new Date() },
        });
        await this.audit.log({
          ticketId: t.id,
          eventType: AuditEventType.TICKET_ARCHIVED,
          meta: { reason: 'retention', days },
        });
      }
      this.logger.log(`Archival complete: ${retained.length} ticket(s) archived.`);
    } catch (err) {
      this.logger.error(`Archival failed: ${(err as Error).message}`);
    }
  }
}
