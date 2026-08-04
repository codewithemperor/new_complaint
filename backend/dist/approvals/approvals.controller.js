"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ApprovalsController", {
    enumerable: true,
    get: function() {
        return ApprovalsController;
    }
});
const _common = require("@nestjs/common");
const _swagger = require("@nestjs/swagger");
const _jwtauthguard = require("../common/guards/jwt-auth.guard");
const _rolesguard = require("../common/guards/roles.guard");
const _rolesdecorator = require("../common/decorators/roles.decorator");
const _role = require("../common/types/role");
const _currentuserdecorator = require("../common/decorators/current-user.decorator");
const _approvalworkflowservice = require("./approval-workflow.service");
const _delegationsservice = require("./delegations.service");
const _decisiondtos = require("./dtos/decision.dtos");
const _createdelegationdto = require("./dtos/create-delegation.dto");
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
let ApprovalsController = class ApprovalsController {
    constructor(workflow, delegations){
        this.workflow = workflow;
        this.delegations = delegations;
    }
    // ── Approval decisions ──────────────────────────────────────────────────
    async approve(id, dto, user) {
        return this.workflow.approve(id, dto, user);
    }
    async return(id, dto, user) {
        return this.workflow.return(id, dto, user);
    }
    async escalate(id, dto, user) {
        return this.workflow.escalate(id, dto, user);
    }
    async refer(id, dto, user) {
        return this.workflow.refer(id, dto, user);
    }
    // ── Approver inbox ───────────────────────────────────────────────────────
    async inbox(approverRole, status, currentApproverId, page, pageSize, user) {
        return this.workflow.findInbox({
            approverRole: approverRole,
            status,
            currentApproverId: currentApproverId === 'me' ? undefined : currentApproverId,
            page: page ? parseInt(page, 10) : undefined,
            pageSize: pageSize ? parseInt(pageSize, 10) : undefined
        }, user);
    }
    // ── Delegations (PS only) ─────────────────────────────────────────────────
    async createDelegation(dto, user) {
        return this.delegations.create(dto, user);
    }
    async listDelegations(activeOnly, user) {
        return this.delegations.findMany({
            activeOnly: activeOnly === 'true',
            delegatorId: user?.role === _role.Role.PERMANENT_SECRETARY ? user.id : undefined
        });
    }
    async revokeDelegation(id, user) {
        return this.delegations.revoke(id, user);
    }
};
_ts_decorate([
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard, _rolesguard.RolesGuard),
    (0, _rolesdecorator.Roles)(_role.Role.DEPARTMENT_HOD, _role.Role.PERMANENT_SECRETARY, _role.Role.COMMISSIONER),
    (0, _common.Post)('tickets/:id/approve'),
    (0, _swagger.ApiOperation)({
        summary: 'Approve at the current tier'
    }),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _common.Body)()),
    _ts_param(2, (0, _currentuserdecorator.CurrentUser)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof _decisiondtos.ApproveDto === "undefined" ? Object : _decisiondtos.ApproveDto,
        typeof AuthenticatedUser === "undefined" ? Object : AuthenticatedUser
    ]),
    _ts_metadata("design:returntype", Promise)
], ApprovalsController.prototype, "approve", null);
_ts_decorate([
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard, _rolesguard.RolesGuard),
    (0, _rolesdecorator.Roles)(_role.Role.DEPARTMENT_HOD, _role.Role.PERMANENT_SECRETARY, _role.Role.COMMISSIONER),
    (0, _common.Post)('tickets/:id/return'),
    (0, _swagger.ApiOperation)({
        summary: 'Return to officer with comments'
    }),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _common.Body)()),
    _ts_param(2, (0, _currentuserdecorator.CurrentUser)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof _decisiondtos.ReturnDto === "undefined" ? Object : _decisiondtos.ReturnDto,
        typeof AuthenticatedUser === "undefined" ? Object : AuthenticatedUser
    ]),
    _ts_metadata("design:returntype", Promise)
], ApprovalsController.prototype, "return", null);
_ts_decorate([
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard, _rolesguard.RolesGuard),
    (0, _rolesdecorator.Roles)(_role.Role.DEPARTMENT_HOD, _role.Role.PERMANENT_SECRETARY),
    (0, _common.Post)('tickets/:id/escalate'),
    (0, _swagger.ApiOperation)({
        summary: 'Escalate to the next approval tier (HOD→PS, PS→Commissioner)'
    }),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _common.Body)()),
    _ts_param(2, (0, _currentuserdecorator.CurrentUser)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof _decisiondtos.EscalateDto === "undefined" ? Object : _decisiondtos.EscalateDto,
        typeof AuthenticatedUser === "undefined" ? Object : AuthenticatedUser
    ]),
    _ts_metadata("design:returntype", Promise)
], ApprovalsController.prototype, "escalate", null);
_ts_decorate([
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard, _rolesguard.RolesGuard),
    (0, _rolesdecorator.Roles)(_role.Role.PERMANENT_SECRETARY, _role.Role.COMMISSIONER),
    (0, _common.Post)('tickets/:id/refer'),
    (0, _swagger.ApiOperation)({
        summary: 'Refer externally (PS / Commissioner)'
    }),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _common.Body)()),
    _ts_param(2, (0, _currentuserdecorator.CurrentUser)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof _decisiondtos.ReferDto === "undefined" ? Object : _decisiondtos.ReferDto,
        typeof AuthenticatedUser === "undefined" ? Object : AuthenticatedUser
    ]),
    _ts_metadata("design:returntype", Promise)
], ApprovalsController.prototype, "refer", null);
_ts_decorate([
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard, _rolesguard.RolesGuard),
    (0, _rolesdecorator.Roles)(_role.Role.DEPARTMENT_HOD, _role.Role.PERMANENT_SECRETARY, _role.Role.COMMISSIONER, _role.Role.ADMIN),
    (0, _common.Get)('approval-requests'),
    (0, _swagger.ApiOperation)({
        summary: 'List approval requests for an approver inbox'
    }),
    (0, _swagger.ApiQuery)({
        name: 'approverRole',
        required: false
    }),
    (0, _swagger.ApiQuery)({
        name: 'status',
        required: false
    }),
    _ts_param(0, (0, _common.Query)('approverRole')),
    _ts_param(1, (0, _common.Query)('status')),
    _ts_param(2, (0, _common.Query)('currentApproverId')),
    _ts_param(3, (0, _common.Query)('page')),
    _ts_param(4, (0, _common.Query)('pageSize')),
    _ts_param(5, (0, _currentuserdecorator.CurrentUser)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String,
        String,
        String,
        String,
        typeof AuthenticatedUser === "undefined" ? Object : AuthenticatedUser
    ]),
    _ts_metadata("design:returntype", Promise)
], ApprovalsController.prototype, "inbox", null);
_ts_decorate([
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard, _rolesguard.RolesGuard),
    (0, _rolesdecorator.Roles)(_role.Role.PERMANENT_SECRETARY),
    (0, _common.Post)('delegations'),
    (0, _swagger.ApiOperation)({
        summary: 'Create a delegation (PS only)'
    }),
    _ts_param(0, (0, _common.Body)()),
    _ts_param(1, (0, _currentuserdecorator.CurrentUser)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _createdelegationdto.CreateDelegationDto === "undefined" ? Object : _createdelegationdto.CreateDelegationDto,
        typeof AuthenticatedUser === "undefined" ? Object : AuthenticatedUser
    ]),
    _ts_metadata("design:returntype", Promise)
], ApprovalsController.prototype, "createDelegation", null);
_ts_decorate([
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard, _rolesguard.RolesGuard),
    (0, _rolesdecorator.Roles)(_role.Role.PERMANENT_SECRETARY, _role.Role.DEPARTMENT_HOD),
    (0, _common.Get)('delegations'),
    (0, _swagger.ApiOperation)({
        summary: 'List delegations'
    }),
    _ts_param(0, (0, _common.Query)('activeOnly')),
    _ts_param(1, (0, _currentuserdecorator.CurrentUser)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof AuthenticatedUser === "undefined" ? Object : AuthenticatedUser
    ]),
    _ts_metadata("design:returntype", Promise)
], ApprovalsController.prototype, "listDelegations", null);
_ts_decorate([
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard, _rolesguard.RolesGuard),
    (0, _rolesdecorator.Roles)(_role.Role.PERMANENT_SECRETARY),
    (0, _common.Post)('delegations/:id/revoke'),
    (0, _swagger.ApiOperation)({
        summary: 'Revoke a delegation (PS only)'
    }),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _currentuserdecorator.CurrentUser)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof AuthenticatedUser === "undefined" ? Object : AuthenticatedUser
    ]),
    _ts_metadata("design:returntype", Promise)
], ApprovalsController.prototype, "revokeDelegation", null);
ApprovalsController = _ts_decorate([
    (0, _swagger.ApiTags)('approvals'),
    (0, _common.Controller)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _approvalworkflowservice.ApprovalWorkflowService === "undefined" ? Object : _approvalworkflowservice.ApprovalWorkflowService,
        typeof _delegationsservice.DelegationsService === "undefined" ? Object : _delegationsservice.DelegationsService
    ])
], ApprovalsController);

//# sourceMappingURL=approvals.controller.js.map