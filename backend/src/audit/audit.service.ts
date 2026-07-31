import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditEventType } from './audit-event-type';

interface RequestLike {
  ip?: string;
  headers?: Record<string, string | string[] | undefined>;
}

/**
 * AuditService — the single append-only audit write point + read/export API.
 *
 * Feature services call `log()` after each state change (explicit, visible —
 * chosen over a Prisma $extends interceptor for clarity per the M8 plan).
 * Writes are fire-and-forget-safe: a logging failure is caught and logged so
 * it never rolls back the business transaction it accompanies.
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(input: {
    ticketId?: string;
    actorId?: string;
    eventType: AuditEventType;
    meta?: Record<string, unknown>;
    req?: RequestLike;
  }): Promise<void> {
    try {
      await this.prisma.auditEvent.create({
        data: {
          ticketId: input.ticketId ?? null,
          actorId: input.actorId ?? null,
          eventType: input.eventType as any,
          meta: input.meta ? JSON.stringify(input.meta) : null,
          ip: input.req?.ip ?? null,
          userAgent: input.req?.headers?.['user-agent']?.toString() ?? null,
        },
      });
    } catch (err) {
      // Audit must never break the calling flow.
      this.logger.error(
        `Audit log failed for ${input.eventType}: ${(err as Error).message}`,
      );
    }
  }

  /** Filtered, paginated audit list for the auditor UI. */
  async list(query: {
    ticketId?: string;
    ticketCode?: string;
    actorId?: string;
    eventType?: string;
    from?: string;
    to?: string;
    page?: number;
    pageSize?: number;
  }) {
    const {
      ticketId, ticketCode, actorId, eventType,
      from, to, page = 1, pageSize = 50,
    } = query;

    const where: Record<string, unknown> = {};
    if (ticketId) where.ticketId = ticketId;
    if (actorId) where.actorId = actorId;
    if (eventType) where.eventType = eventType;
    if (from || to) {
      where.createdAt = {
        ...(from ? { gte: new Date(from) } : {}),
        ...(to ? { lte: new Date(to) } : {}),
      };
    }

    // ticketCode needs a join — resolve to ticketId first.
    if (ticketCode && !ticketId) {
      const t = await this.prisma.ticket.findUnique({
        where: { ticketCode },
        select: { id: true },
      });
      where.ticketId = t?.id ?? '00000000-0000-0000-0000-000000000000';
    }

    const [items, total] = await Promise.all([
      this.prisma.auditEvent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          actor: { select: { fullName: true, role: true } },
          ticket: { select: { ticketCode: true, subject: true } },
        },
      }),
      this.prisma.auditEvent.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  /** Export a ticket's (or full filtered set's) audit trail as CSV. */
  async exportCsv(query: {
    ticketId?: string;
    ticketCode?: string;
    actorId?: string;
    eventType?: string;
    from?: string;
    to?: string;
  }): Promise<string> {
    const rows = await this.list({ ...query, page: 1, pageSize: 10000 });
    const header = [
      'timestamp', 'event_type', 'ticket_code', 'actor', 'role', 'ip', 'meta',
    ].join(',');
    const lines = rows.items.map((e) =>
      [
        new Date(e.createdAt).toISOString(),
        e.eventType,
        e.ticket?.ticketCode ?? '',
        e.actor?.fullName ?? '',
        e.actor?.role ?? '',
        e.ip ?? '',
        e.meta ? String(e.meta).replace(/"/g, '""') : '',
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(','),
    );
    return [header, ...lines].join('\n');
  }
}
