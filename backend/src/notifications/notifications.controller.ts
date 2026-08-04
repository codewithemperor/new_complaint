import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/types/authenticated-user';
import { PrismaService } from '../prisma/prisma.service';

/**
 * NotificationsController — actionable item count + list for the topbar bell.
 *
 * Each role sees a different set of "actionable" items based on their workflow.
 * No NotificationLog writes here — this is read-only aggregation.
 */
@ApiTags('notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('count')
  @ApiOperation({ summary: 'Count of actionable items for the current user' })
  async count(@CurrentUser() user: AuthenticatedUser) {
    const count = await this.getActionableCount(user);
    return { count };
  }

  @Get('list')
  @ApiOperation({ summary: 'List actionable items for the notification dropdown' })
  async list(@CurrentUser() user: AuthenticatedUser) {
    const items = await this.getActionableItems(user);
    return items;
  }

  private async getActionableCount(user: AuthenticatedUser): Promise<number> {
    const role = user.role;

    // Admin: tickets awaiting classification
    if (role === 'ADMIN') {
      return this.prisma.ticket.count({
        where: { status: 'ACKNOWLEDGED' },
      });
    }

    // HOD: pending approval requests addressed to them
    if (role === 'DEPARTMENT_HOD') {
      return this.prisma.approvalRequest.count({
        where: {
          currentApproverId: user.id,
          status: 'PENDING',
          approverRole: 'DEPARTMENT_HOD',
        },
      });
    }

    // PS / Commissioner: escalated approvals + breached tickets
    if (['PERMANENT_SECRETARY', 'COMMISSIONER'].includes(role)) {
      const escalationRole = role === 'PERMANENT_SECRETARY'
        ? 'PERMANENT_SECRETARY'
        : 'COMMISSIONER';

      const [escalated, breached] = await Promise.all([
        this.prisma.approvalRequest.count({
          where: {
            approverRole: escalationRole as any,
            status: 'PENDING',
          },
        }),
        this.prisma.ticket.count({
          where: { slaBreached: true, status: { not: 'CLOSED' } },
        }),
      ]);
      return escalated + breached;
    }

    // Department staff: their active tickets
    if (role === 'DEPARTMENT_STAFF') {
      return this.prisma.ticket.count({
        where: {
          assignedOfficerId: user.id,
          status: { in: ['ASSIGNED', 'IN_PROGRESS', 'PENDING_APPROVAL', 'APPROVED', 'REOPENED'] },
        },
      });
    }

    return 0;
  }

  private async getActionableItems(user: AuthenticatedUser) {
    const role = user.role;
    const take = 20;

    // Admin: unclassified tickets
    if (role === 'ADMIN') {
      const tickets = await this.prisma.ticket.findMany({
        where: { status: 'ACKNOWLEDGED' },
        orderBy: { createdAt: 'asc' },
        take,
        select: {
          id: true,
          ticketCode: true,
          subject: true,
          status: true,
          createdAt: true,
        },
      });
      return tickets.map((t) => ({
        id: t.id,
        ticketCode: t.ticketCode,
        subject: t.subject,
        status: t.status,
        action: 'Needs classification',
        createdAt: t.createdAt.toISOString(),
        link: `/dashboard/triage`,
      }));
    }

    // HOD: pending approvals
    if (role === 'DEPARTMENT_HOD') {
      const approvals = await this.prisma.approvalRequest.findMany({
        where: {
          currentApproverId: user.id,
          status: 'PENDING',
          approverRole: 'DEPARTMENT_HOD',
        },
        orderBy: { createdAt: 'asc' },
        take,
        include: {
          ticket: { select: { id: true, ticketCode: true, subject: true, status: true } },
        },
      });
      return approvals.map((a) => ({
        id: a.id,
        ticketCode: a.ticket.ticketCode,
        subject: a.ticket.subject,
        status: a.ticket.status,
        action: 'Approval requested',
        createdAt: a.createdAt.toISOString(),
        link: `/dashboard/approvals`,
      }));
    }

    // PS / Commissioner: escalated approvals
    if (['PERMANENT_SECRETARY', 'COMMISSIONER'].includes(role)) {
      const escalationRole = role === 'PERMANENT_SECRETARY'
        ? 'PERMANENT_SECRETARY'
        : 'COMMISSIONER';

      const approvals = await this.prisma.approvalRequest.findMany({
        where: {
          approverRole: escalationRole as any,
          status: 'PENDING',
        },
        orderBy: { createdAt: 'asc' },
        take,
        include: {
          ticket: { select: { id: true, ticketCode: true, subject: true, status: true } },
        },
      });

      return approvals.map((a) => ({
        id: a.id,
        ticketCode: a.ticket.ticketCode,
        subject: a.ticket.subject,
        status: a.ticket.status,
        action: 'Escalated for decision',
        createdAt: a.createdAt.toISOString(),
        link: `/dashboard/approvals`,
      }));
    }

    // Department staff: their active tickets
    if (role === 'DEPARTMENT_STAFF') {
      const tickets = await this.prisma.ticket.findMany({
        where: {
          assignedOfficerId: user.id,
          status: { in: ['ASSIGNED', 'IN_PROGRESS', 'PENDING_APPROVAL', 'APPROVED', 'REOPENED'] },
        },
        orderBy: { updatedAt: 'desc' },
        take,
        select: {
          id: true,
          ticketCode: true,
          subject: true,
          status: true,
          createdAt: true,
        },
      });
      return tickets.map((t) => ({
        id: t.id,
        ticketCode: t.ticketCode,
        subject: t.subject,
        status: t.status,
        action: t.status === 'ASSIGNED' ? 'Start investigation' : `Status: ${t.status}`,
        createdAt: t.createdAt.toISOString(),
        link: `/dashboard/complaints/${t.id}`,
      }));
    }

    return [];
  }
}
