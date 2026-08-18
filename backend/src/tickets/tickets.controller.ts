import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TicketsService, StoredAttachment } from './tickets.service';
import { CreateTicketDto } from './dtos/create-ticket.dto';
import { TrackTicketDto } from './dtos/track-ticket.dto';
import { TrackFeedbackDto } from './dtos/track-feedback.dto';
import { TriageTicketDto } from './dtos/triage-ticket.dto';
import { PostMinuteDto } from './dtos/post-minute.dto';
import { RequestInfoDto } from './dtos/request-info.dto';
import { CitizenInfoReplyDto } from './dtos/citizen-info-reply.dto';
import { SubmitResolutionDto } from './dtos/submit-resolution.dto';
import { FeedbackDto } from './dtos/feedback.dto';
import { ReopenDto } from './dtos/reopen.dto';
import { Public } from '../common/decorators/is-public.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { Role } from '../common/types/role';
import { Permission } from '../common/types/permission';
import { Priority, TicketStatus } from '../common/types/ticket-status';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/types/authenticated-user';
import { TrackingTokenGuard } from '../common/guards/tracking-token.guard';
import { TrackingPayload } from '../common/decorators/tracking-payload.decorator';
import type { TrackingTokenPayload } from './tracking-token.service';
import { STORAGE_SERVICE, StorageService } from '../storage/storage.service';

const MAX_FILES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

@ApiTags('tickets')
@Controller('tickets')
export class TicketsController {
  constructor(
    private readonly ticketsService: TicketsService,
    @Inject(STORAGE_SERVICE) private readonly storage: StorageService,
  ) {}

