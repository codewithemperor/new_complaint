import {
  Controller,
  Get,
  Query,
  Res,
  UseGuards,
  Header,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/types/role';
import { AuditService } from './audit.service';
import { ReportsService } from './reports.service';

/**
 * AuditController — read-only audit log, CSV export, and performance reports.
 *
 * Accessible to ADMIN_OFFICER, senior approvers, SUPER_ADMIN, and AUDITOR.
 */
@ApiTags('audit')
@Controller()
export class AuditController {
  constructor(
    private readonly auditService: AuditService,
    private readonly reportsService: ReportsService,
  ) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    Role.ADMIN_OFFICER, Role.DIRECTOR, Role.PERMANENT_SECRETARY,
    Role.COMMISSIONER, Role.SUPER_ADMIN, Role.AUDITOR,
  )
  @Get('audit-events')
  @ApiOperation({ summary: 'List audit events (filtered/paginated)' })
  async list(
    @Query('ticketId') ticketId?: string,
    @Query('ticketCode') ticketCode?: string,
    @Query('actorId') actorId?: string,
    @Query('eventType') eventType?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.auditService.list({
      ticketId, ticketCode, actorId, eventType, from, to,
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    Role.ADMIN_OFFICER, Role.DIRECTOR, Role.PERMANENT_SECRETARY,
    Role.COMMISSIONER, Role.SUPER_ADMIN, Role.AUDITOR,
  )
  @Get('audit-events/export')
  @Header('Content-Type', 'text/csv')
  @ApiOperation({ summary: 'Export audit events as CSV' })
  async exportCsv(
    @Res() res: Response,
    @Query('ticketId') ticketId?: string,
    @Query('ticketCode') ticketCode?: string,
    @Query('actorId') actorId?: string,
    @Query('eventType') eventType?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const csv = await this.auditService.exportCsv({ ticketId, ticketCode, actorId, eventType, from, to });
    const filename = ticketCode ? `audit-${ticketCode}.csv` : 'audit-events.csv';
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    Role.ADMIN_OFFICER, Role.DIRECTOR, Role.PERMANENT_SECRETARY,
    Role.COMMISSIONER, Role.SUPER_ADMIN, Role.AUDITOR,
  )
  @Get('reports/overview')
  @ApiOperation({ summary: 'System-wide report totals' })
  async overview() {
    return this.reportsService.overview();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    Role.ADMIN_OFFICER, Role.DIRECTOR, Role.PERMANENT_SECRETARY,
    Role.COMMISSIONER, Role.SUPER_ADMIN, Role.AUDITOR,
  )
  @Get('reports/department-performance')
  @ApiOperation({ summary: 'Per-department performance metrics' })
  async departmentPerformance(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.reportsService.departmentPerformance(
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    Role.ADMIN_OFFICER, Role.DIRECTOR, Role.PERMANENT_SECRETARY,
    Role.COMMISSIONER, Role.SUPER_ADMIN, Role.AUDITOR,
  )
  @Get('reports/officer-performance')
  @ApiOperation({ summary: 'Per-officer performance metrics' })
  async officerPerformance(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.reportsService.officerPerformance(
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    Role.ADMIN_OFFICER, Role.DIRECTOR, Role.PERMANENT_SECRETARY,
    Role.COMMISSIONER, Role.SUPER_ADMIN, Role.AUDITOR,
  )
  @Get('reports/trend')
  @ApiOperation({ summary: 'Daily complaints trend over N days' })
  async trend(@Query('days') days?: string) {
    return this.reportsService.trend(days ? parseInt(days, 10) : undefined);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    Role.ADMIN_OFFICER, Role.DIRECTOR, Role.PERMANENT_SECRETARY,
    Role.COMMISSIONER, Role.SUPER_ADMIN, Role.AUDITOR,
  )
  @Get('reports/status-by-department')
  @ApiOperation({ summary: 'Ticket counts by department and status' })
  async statusByDepartment() {
    return this.reportsService.statusByDepartment();
  }
}
