import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/types/role';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/types/authenticated-user';
import { DashboardService } from './dashboard.service';

/**
 * DashboardController — the single, consolidated dashboard endpoint.
 *
 * GET /dashboard/summary returns everything a dashboard renders in one
 * role-aware response (overview stats, trend, breakdowns, department
 * performance, recent + breaching tickets, pending approvals, escalation-tier
 * counts). All figures are real DB aggregations.
 */
@ApiTags('dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(
  Role.ADMIN,
  Role.DEPARTMENT_STAFF,
  Role.DEPARTMENT_HOD,
  Role.PERMANENT_SECRETARY,
  Role.COMMISSIONER,
  Role.AUDITOR,
)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @ApiOperation({
    summary: 'Consolidated, role-aware dashboard summary (single call)',
  })
  async summary(@CurrentUser() user: AuthenticatedUser) {
    return this.dashboardService.summary(user);
  }
}
