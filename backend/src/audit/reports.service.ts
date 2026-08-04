import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * ReportsService — read-only performance aggregations.
 *
 * Computes per-department and per-officer metrics: total tickets, counts by
 * status, average resolution hours, breach rate, reopen rate. All derived from
 * existing tables via groupBy + arithmetic — no write ownership conflict.
 */
@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Per-department performance metrics within an optional date range. */
  async departmentPerformance(from?: Date, to?: Date) {
    const dateFilter = {
      ...(from ? { gte: from } : {}),
      ...(to ? { lte: to } : {}),
    };
    const where = Object.keys(dateFilter).length ? { createdAt: dateFilter } : {};

    const departments = await this.prisma.department.findMany({
      include: {
        tickets: {
          where,
          select: {
            status: true,
            priority: true,
            slaBreached: true,
            reopenCount: true,
            resolvedAt: true,
            slaStartedAt: true,
          },
        },
      },
    });

    return departments.map((d) => {
      const total = d.tickets.length;
      const resolved = d.tickets.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED');
      const breached = d.tickets.filter((t) => t.slaBreached).length;
      const reopened = d.tickets.filter((t) => t.reopenCount > 0).length;

      const resolutionHours = resolved
        .filter((t) => t.resolvedAt && t.slaStartedAt)
        .map((t) => (t.resolvedAt!.getTime() - t.slaStartedAt!.getTime()) / 3_600_000);
      const avgResolutionHours = resolutionHours.length
        ? Math.round((resolutionHours.reduce((a, b) => a + b, 0) / resolutionHours.length) * 10) / 10
        : null;

      return {
        departmentId: d.id,
        departmentName: d.name,
        departmentCode: d.code,
        total,
        resolved: resolved.length,
        breached,
        reopened,
        avgResolutionHours,
        breachRate: total ? Math.round((breached / total) * 1000) / 10 : 0,
        reopenRate: total ? Math.round((reopened / total) * 1000) / 10 : 0,
      };
    });
  }

  /** Per-officer performance metrics within an optional date range. */
  async officerPerformance(from?: Date, to?: Date) {
    const dateFilter = {
      ...(from ? { gte: from } : {}),
      ...(to ? { lte: to } : {}),
    };
    const ticketWhere = Object.keys(dateFilter).length ? { createdAt: dateFilter } : {};

    const officers = await this.prisma.user.findMany({
      where: {
        role: { in: ['DEPARTMENT_STAFF', 'DEPARTMENT_HOD'] },
        isActive: true,
      },
      include: {
        assignedTickets: {
          where: ticketWhere,
          select: {
            status: true,
            slaBreached: true,
            reopenCount: true,
            resolvedAt: true,
            slaStartedAt: true,
          },
        },
        department: { select: { name: true } },
      },
    });

    return officers
      .filter((o) => o.assignedTickets.length > 0)
      .map((o) => {
        const total = o.assignedTickets.length;
        const resolved = o.assignedTickets.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED');
        const breached = o.assignedTickets.filter((t) => t.slaBreached).length;
        const reopened = o.assignedTickets.filter((t) => t.reopenCount > 0).length;

        const resolutionHours = resolved
          .filter((t) => t.resolvedAt && t.slaStartedAt)
          .map((t) => (t.resolvedAt!.getTime() - t.slaStartedAt!.getTime()) / 3_600_000);
        const avgResolutionHours = resolutionHours.length
          ? Math.round((resolutionHours.reduce((a, b) => a + b, 0) / resolutionHours.length) * 10) / 10
          : null;

        return {
          officerId: o.id,
          officerName: o.fullName,
          role: o.role,
          departmentName: o.department?.name ?? '—',
          total,
          resolved: resolved.length,
          breached,
          reopened,
          avgResolutionHours,
          breachRate: total ? Math.round((breached / total) * 1000) / 10 : 0,
          reopenRate: total ? Math.round((reopened / total) * 1000) / 10 : 0,
        };
      });
  }

  /** Headline system-wide totals for the reports dashboard cards. */
  async overview() {
    const [total, open, resolved, closed, breached, reopened, acknowledged, assigned, pendingApproval] = await Promise.all([
      this.prisma.ticket.count(),
      this.prisma.ticket.count({ where: { status: { in: ['ASSIGNED', 'IN_PROGRESS', 'PENDING_APPROVAL', 'APPROVED'] } } }),
      this.prisma.ticket.count({ where: { status: 'RESOLVED' } }),
      this.prisma.ticket.count({ where: { status: 'CLOSED' } }),
      this.prisma.ticket.count({ where: { slaBreached: true } }),
      this.prisma.ticket.count({ where: { reopenCount: { gt: 0 } } }),
      this.prisma.ticket.count({ where: { status: 'ACKNOWLEDGED' } }),
      this.prisma.ticket.count({ where: { status: 'ASSIGNED' } }),
      this.prisma.ticket.count({ where: { status: 'PENDING_APPROVAL' } }),
    ]);
    return { total, open, resolved, closed, breached, reopened, acknowledged, assigned, pendingApproval };
  }

  /** Daily ticket count over the last N days (default 30) for charts. */
  async trend(days: number = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    since.setHours(0, 0, 0, 0);

    const tickets = await this.prisma.ticket.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true, status: true },
      orderBy: { createdAt: 'asc' },
    });

    // Group by date
    const grouped: Record<string, { total: number; resolved: number; open: number }> = {};
    for (const t of tickets) {
      const dateKey = t.createdAt.toISOString().slice(0, 10);
      if (!grouped[dateKey]) grouped[dateKey] = { total: 0, resolved: 0, open: 0 };
      grouped[dateKey].total++;
      if (t.status === 'RESOLVED' || t.status === 'CLOSED') grouped[dateKey].resolved++;
      else grouped[dateKey].open++;
    }

    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, counts]) => ({ date, ...counts }));
  }

  /** Ticket count by department + status for pie/bar charts. */
  async statusByDepartment() {
    const departments = await this.prisma.department.findMany({
      include: {
        tickets: { select: { status: true } },
      },
    });
    return departments.map((d) => ({
      departmentName: d.name,
      acknowledged: d.tickets.filter(t => t.status === 'ACKNOWLEDGED').length,
      inProgress: d.tickets.filter(t => ['ASSIGNED', 'IN_PROGRESS', 'PENDING_APPROVAL', 'APPROVED'].includes(t.status)).length,
      resolved: d.tickets.filter(t => t.status === 'RESOLVED').length,
      closed: d.tickets.filter(t => t.status === 'CLOSED').length,
      reopened: d.tickets.filter(t => t.status === 'REOPENED').length,
    }));
  }
}