  /**
   * Public endpoint: citizen self-service submission.
   */
  @Public()
  @Post()
  @UseInterceptors(
    FilesInterceptor('attachments', MAX_FILES, { limits: { fileSize: MAX_FILE_SIZE } }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Submit a complaint (public)' })
  @ApiResponse({ status: 201, description: 'Ticket created' })
  async createPublic(
    @Body() dto: CreateTicketDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const stored = await this.persistFiles(files);
    const result = await this.ticketsService.create(dto, stored);
    return { ticketCode: result.ticketCode, id: result.id, trackingPasscode: result.trackingPasscode };
  }

  /**
   * Protected endpoint: an Admin (with INTAKE) logs a complaint on behalf of a citizen.
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Permissions(Permission.INTAKE)
  @Post('intake')
  @UseInterceptors(
    FilesInterceptor('attachments', MAX_FILES, { limits: { fileSize: MAX_FILE_SIZE } }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Intake officer logs a complaint on behalf of a citizen' })
  async createIntake(
    @Body() dto: CreateTicketDto,
    @UploadedFiles() files: Express.Multer.File[],
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const stored = await this.persistFiles(files);
    const result = await this.ticketsService.create(dto, stored, user.id);
    return { ticketCode: result.ticketCode, id: result.id, trackingPasscode: result.trackingPasscode };
  }

  /**
   * Staff ticket listing with filters (triage queue, officer queue, etc.).
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    Role.ADMIN, Role.DEPARTMENT_STAFF, Role.DEPARTMENT_HOD,
    Role.PERMANENT_SECRETARY, Role.COMMISSIONER, Role.AUDITOR,
  )
  @Get()
  @ApiOperation({ summary: 'List tickets with filters (staff)' })
  @ApiQuery({ name: 'status', required: false, enum: TicketStatus })
  @ApiQuery({ name: 'departmentId', required: false })
  @ApiQuery({ name: 'assignedOfficerId', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  async list(
    @Query('status') status?: TicketStatus,
    @Query('departmentId') departmentId?: string,
    @Query('assignedOfficerId') assignedOfficerId?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    return this.ticketsService.findMany({
      status,
      departmentId,
      assignedOfficerId,
      requesterId: user?.id,
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
    });
  }

  /**
   * Triage an ACKNOWLEDGED ticket: classify, prioritize, route.
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Permissions(Permission.INTAKE, Permission.SCHEDULE)
  @Patch(':id/triage')
  @ApiOperation({ summary: 'Triage a ticket (Admin Officer / Super Admin)' })
  async triage(
    @Param('id') id: string,
    @Body() dto: TriageTicketDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.ticketsService.triage(id, dto, user);
  }

  /**
   * Public tracking view for citizens (passcode-based, no JWT needed).
   */
  @Public()
  @Post('track')
  @ApiOperation({ summary: 'Track a complaint by code + passcode (citizen)' })
  async trackByPasscodePost(@Body() dto: TrackTicketDto) {
    return this.ticketsService.findByCodeWithPasscode(dto.code, dto.passcode);
  }

  @Public()
  @Post('track/feedback')
  @ApiOperation({ summary: 'Submit complaint feedback by code + passcode (citizen)' })
  async submitFeedbackByPasscode(@Body() dto: TrackFeedbackDto) {
    return this.ticketsService.submitFeedbackWithPasscode(dto.code, dto.passcode, dto);
  }

  @Public()
  @Get('track')
  @ApiOperation({ summary: 'Track a complaint by code + passcode (citizen, legacy GET)' })
  async trackByPasscode(
    @Query('code') code: string,
    @Query('passcode') passcode: string,
  ) {
    return this.ticketsService.findByCodeWithPasscode(code, passcode);
  }

  /**
   * Public tracking view for citizens (token-authenticated, legacy).
   */
  @Public()
  @UseGuards(TrackingTokenGuard)
  @Get(':code/track')
  @ApiOperation({ summary: 'Track a complaint by code + tracking token (citizen)' })
  async track(
    @Param('code') code: string,
    @TrackingPayload() payload: TrackingTokenPayload,
    @Query('token') _token: string,
  ) {
    return this.ticketsService.findByCodeForCitizen(code, payload.citizenId);
  }

  /**
   * Staff ticket detail (JWT-authenticated) — enriched with minutes, SLA, pauses.
   */
  @UseGuards(JwtAuthGuard)
  @Get(':id/detail')
  @ApiOperation({ summary: 'Get full ticket detail (staff)' })
  async detail(@Param('id') id: string) {
    return this.ticketsService.findDetailForStaff(id);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Officer investigation endpoints (Milestone 4 — Phase 3)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Start or resume investigation on an ASSIGNED/REOPENED ticket → IN_PROGRESS.
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    Role.DEPARTMENT_STAFF, Role.DEPARTMENT_HOD,
  )
  @Patch(':id/start')
  @ApiOperation({ summary: 'Start investigation (officer)' })
  async start(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.ticketsService.start(id, user);
  }

  /**
   * Append a minute to the investigation sheet (append-only).
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    Role.DEPARTMENT_STAFF, Role.DEPARTMENT_HOD,
  )
  @Post(':id/minutes')
  @ApiOperation({ summary: 'Post an investigation minute (officer)' })
  async postMinute(
    @Param('id') id: string,
    @Body() dto: PostMinuteDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.ticketsService.postMinute(id, dto, user);
  }

  /**
   * Request more information from the citizen — pauses the SLA clock.
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    Role.DEPARTMENT_STAFF, Role.DEPARTMENT_HOD,
  )
  @Post(':id/request-info')
  @ApiOperation({ summary: 'Request info from citizen (officer)' })
  async requestInfo(
    @Param('id') id: string,
    @Body() dto: RequestInfoDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.ticketsService.requestInfo(id, dto, user);
  }

  /**
   * Request departmental approval (→ PENDING_APPROVAL). Pauses SLA, creates a
   * PENDING ApprovalRequest addressed to the HOD. Decision flow is M5.
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    Role.DEPARTMENT_STAFF, Role.DEPARTMENT_HOD,
  )
  @Patch(':id/request-approval')
  @ApiOperation({ summary: 'Request departmental approval (officer)' })
  async requestApproval(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.ticketsService.requestApproval(id, user);
  }

  /**
   * Citizen replies to an info request (public, token-authenticated). Resumes
   * the SLA clock.
   */
  @Public()
  @UseGuards(TrackingTokenGuard)
  @Post(':code/info')
  @ApiOperation({ summary: 'Citizen replies to an info request (public, token-auth)' })
  async replyInfo(
    @Param('code') code: string,
    @Body() dto: CitizenInfoReplyDto,
    @TrackingPayload() payload: TrackingTokenPayload,
    @Query('token') _token: string,
  ) {
    return this.ticketsService.replyInfo(code, payload.citizenId, dto);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Resolution & Closure endpoints (Milestone 6 — Phases 6 & 7)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Officer submits a resolution → RESOLVED (starts feedback grace clock).
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    Role.DEPARTMENT_STAFF, Role.DEPARTMENT_HOD,
  )
  @Post(':id/resolution')
  @ApiOperation({ summary: 'Submit a resolution (officer)' })
  async submitResolution(
    @Param('id') id: string,
    @Body() dto: SubmitResolutionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.ticketsService.submitResolution(id, dto, user);
  }

  /**
   * Citizen submits feedback (public, token-auth). Satisfied → CLOSED;
   * not satisfied → REOPENED.
   */
  @Public()
  @UseGuards(TrackingTokenGuard)
  @Post(':code/feedback')
  @ApiOperation({ summary: 'Citizen submits resolution feedback (public, token-auth)' })
  async submitFeedback(
    @Param('code') code: string,
    @Body() dto: FeedbackDto,
    @TrackingPayload() payload: TrackingTokenPayload,
    @Query('token') _token: string,
  ) {
    return this.ticketsService.submitFeedback(code, payload.citizenId, dto);
  }

  /**
   * Citizen explicit reopen (public, token-auth). Subject to the 14-day window.
   */
  @Public()
  @UseGuards(TrackingTokenGuard)
  @Post(':code/reopen')
  @ApiOperation({ summary: 'Citizen reopens a resolved complaint (public, token-auth)' })
  async reopen(
    @Param('code') code: string,
    @Body() dto: ReopenDto,
    @TrackingPayload() payload: TrackingTokenPayload,
    @Query('token') _token: string,
  ) {
    return this.ticketsService.reopen(code, payload.citizenId, dto);
  }

  /**
   * Archive a closed ticket (Super Admin / ADMIN with COMPLAINTS).
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Permissions(Permission.COMPLAINTS)
  @Post(':id/archive')
  @ApiOperation({ summary: 'Archive a closed ticket (admin)' })
  async archive(@Param('id') id: string) {
    return this.ticketsService.archive(id);
  }

  /**
   * Admin: list reopened tickets for monitoring/escalation.
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Permissions(Permission.COMPLAINTS)
  @Get('admin/reopened')
  @ApiOperation({ summary: 'List reopened tickets (admin)' })
  async reopened(
    @Query('departmentId') departmentId?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.ticketsService.findReopened({
      departmentId,
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
    });
  }

  /**
   * Admin: list archived tickets (read-only archive view).
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.AUDITOR)
  @Get('admin/archive')
  @ApiOperation({ summary: 'List archived tickets (admin/auditor)' })
  async archived(
    @Query('departmentId') departmentId?: string,
    @Query('category') category?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.ticketsService.findArchived({
      departmentId,
      category,
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
    });
  }

  /**
   * Overhaul Phase 1.2 — SUPER_ADMIN / AUDITOR cross-department view.
   *
   * Returns every (non-archived) ticket across all departments, each enriched
   * with its full AuditEvent activity timeline (`events`). Supports status /
   * department / priority / free-text filters and pagination. pageSize is
   * capped at 100 to keep payload sizes reasonable for the timeline payload.
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.AUDITOR)
  @Get('admin/all')
  @ApiOperation({
    summary:
      'List all tickets across departments with full activity timeline (Super Admin / Auditor)',
  })
  @ApiQuery({ name: 'status', required: false, enum: TicketStatus })
  @ApiQuery({ name: 'departmentId', required: false })
  @ApiQuery({ name: 'priority', required: false, enum: Priority })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search across ticketCode, subject and description',
  })
  @ApiQuery({ name: 'page', required: false, description: '1-indexed page (default 1)' })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    description: 'Items per page (default 20, max 100)',
  })
  @ApiResponse({
    status: 200,
    description:
      'Paginated tickets with embedded `events` (AuditEvent timeline), `department`, `assignee` and `citizen` summaries.',
  })
  async adminAll(
    @Query('status') status?: TicketStatus,
    @Query('departmentId') departmentId?: string,
    @Query('priority') priority?: Priority,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.ticketsService.findAllWithTimeline({
      status,
      departmentId,
      priority,
      search,
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
    });
  }

  /**
   * Overhaul Phase 1.3 — Department-scoped ticket listing with stats.
   *
   * Returns all non-archived tickets scoped to a single department, plus a
   * `stats` block summarising the department-wide count broken down by status
   * and priority (ignoring the list filters so the UI can show department
   * totals alongside the filtered view).
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    Role.ADMIN,
    Role.DEPARTMENT_HOD,
    Role.PERMANENT_SECRETARY,
    Role.AUDITOR,
  )
  @Get('department/:departmentId')
  @ApiOperation({
    summary:
      'List tickets scoped to a department, with assignee info and status/priority stats',
  })
  @ApiQuery({ name: 'status', required: false, enum: TicketStatus })
  @ApiQuery({ name: 'priority', required: false, enum: Priority })
  @ApiQuery({ name: 'assignedOfficerId', required: false })
  @ApiQuery({ name: 'page', required: false, description: '1-indexed page (default 1)' })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    description: 'Items per page (default 20, max 100)',
  })
  @ApiResponse({
    status: 200,
    description:
      'Paginated department-scoped ticket list with `assignee` info and `stats` summary.',
  })
  async byDepartment(
    @Param('departmentId') departmentId: string,
    @Query('status') status?: TicketStatus,
    @Query('priority') priority?: Priority,
    @Query('assignedOfficerId') assignedOfficerId?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.ticketsService.findByDepartment(departmentId, {
      status,
      priority,
      assignedOfficerId,
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
    });
  }

  /**
   * Persists uploaded files via the StorageService port and returns the stored
   * metadata the service needs to create TicketAttachment rows.
   */
  private async persistFiles(files: Express.Multer.File[]): Promise<StoredAttachment[]> {
    if (!files || files.length === 0) return [];
    const results: StoredAttachment[] = [];
    for (const file of files) {
      const stored = await this.storage.save({
        buffer: file.buffer,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
      });
      results.push({
        filename: stored.filename,
        storedPath: stored.storedPath,
        mimetype: stored.mimetype,
        sizeBytes: stored.sizeBytes,
      });
    }
    return results;
  }
}
