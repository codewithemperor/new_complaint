import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { Role } from '../common/types/role';
import { Permission } from '../common/types/permission';
import { PrismaService } from '../prisma/prisma.service';
import { SlaPolicy } from './sla-policy';
import { SlaClockService } from './sla-clock.service';
import { UpdateSlaConfigDto } from './update-sla-config.dto';
import { TicketStatus } from '../common/types/ticket-status';

/**
 * SlaController — SLA dashboards + admin config.
 *
 *  - GET /sla/breaching   — admin SLA breach dashboard data.
 *  - GET /sla/config      — the SlaConfig matrix (admin).
 *  - PATCH /sla/config/:priority — edit one priority's targets (Super Admin).
 */
@ApiTags('sla')
@Controller('sla')
export class SlaController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly policy: SlaPolicy,
    private readonly clock: SlaClockService,
  ) {}

  /** Active tickets with SLA data for the breach dashboard. */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.AUDITOR)
  @Get('breaching')
  @ApiOperation({ summary: 'SLA breach dashboard (admin)' })
  async breaching(@Query('view') view?: string) {
    const statuses = [
      TicketStatus.ASSIGNED,
      TicketStatus.IN_PROGRESS,
      TicketStatus.PENDING_APPROVAL,
      TicketStatus.APPROVED,
    ];
    const tickets = await this.prisma.ticket.findMany({
      where: { status: { in: statuses as any }, slaStartedAt: { not: null } },
      orderBy: { slaBreached: 'desc' },
      take: 200,
      include: {
        department: { select: { name: true } },
        assignedOfficer: { select: { fullName: true } },
      },
    });

    // Enrich with live remaining hours.
    const enriched = await Promise.all(
      tickets.map(async (t) => ({
        ...t,
        slaRemainingHours: t.slaTargetHours ? await this.clock.remainingHours(t.id) : null,
      })),
    );

    // Filter by view if requested.
    let result = enriched;
    if (view === 'breached') {
      result = enriched.filter((t) => t.slaBreached);
    } else if (view === 'warning') {
      const threshold = this.policy.warningThreshold();
      result = enriched.filter(
        (t) => !t.slaBreached && (t.slaRemainingHours ?? 0) <= threshold * (t.slaTargetHours ?? 0),
      );
    }

    return { items: result, total: result.length };
  }

  /** The SLA config matrix (escalationChain parsed to an array for the UI). */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.AUDITOR)
  @Get('config')
  @ApiOperation({ summary: 'SLA config matrix (admin)' })
  async config() {
    const rows = await this.prisma.slaConfig.findMany({ orderBy: { priority: 'asc' } });
    // escalationChain is stored as a JSON string; parse it so the client can
    // treat it as an array directly.
    return rows.map((r) => ({
      ...r,
      escalationChain:
        typeof r.escalationChain === 'string'
          ? JSON.parse(r.escalationChain as string)
          : r.escalationChain,
    }));
  }

  /** Edit one priority's SLA config (Super Admin / ADMIN with SLA). Invalidates the cache. */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Permissions(Permission.SLA)
  @Patch('config/:priority')
  @ApiOperation({ summary: 'Update SLA config for a priority (Super Admin)' })
  async updateConfig(
    @Param('priority') priority: string,
    @Body() dto: UpdateSlaConfigDto,
  ) {
    const updated = await this.prisma.slaConfig.upsert({
      where: { priority: priority as any },
      update: {
        firstResponseHours: dto.firstResponseHours,
        resolutionHours: dto.resolutionHours,
        warningThreshold: dto.warningThreshold,
        escalationChain: JSON.stringify(dto.escalationChain),
      },
      create: {
        priority: priority as any,
        firstResponseHours: dto.firstResponseHours,
        resolutionHours: dto.resolutionHours,
        warningThreshold: dto.warningThreshold,
        escalationChain: JSON.stringify(dto.escalationChain),
      },
    });
    await this.policy.invalidate();
    return updated;
  }
}
