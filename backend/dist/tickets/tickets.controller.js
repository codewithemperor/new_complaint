"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "TicketsController", {
    enumerable: true,
    get: function() {
        return TicketsController;
    }
});
const _common = require("@nestjs/common");
const _platformexpress = require("@nestjs/platform-express");
const _swagger = require("@nestjs/swagger");
const _ticketsservice = require("./tickets.service");
const _createticketdto = require("./dtos/create-ticket.dto");
const _triageticketdto = require("./dtos/triage-ticket.dto");
const _postminutedto = require("./dtos/post-minute.dto");
const _requestinfodto = require("./dtos/request-info.dto");
const _citizeninforeplydto = require("./dtos/citizen-info-reply.dto");
const _submitresolutiondto = require("./dtos/submit-resolution.dto");
const _feedbackdto = require("./dtos/feedback.dto");
const _reopendto = require("./dtos/reopen.dto");
const _ispublicdecorator = require("../common/decorators/is-public.decorator");
const _jwtauthguard = require("../common/guards/jwt-auth.guard");
const _rolesguard = require("../common/guards/roles.guard");
const _rolesdecorator = require("../common/decorators/roles.decorator");
const _permissionsdecorator = require("../common/decorators/permissions.decorator");
const _role = require("../common/types/role");
const _permission = require("../common/types/permission");
const _ticketstatus = require("../common/types/ticket-status");
const _currentuserdecorator = require("../common/decorators/current-user.decorator");
const _trackingtokenguard = require("../common/guards/tracking-token.guard");
const _trackingpayloaddecorator = require("../common/decorators/tracking-payload.decorator");
const _storageservice = require("../storage/storage.service");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") {
        r = Reflect.decorate(decorators, target, key, desc);
    } else {
        for(var i = decorators.length - 1; i >= 0; i--){
            if (d = decorators[i]) {
                r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
            }
        }
    }
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(metadataKey, metadataValue) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") {
        return Reflect.metadata(metadataKey, metadataValue);
    }
}
function _ts_param(paramIndex, decorator) {
    return function(target, key) {
        decorator(target, key, paramIndex);
    };
}
const MAX_FILES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
let TicketsController = class TicketsController {
    constructor(ticketsService, storage){
        this.ticketsService = ticketsService;
        this.storage = storage;
    }
    /**
   * Public endpoint: citizen self-service submission.
   */ async createPublic(dto, files) {
        const stored = await this.persistFiles(files);
        const result = await this.ticketsService.create(dto, stored);
        return {
            ticketCode: result.ticketCode,
            id: result.id,
            trackingPasscode: result.trackingPasscode
        };
    }
    /**
   * Protected endpoint: an Admin (with INTAKE) logs a complaint on behalf of a citizen.
   */ async createIntake(dto, files, user) {
        const stored = await this.persistFiles(files);
        const result = await this.ticketsService.create(dto, stored, user.id);
        return {
            ticketCode: result.ticketCode,
            id: result.id,
            trackingPasscode: result.trackingPasscode
        };
    }
    /**
   * Staff ticket listing with filters (triage queue, officer queue, etc.).
   */ async list(status, departmentId, assignedOfficerId, page, pageSize, user) {
        return this.ticketsService.findMany({
            status,
            departmentId,
            assignedOfficerId,
            requesterId: user?.id,
            page: page ? parseInt(page, 10) : undefined,
            pageSize: pageSize ? parseInt(pageSize, 10) : undefined
        });
    }
    /**
   * Triage an ACKNOWLEDGED ticket: classify, prioritize, route.
   */ async triage(id, dto, user) {
        return this.ticketsService.triage(id, dto, user);
    }
    /**
   * Public tracking view for citizens (passcode-based, no JWT needed).
   */ async trackByPasscode(code, passcode) {
        return this.ticketsService.findByCodeWithPasscode(code, passcode);
    }
    /**
   * Public tracking view for citizens (token-authenticated, legacy).
   */ async track(code, payload, _token) {
        return this.ticketsService.findByCodeForCitizen(code, payload.citizenId);
    }
    /**
   * Staff ticket detail (JWT-authenticated) — enriched with minutes, SLA, pauses.
   */ async detail(id) {
        return this.ticketsService.findDetailForStaff(id);
    }
    // ─────────────────────────────────────────────────────────────────────────
    // Officer investigation endpoints (Milestone 4 — Phase 3)
    // ─────────────────────────────────────────────────────────────────────────
    /**
   * Start investigation on an ASSIGNED ticket → IN_PROGRESS. Starts SLA clock.
   */ async start(id, user) {
        return this.ticketsService.start(id, user);
    }
    /**
   * Append a minute to the investigation sheet (append-only).
   */ async postMinute(id, dto, user) {
        return this.ticketsService.postMinute(id, dto, user);
    }
    /**
   * Request more information from the citizen — pauses the SLA clock.
   */ async requestInfo(id, dto, user) {
        return this.ticketsService.requestInfo(id, dto, user);
    }
    /**
   * Request departmental approval (→ PENDING_APPROVAL). Pauses SLA, creates a
   * PENDING ApprovalRequest addressed to the HOD. Decision flow is M5.
   */ async requestApproval(id, user) {
        return this.ticketsService.requestApproval(id, user);
    }
    /**
   * Citizen replies to an info request (public, token-authenticated). Resumes
   * the SLA clock.
   */ async replyInfo(code, dto, payload, _token) {
        return this.ticketsService.replyInfo(code, payload.citizenId, dto);
    }
    // ─────────────────────────────────────────────────────────────────────────
    // Resolution & Closure endpoints (Milestone 6 — Phases 6 & 7)
    // ─────────────────────────────────────────────────────────────────────────
    /**
   * Officer submits a resolution → RESOLVED (starts feedback grace clock).
   */ async submitResolution(id, dto, user) {
        return this.ticketsService.submitResolution(id, dto, user);
    }
    /**
   * Citizen submits feedback (public, token-auth). Satisfied → CLOSED;
   * not satisfied → REOPENED.
   */ async submitFeedback(code, dto, payload, _token) {
        return this.ticketsService.submitFeedback(code, payload.citizenId, dto);
    }
    /**
   * Citizen explicit reopen (public, token-auth). Subject to the 14-day window.
   */ async reopen(code, dto, payload, _token) {
        return this.ticketsService.reopen(code, payload.citizenId, dto);
    }
    /**
   * Archive a closed ticket (Super Admin / ADMIN with COMPLAINTS).
   */ async archive(id) {
        return this.ticketsService.archive(id);
    }
    /**
   * Admin: list reopened tickets (re-triage queue).
   */ async reopened(departmentId, page, pageSize) {
        return this.ticketsService.findReopened({
            departmentId,
            page: page ? parseInt(page, 10) : undefined,
            pageSize: pageSize ? parseInt(pageSize, 10) : undefined
        });
    }
    /**
   * Admin: list archived tickets (read-only archive view).
   */ async archived(departmentId, category, page, pageSize) {
        return this.ticketsService.findArchived({
            departmentId,
            category,
            page: page ? parseInt(page, 10) : undefined,
            pageSize: pageSize ? parseInt(pageSize, 10) : undefined
        });
    }
    /**
   * Overhaul Phase 1.2 — SUPER_ADMIN / AUDITOR cross-department view.
   *
   * Returns every (non-archived) ticket across all departments, each enriched
   * with its full AuditEvent activity timeline (`events`). Supports status /
   * department / priority / free-text filters and pagination. pageSize is
   * capped at 100 to keep payload sizes reasonable for the timeline payload.
   */ async adminAll(status, departmentId, priority, search, page, pageSize) {
        return this.ticketsService.findAllWithTimeline({
            status,
            departmentId,
            priority,
            search,
            page: page ? parseInt(page, 10) : undefined,
            pageSize: pageSize ? parseInt(pageSize, 10) : undefined
        });
    }
    /**
   * Overhaul Phase 1.3 — Department-scoped ticket listing with stats.
   *
   * Returns all non-archived tickets scoped to a single department, plus a
   * `stats` block summarising the department-wide count broken down by status
   * and priority (ignoring the list filters so the UI can show department
   * totals alongside the filtered view).
   */ async byDepartment(departmentId, status, priority, assignedOfficerId, page, pageSize) {
        return this.ticketsService.findByDepartment(departmentId, {
            status,
            priority,
            assignedOfficerId,
            page: page ? parseInt(page, 10) : undefined,
            pageSize: pageSize ? parseInt(pageSize, 10) : undefined
        });
    }
    /**
   * Persists uploaded files via the StorageService port and returns the stored
   * metadata the service needs to create TicketAttachment rows.
   */ async persistFiles(files) {
        if (!files || files.length === 0) return [];
        const results = [];
        for (const file of files){
            const stored = await this.storage.save({
                buffer: file.buffer,
                originalname: file.originalname,
                mimetype: file.mimetype,
                size: file.size
            });
            results.push({
                filename: stored.filename,
                storedPath: stored.storedPath,
                mimetype: stored.mimetype,
                sizeBytes: stored.sizeBytes
            });
        }
        return results;
    }
};
_ts_decorate([
    (0, _ispublicdecorator.Public)(),
    (0, _common.Post)(),
    (0, _common.UseInterceptors)((0, _platformexpress.FilesInterceptor)('attachments', MAX_FILES, {
        limits: {
            fileSize: MAX_FILE_SIZE
        }
    })),
    (0, _swagger.ApiConsumes)('multipart/form-data'),
    (0, _swagger.ApiOperation)({
        summary: 'Submit a complaint (public)'
    }),
    (0, _swagger.ApiResponse)({
        status: 201,
        description: 'Ticket created'
    }),
    _ts_param(0, (0, _common.Body)()),
    _ts_param(1, (0, _common.UploadedFiles)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _createticketdto.CreateTicketDto === "undefined" ? Object : _createticketdto.CreateTicketDto,
        Array
    ]),
    _ts_metadata("design:returntype", Promise)
], TicketsController.prototype, "createPublic", null);
_ts_decorate([
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard, _rolesguard.RolesGuard),
    (0, _rolesdecorator.Roles)(_role.Role.ADMIN),
    (0, _permissionsdecorator.Permissions)(_permission.Permission.INTAKE),
    (0, _common.Post)('intake'),
    (0, _common.UseInterceptors)((0, _platformexpress.FilesInterceptor)('attachments', MAX_FILES, {
        limits: {
            fileSize: MAX_FILE_SIZE
        }
    })),
    (0, _swagger.ApiConsumes)('multipart/form-data'),
    (0, _swagger.ApiOperation)({
        summary: 'Intake officer logs a complaint on behalf of a citizen'
    }),
    _ts_param(0, (0, _common.Body)()),
    _ts_param(1, (0, _common.UploadedFiles)()),
    _ts_param(2, (0, _currentuserdecorator.CurrentUser)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _createticketdto.CreateTicketDto === "undefined" ? Object : _createticketdto.CreateTicketDto,
        Array,
        typeof AuthenticatedUser === "undefined" ? Object : AuthenticatedUser
    ]),
    _ts_metadata("design:returntype", Promise)
], TicketsController.prototype, "createIntake", null);
_ts_decorate([
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard, _rolesguard.RolesGuard),
    (0, _rolesdecorator.Roles)(_role.Role.ADMIN, _role.Role.DEPARTMENT_STAFF, _role.Role.DEPARTMENT_HOD, _role.Role.PERMANENT_SECRETARY, _role.Role.COMMISSIONER, _role.Role.AUDITOR),
    (0, _common.Get)(),
    (0, _swagger.ApiOperation)({
        summary: 'List tickets with filters (staff)'
    }),
    (0, _swagger.ApiQuery)({
        name: 'status',
        required: false,
        enum: _ticketstatus.TicketStatus
    }),
    (0, _swagger.ApiQuery)({
        name: 'departmentId',
        required: false
    }),
    (0, _swagger.ApiQuery)({
        name: 'assignedOfficerId',
        required: false
    }),
    (0, _swagger.ApiQuery)({
        name: 'page',
        required: false
    }),
    (0, _swagger.ApiQuery)({
        name: 'pageSize',
        required: false
    }),
    _ts_param(0, (0, _common.Query)('status')),
    _ts_param(1, (0, _common.Query)('departmentId')),
    _ts_param(2, (0, _common.Query)('assignedOfficerId')),
    _ts_param(3, (0, _common.Query)('page')),
    _ts_param(4, (0, _common.Query)('pageSize')),
    _ts_param(5, (0, _currentuserdecorator.CurrentUser)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _ticketstatus.TicketStatus === "undefined" ? Object : _ticketstatus.TicketStatus,
        String,
        String,
        String,
        String,
        typeof AuthenticatedUser === "undefined" ? Object : AuthenticatedUser
    ]),
    _ts_metadata("design:returntype", Promise)
], TicketsController.prototype, "list", null);
_ts_decorate([
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard, _rolesguard.RolesGuard),
    (0, _rolesdecorator.Roles)(_role.Role.ADMIN),
    (0, _permissionsdecorator.Permissions)(_permission.Permission.INTAKE, _permission.Permission.SCHEDULE),
    (0, _common.Patch)(':id/triage'),
    (0, _swagger.ApiOperation)({
        summary: 'Triage a ticket (Admin Officer / Super Admin)'
    }),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _common.Body)()),
    _ts_param(2, (0, _currentuserdecorator.CurrentUser)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof _triageticketdto.TriageTicketDto === "undefined" ? Object : _triageticketdto.TriageTicketDto,
        typeof AuthenticatedUser === "undefined" ? Object : AuthenticatedUser
    ]),
    _ts_metadata("design:returntype", Promise)
], TicketsController.prototype, "triage", null);
_ts_decorate([
    (0, _ispublicdecorator.Public)(),
    (0, _common.Get)('track'),
    (0, _swagger.ApiOperation)({
        summary: 'Track a complaint by code + passcode (citizen)'
    }),
    _ts_param(0, (0, _common.Query)('code')),
    _ts_param(1, (0, _common.Query)('passcode')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], TicketsController.prototype, "trackByPasscode", null);
_ts_decorate([
    (0, _ispublicdecorator.Public)(),
    (0, _common.UseGuards)(_trackingtokenguard.TrackingTokenGuard),
    (0, _common.Get)(':code/track'),
    (0, _swagger.ApiOperation)({
        summary: 'Track a complaint by code + tracking token (citizen)'
    }),
    _ts_param(0, (0, _common.Param)('code')),
    _ts_param(1, (0, _trackingpayloaddecorator.TrackingPayload)()),
    _ts_param(2, (0, _common.Query)('token')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof TrackingTokenPayload === "undefined" ? Object : TrackingTokenPayload,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], TicketsController.prototype, "track", null);
_ts_decorate([
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard),
    (0, _common.Get)(':id/detail'),
    (0, _swagger.ApiOperation)({
        summary: 'Get full ticket detail (staff)'
    }),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], TicketsController.prototype, "detail", null);
_ts_decorate([
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard, _rolesguard.RolesGuard),
    (0, _rolesdecorator.Roles)(_role.Role.DEPARTMENT_STAFF, _role.Role.DEPARTMENT_HOD),
    (0, _common.Patch)(':id/start'),
    (0, _swagger.ApiOperation)({
        summary: 'Start investigation (officer)'
    }),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _currentuserdecorator.CurrentUser)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof AuthenticatedUser === "undefined" ? Object : AuthenticatedUser
    ]),
    _ts_metadata("design:returntype", Promise)
], TicketsController.prototype, "start", null);
_ts_decorate([
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard, _rolesguard.RolesGuard),
    (0, _rolesdecorator.Roles)(_role.Role.DEPARTMENT_STAFF, _role.Role.DEPARTMENT_HOD),
    (0, _common.Post)(':id/minutes'),
    (0, _swagger.ApiOperation)({
        summary: 'Post an investigation minute (officer)'
    }),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _common.Body)()),
    _ts_param(2, (0, _currentuserdecorator.CurrentUser)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof _postminutedto.PostMinuteDto === "undefined" ? Object : _postminutedto.PostMinuteDto,
        typeof AuthenticatedUser === "undefined" ? Object : AuthenticatedUser
    ]),
    _ts_metadata("design:returntype", Promise)
], TicketsController.prototype, "postMinute", null);
_ts_decorate([
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard, _rolesguard.RolesGuard),
    (0, _rolesdecorator.Roles)(_role.Role.DEPARTMENT_STAFF, _role.Role.DEPARTMENT_HOD),
    (0, _common.Post)(':id/request-info'),
    (0, _swagger.ApiOperation)({
        summary: 'Request info from citizen (officer)'
    }),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _common.Body)()),
    _ts_param(2, (0, _currentuserdecorator.CurrentUser)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof _requestinfodto.RequestInfoDto === "undefined" ? Object : _requestinfodto.RequestInfoDto,
        typeof AuthenticatedUser === "undefined" ? Object : AuthenticatedUser
    ]),
    _ts_metadata("design:returntype", Promise)
], TicketsController.prototype, "requestInfo", null);
_ts_decorate([
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard, _rolesguard.RolesGuard),
    (0, _rolesdecorator.Roles)(_role.Role.DEPARTMENT_STAFF, _role.Role.DEPARTMENT_HOD),
    (0, _common.Patch)(':id/request-approval'),
    (0, _swagger.ApiOperation)({
        summary: 'Request departmental approval (officer)'
    }),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _currentuserdecorator.CurrentUser)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof AuthenticatedUser === "undefined" ? Object : AuthenticatedUser
    ]),
    _ts_metadata("design:returntype", Promise)
], TicketsController.prototype, "requestApproval", null);
_ts_decorate([
    (0, _ispublicdecorator.Public)(),
    (0, _common.UseGuards)(_trackingtokenguard.TrackingTokenGuard),
    (0, _common.Post)(':code/info'),
    (0, _swagger.ApiOperation)({
        summary: 'Citizen replies to an info request (public, token-auth)'
    }),
    _ts_param(0, (0, _common.Param)('code')),
    _ts_param(1, (0, _common.Body)()),
    _ts_param(2, (0, _trackingpayloaddecorator.TrackingPayload)()),
    _ts_param(3, (0, _common.Query)('token')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof _citizeninforeplydto.CitizenInfoReplyDto === "undefined" ? Object : _citizeninforeplydto.CitizenInfoReplyDto,
        typeof TrackingTokenPayload === "undefined" ? Object : TrackingTokenPayload,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], TicketsController.prototype, "replyInfo", null);
_ts_decorate([
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard, _rolesguard.RolesGuard),
    (0, _rolesdecorator.Roles)(_role.Role.DEPARTMENT_STAFF, _role.Role.DEPARTMENT_HOD),
    (0, _common.Post)(':id/resolution'),
    (0, _swagger.ApiOperation)({
        summary: 'Submit a resolution (officer)'
    }),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _common.Body)()),
    _ts_param(2, (0, _currentuserdecorator.CurrentUser)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof _submitresolutiondto.SubmitResolutionDto === "undefined" ? Object : _submitresolutiondto.SubmitResolutionDto,
        typeof AuthenticatedUser === "undefined" ? Object : AuthenticatedUser
    ]),
    _ts_metadata("design:returntype", Promise)
], TicketsController.prototype, "submitResolution", null);
_ts_decorate([
    (0, _ispublicdecorator.Public)(),
    (0, _common.UseGuards)(_trackingtokenguard.TrackingTokenGuard),
    (0, _common.Post)(':code/feedback'),
    (0, _swagger.ApiOperation)({
        summary: 'Citizen submits resolution feedback (public, token-auth)'
    }),
    _ts_param(0, (0, _common.Param)('code')),
    _ts_param(1, (0, _common.Body)()),
    _ts_param(2, (0, _trackingpayloaddecorator.TrackingPayload)()),
    _ts_param(3, (0, _common.Query)('token')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof _feedbackdto.FeedbackDto === "undefined" ? Object : _feedbackdto.FeedbackDto,
        typeof TrackingTokenPayload === "undefined" ? Object : TrackingTokenPayload,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], TicketsController.prototype, "submitFeedback", null);
_ts_decorate([
    (0, _ispublicdecorator.Public)(),
    (0, _common.UseGuards)(_trackingtokenguard.TrackingTokenGuard),
    (0, _common.Post)(':code/reopen'),
    (0, _swagger.ApiOperation)({
        summary: 'Citizen reopens a resolved complaint (public, token-auth)'
    }),
    _ts_param(0, (0, _common.Param)('code')),
    _ts_param(1, (0, _common.Body)()),
    _ts_param(2, (0, _trackingpayloaddecorator.TrackingPayload)()),
    _ts_param(3, (0, _common.Query)('token')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof _reopendto.ReopenDto === "undefined" ? Object : _reopendto.ReopenDto,
        typeof TrackingTokenPayload === "undefined" ? Object : TrackingTokenPayload,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], TicketsController.prototype, "reopen", null);
_ts_decorate([
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard, _rolesguard.RolesGuard),
    (0, _rolesdecorator.Roles)(_role.Role.ADMIN),
    (0, _permissionsdecorator.Permissions)(_permission.Permission.COMPLAINTS),
    (0, _common.Post)(':id/archive'),
    (0, _swagger.ApiOperation)({
        summary: 'Archive a closed ticket (admin)'
    }),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], TicketsController.prototype, "archive", null);
_ts_decorate([
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard, _rolesguard.RolesGuard),
    (0, _rolesdecorator.Roles)(_role.Role.ADMIN),
    (0, _permissionsdecorator.Permissions)(_permission.Permission.COMPLAINTS),
    (0, _common.Get)('admin/reopened'),
    (0, _swagger.ApiOperation)({
        summary: 'List reopened tickets (admin)'
    }),
    _ts_param(0, (0, _common.Query)('departmentId')),
    _ts_param(1, (0, _common.Query)('page')),
    _ts_param(2, (0, _common.Query)('pageSize')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], TicketsController.prototype, "reopened", null);
_ts_decorate([
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard, _rolesguard.RolesGuard),
    (0, _rolesdecorator.Roles)(_role.Role.ADMIN, _role.Role.AUDITOR),
    (0, _common.Get)('admin/archive'),
    (0, _swagger.ApiOperation)({
        summary: 'List archived tickets (admin/auditor)'
    }),
    _ts_param(0, (0, _common.Query)('departmentId')),
    _ts_param(1, (0, _common.Query)('category')),
    _ts_param(2, (0, _common.Query)('page')),
    _ts_param(3, (0, _common.Query)('pageSize')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String,
        String,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], TicketsController.prototype, "archived", null);
_ts_decorate([
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard, _rolesguard.RolesGuard),
    (0, _rolesdecorator.Roles)(_role.Role.ADMIN, _role.Role.AUDITOR),
    (0, _common.Get)('admin/all'),
    (0, _swagger.ApiOperation)({
        summary: 'List all tickets across departments with full activity timeline (Super Admin / Auditor)'
    }),
    (0, _swagger.ApiQuery)({
        name: 'status',
        required: false,
        enum: _ticketstatus.TicketStatus
    }),
    (0, _swagger.ApiQuery)({
        name: 'departmentId',
        required: false
    }),
    (0, _swagger.ApiQuery)({
        name: 'priority',
        required: false,
        enum: _ticketstatus.Priority
    }),
    (0, _swagger.ApiQuery)({
        name: 'search',
        required: false,
        description: 'Search across ticketCode, subject and description'
    }),
    (0, _swagger.ApiQuery)({
        name: 'page',
        required: false,
        description: '1-indexed page (default 1)'
    }),
    (0, _swagger.ApiQuery)({
        name: 'pageSize',
        required: false,
        description: 'Items per page (default 20, max 100)'
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: 'Paginated tickets with embedded `events` (AuditEvent timeline), `department`, `assignee` and `citizen` summaries.'
    }),
    _ts_param(0, (0, _common.Query)('status')),
    _ts_param(1, (0, _common.Query)('departmentId')),
    _ts_param(2, (0, _common.Query)('priority')),
    _ts_param(3, (0, _common.Query)('search')),
    _ts_param(4, (0, _common.Query)('page')),
    _ts_param(5, (0, _common.Query)('pageSize')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _ticketstatus.TicketStatus === "undefined" ? Object : _ticketstatus.TicketStatus,
        String,
        typeof _ticketstatus.Priority === "undefined" ? Object : _ticketstatus.Priority,
        String,
        String,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], TicketsController.prototype, "adminAll", null);
_ts_decorate([
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard, _rolesguard.RolesGuard),
    (0, _rolesdecorator.Roles)(_role.Role.ADMIN, _role.Role.DEPARTMENT_HOD, _role.Role.PERMANENT_SECRETARY, _role.Role.AUDITOR),
    (0, _common.Get)('department/:departmentId'),
    (0, _swagger.ApiOperation)({
        summary: 'List tickets scoped to a department, with assignee info and status/priority stats'
    }),
    (0, _swagger.ApiQuery)({
        name: 'status',
        required: false,
        enum: _ticketstatus.TicketStatus
    }),
    (0, _swagger.ApiQuery)({
        name: 'priority',
        required: false,
        enum: _ticketstatus.Priority
    }),
    (0, _swagger.ApiQuery)({
        name: 'assignedOfficerId',
        required: false
    }),
    (0, _swagger.ApiQuery)({
        name: 'page',
        required: false,
        description: '1-indexed page (default 1)'
    }),
    (0, _swagger.ApiQuery)({
        name: 'pageSize',
        required: false,
        description: 'Items per page (default 20, max 100)'
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: 'Paginated department-scoped ticket list with `assignee` info and `stats` summary.'
    }),
    _ts_param(0, (0, _common.Param)('departmentId')),
    _ts_param(1, (0, _common.Query)('status')),
    _ts_param(2, (0, _common.Query)('priority')),
    _ts_param(3, (0, _common.Query)('assignedOfficerId')),
    _ts_param(4, (0, _common.Query)('page')),
    _ts_param(5, (0, _common.Query)('pageSize')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof _ticketstatus.TicketStatus === "undefined" ? Object : _ticketstatus.TicketStatus,
        typeof _ticketstatus.Priority === "undefined" ? Object : _ticketstatus.Priority,
        String,
        String,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], TicketsController.prototype, "byDepartment", null);
TicketsController = _ts_decorate([
    (0, _swagger.ApiTags)('tickets'),
    (0, _common.Controller)('tickets'),
    _ts_param(1, (0, _common.Inject)(_storageservice.STORAGE_SERVICE)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _ticketsservice.TicketsService === "undefined" ? Object : _ticketsservice.TicketsService,
        typeof _storageservice.StorageService === "undefined" ? Object : _storageservice.StorageService
    ])
], TicketsController);

//# sourceMappingURL=tickets.controller.js.map