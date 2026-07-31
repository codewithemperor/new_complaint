import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/types/role';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/types/authenticated-user';
import { ApprovalWorkflowService } from './approval-workflow.service';
import { DelegationsService } from './delegations.service';
import { ApproveDto, ReturnDto, EscalateDto, ReferDto } from './dtos/decision.dtos';
import { CreateDelegationDto } from './dtos/create-delegation.dto';

/**
 * ApprovalsController — the approval-chain decision endpoints.
 *
 * Role guards are permissive at the controller boundary (any approver role);
 * the service enforces that the caller is the *current* approver for the
 * specific ticket (ownership check). This keeps the tier logic in one place
 * and lets delegation resolution work transparently.
 */
@ApiTags('approvals')
@Controller()
export class ApprovalsController {
  constructor(
    private readonly workflow: ApprovalWorkflowService,
    private readonly delegations: DelegationsService,
  ) {}

  // ── Approval decisions ──────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.DIRECTOR, Role.PERMANENT_SECRETARY, Role.COMMISSIONER, Role.SUPER_ADMIN)
  @Post('tickets/:id/approve')
  @ApiOperation({ summary: 'Approve at the current tier' })
  async approve(
    @Param('id') id: string,
    @Body() dto: ApproveDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.workflow.approve(id, dto, user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.DIRECTOR, Role.PERMANENT_SECRETARY, Role.COMMISSIONER, Role.SUPER_ADMIN)
  @Post('tickets/:id/return')
  @ApiOperation({ summary: 'Return to officer with comments' })
  async return(
    @Param('id') id: string,
    @Body() dto: ReturnDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.workflow.return(id, dto, user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.DIRECTOR, Role.PERMANENT_SECRETARY, Role.SUPER_ADMIN)
  @Post('tickets/:id/escalate')
  @ApiOperation({ summary: 'Escalate to the next approval tier' })
  async escalate(
    @Param('id') id: string,
    @Body() dto: EscalateDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.workflow.escalate(id, dto, user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PERMANENT_SECRETARY, Role.COMMISSIONER, Role.SUPER_ADMIN)
  @Post('tickets/:id/refer')
  @ApiOperation({ summary: 'Refer externally (PS / Commissioner)' })
  async refer(
    @Param('id') id: string,
    @Body() dto: ReferDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.workflow.refer(id, dto, user);
  }

  // ── Approver inbox ───────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.DIRECTOR, Role.PERMANENT_SECRETARY, Role.COMMISSIONER, Role.SUPER_ADMIN)
  @Get('approval-requests')
  @ApiOperation({ summary: 'List approval requests for an approver inbox' })
  @ApiQuery({ name: 'approverRole', required: false })
  @ApiQuery({ name: 'status', required: false })
  async inbox(
    @Query('approverRole') approverRole?: string,
    @Query('status') status?: string,
    @Query('currentApproverId') currentApproverId?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.workflow.findInbox({
      approverRole: approverRole as any,
      status,
      currentApproverId: currentApproverId === 'me' ? undefined : currentApproverId,
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
    });
  }

  // ── Delegations (PS only) ─────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PERMANENT_SECRETARY, Role.SUPER_ADMIN)
  @Post('delegations')
  @ApiOperation({ summary: 'Create a delegation (PS only)' })
  async createDelegation(
    @Body() dto: CreateDelegationDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.delegations.create(dto, user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PERMANENT_SECRETARY, Role.SUPER_ADMIN, Role.DIRECTOR)
  @Get('delegations')
  @ApiOperation({ summary: 'List delegations' })
  async listDelegations(
    @Query('activeOnly') activeOnly?: string,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    return this.delegations.findMany({
      activeOnly: activeOnly === 'true',
      delegatorId: user?.role === Role.PERMANENT_SECRETARY ? user.id : undefined,
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PERMANENT_SECRETARY, Role.SUPER_ADMIN)
  @Post('delegations/:id/revoke')
  @ApiOperation({ summary: 'Revoke a delegation (PS only)' })
  async revokeDelegation(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.delegations.revoke(id, user);
  }
}
