import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReportsService } from '../audit/reports.service';
import { Role } from '../common/types/role';
import type { AuthenticatedUser } from '../common/types/authenticated-user';

/**
 * DashboardService — a single role-aware aggregation endpoint that returns
 * everything a dashboard needs in one response, replacing the previous pattern
 * of 3–4 separate /reports/* + /tickets + /approval-requests calls per page.
 *
 * All numbers are real DB aggregations (groupBy / count) — no fabricated or
 * mocked figures. The shape adapts to the caller's role so each dashboard
 * only receives the slices it renders.
 */
@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reports: ReportsService,
  ) {}

  async summary(user: AuthenticatedUser) {
    const [
      overview,
      trend,
      statusByDepartment,
      priorityBreakdown,
      channelBreakdown,
      statusBreakdown,
      departmentPerformance,
      recent,
      breaching,
      pendingApprovals,
      officerPerformance,
    ] = await Promise.all([
      this.reports.overview(),
      this.reports.trend(30).catch(() => []),
      this.reports.statusByDepartment().catch(() => []),
      this.groupBreakdown('priority'),
      this.groupBreakdown('channel'),
      this.groupBreakdown('status'),
      this.reports.departmentPerformance().catch(() => []),
      this.recentTickets(user),
      this.breachingTickets(),
      this.pendingApprovalsFor(user),
      this.maybeOfficerPerformance(user),
    ]);

    return {
      overview,
      trend,
      statusByDepartment,
      breakdowns: {
        priority: priorityBreakdown,
        channel: channelBreakdown,
        status: statusBreakdown,
      },
      departmentPerformance,
      recent,
      breaching,
      pendingApprovals,
      officerPerformance,
      // Escalation-tier counts (real): how many approval requests are sitting
      // at each tier right now.
      escalations: await this.escalationTierCounts(),
    };
  }

  /** GroupBy a scalar Ticket column (priority/channel/status), excluding archived. */
  private async groupBreakdown(
    field: 'priority' | 'channel' | 'status',
  ): Promise<{ key: string; count: number }[]> {
    const rows = await this.prisma.ticket.groupBy({
      by: [field],
      _count: { _all: true },
      where: { archived: false },
    });
    return rows
      .map((r) => ({
        key: String(r[field] ?? 'UNSPECIFIED'),
        count: r._count._all,
      }))
      .sort((a, b) => b.count - a.count);
  }

  /** The most recent non-archived tickets, scoped to the caller's visibility. */
  private async recentTickets(user: AuthenticatedUser) {
    const where = this.visibilityFilter(user);
    const tickets = await this.prisma.ticket.findMany({
      where: { ...where, archived: false },
      orderBy: { createdAt: 'desc' },
      take: 8,
      select: {
        id: true,
        ticketCode: true,
        subject: true,
        status: true,
        priority: true,
        createdAt: true,
        slaBreached: true,
        department: { select: { name: true } },
        assignedOfficer: { select: { fullName: true } },
      },
    });
    return tickets;
  }

  /** Active SLA-clock tickets, worst (most-breached) first. */
  private async breachingTickets() {
    const tickets = await this.prisma.ticket.findMany({
      where: {
        archived: false,
        status: {
          in: ['ASSIGNED', 'IN_PROGRESS', 'PENDING_APPROVAL', 'APPROVED'],
        },
        slaStartedAt: { not: null },
      },
      orderBy: { slaBreached: 'desc' },
      take: 10,
      select: {
        id: true,
        ticketCode: true,
        subject: true,
        priority: true,
        status: true,
        slaBreached: true,
        slaDueAt: true,
        slaTargetHours: true,
        department: { select: { name: true } },
      },
    });
    return tickets;
  }

  /** Pending approval requests visible to an approver-tier caller. */
  private async pendingApprovalsFor(user: AuthenticatedUser) {
    // Only approver roles get a pending-approvals slice.
    if (
      ![
        Role.DEPARTMENT_HOD,
        Role.PERMANENT_SECRETARY,
        Role.COMMISSIONER,
      ].includes(user.role) &&
      !user.isSuperAdmin
    ) {
      return { items: [], total: 0 };
    }

    const approverRole = this.approverTierFor(user);
    const where: Record<string, unknown> = { status: 'PENDING' };
    if (approverRole) where.approverRole = approverRole;

    const [items, total] = await Promise.all([
      this.prisma.approvalRequest.findMany({
        where,
        orderBy: { createdAt: 'asc' },
        take: 10,
        include: {
          ticket: {
            select: {
              id: true,
              ticketCode: true,
              subject: true,
              priority: true,
              status: true,
              department: { select: { name: true } },
            },
          },
        },
      }),
      this.prisma.approvalRequest.count({ where }),
    ]);
    return { items, total };
  }

  /** Officer performance is only relevant for admin/auditor dashboards. */
  private async maybeOfficerPerformance(user: AuthenticatedUser) {
    if (
      user.role !== Role.ADMIN &&
      user.role !== Role.AUDITOR &&
      !user.isSuperAdmin
    ) {
      return [];
    }
    return this.reports.officerPerformance().catch(() => []);
  }

  /** Real count of pending approval requests per escalation tier. */
  private async escalationTierCounts() {
    const rows = await this.prisma.approvalRequest.groupBy({
      by: ['approverRole'],
      _count: { _all: true },
      where: { status: 'PENDING' },
    });
    return rows.map((r) => ({
      tier: String(r.approverRole),
      count: r._count._all,
    }));
  }

  /** Map an approver user to the single tier they decide at. */
  private approverTierFor(user: AuthenticatedUser): string | undefined {
    switch (user.role) {
      case Role.DEPARTMENT_HOD:
        return 'DEPARTMENT_HOD';
      case Role.PERMANENT_SECRETARY:
        return 'PERMANENT_SECRETARY';
      case Role.COMMISSIONER:
        return 'COMMISSIONER';
      default:
        return undefined; // Super Admin / others: see all tiers.
    }
  }

  /**
   * Visibility filter for "recent tickets". Department staff/HODs see their own
   * department; everyone else (admin, PS, commissioner, auditor) sees all.
   */
  private visibilityFilter(user: AuthenticatedUser): Record<string, unknown> {
    if (
      (user.role === Role.DEPARTMENT_STAFF ||
        user.role === Role.DEPARTMENT_HOD) &&
      user.departmentId
    ) {
      return { departmentId: user.departmentId };
    }
    return {};
  }
}
