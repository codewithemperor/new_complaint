"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "AuditController", {
    enumerable: true,
    get: function() {
        return AuditController;
    }
});
const _common = require("@nestjs/common");
const _swagger = require("@nestjs/swagger");
const _jwtauthguard = require("../common/guards/jwt-auth.guard");
const _rolesguard = require("../common/guards/roles.guard");
const _rolesdecorator = require("../common/decorators/roles.decorator");
const _role = require("../common/types/role");
const _auditservice = require("./audit.service");
const _reportsservice = require("./reports.service");
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
let AuditController = class AuditController {
    constructor(auditService, reportsService){
        this.auditService = auditService;
        this.reportsService = reportsService;
    }
    async list(ticketId, ticketCode, actorId, eventType, from, to, page, pageSize) {
        return this.auditService.list({
            ticketId,
            ticketCode,
            actorId,
            eventType,
            from,
            to,
            page: page ? parseInt(page, 10) : undefined,
            pageSize: pageSize ? parseInt(pageSize, 10) : undefined
        });
    }
    async exportCsv(res, ticketId, ticketCode, actorId, eventType, from, to) {
        const csv = await this.auditService.exportCsv({
            ticketId,
            ticketCode,
            actorId,
            eventType,
            from,
            to
        });
        const filename = ticketCode ? `audit-${ticketCode}.csv` : 'audit-events.csv';
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(csv);
    }
    async overview(from, to) {
        return this.reportsService.overview(from ? new Date(from) : undefined, to ? new Date(to) : undefined);
    }
    async departmentPerformance(from, to) {
        return this.reportsService.departmentPerformance(from ? new Date(from) : undefined, to ? new Date(to) : undefined);
    }
    async officerPerformance(from, to) {
        return this.reportsService.officerPerformance(from ? new Date(from) : undefined, to ? new Date(to) : undefined);
    }
    async trend(days, from, to) {
        return this.reportsService.trend(days ? parseInt(days, 10) : undefined, from ? new Date(from) : undefined, to ? new Date(to) : undefined);
    }
    async statusByDepartment(from, to) {
        return this.reportsService.statusByDepartment(from ? new Date(from) : undefined, to ? new Date(to) : undefined);
    }
    async priorityBreakdown(from, to) {
        return this.reportsService.priorityBreakdown(from ? new Date(from) : undefined, to ? new Date(to) : undefined);
    }
};
_ts_decorate([
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard, _rolesguard.RolesGuard),
    (0, _rolesdecorator.Roles)(_role.Role.ADMIN, _role.Role.DEPARTMENT_HOD, _role.Role.PERMANENT_SECRETARY, _role.Role.COMMISSIONER, _role.Role.AUDITOR),
    (0, _common.Get)('audit-events'),
    (0, _swagger.ApiOperation)({
        summary: 'List audit events (filtered/paginated)'
    }),
    _ts_param(0, (0, _common.Query)('ticketId')),
    _ts_param(1, (0, _common.Query)('ticketCode')),
    _ts_param(2, (0, _common.Query)('actorId')),
    _ts_param(3, (0, _common.Query)('eventType')),
    _ts_param(4, (0, _common.Query)('from')),
    _ts_param(5, (0, _common.Query)('to')),
    _ts_param(6, (0, _common.Query)('page')),
    _ts_param(7, (0, _common.Query)('pageSize')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String,
        String,
        String,
        String,
        String,
        String,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], AuditController.prototype, "list", null);
_ts_decorate([
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard, _rolesguard.RolesGuard),
    (0, _rolesdecorator.Roles)(_role.Role.ADMIN, _role.Role.DEPARTMENT_HOD, _role.Role.PERMANENT_SECRETARY, _role.Role.COMMISSIONER, _role.Role.AUDITOR),
    (0, _common.Get)('audit-events/export'),
    (0, _common.Header)('Content-Type', 'text/csv'),
    (0, _swagger.ApiOperation)({
        summary: 'Export audit events as CSV'
    }),
    _ts_param(0, (0, _common.Res)()),
    _ts_param(1, (0, _common.Query)('ticketId')),
    _ts_param(2, (0, _common.Query)('ticketCode')),
    _ts_param(3, (0, _common.Query)('actorId')),
    _ts_param(4, (0, _common.Query)('eventType')),
    _ts_param(5, (0, _common.Query)('from')),
    _ts_param(6, (0, _common.Query)('to')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof Response === "undefined" ? Object : Response,
        String,
        String,
        String,
        String,
        String,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], AuditController.prototype, "exportCsv", null);
_ts_decorate([
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard, _rolesguard.RolesGuard),
    (0, _rolesdecorator.Roles)(_role.Role.ADMIN, _role.Role.DEPARTMENT_HOD, _role.Role.PERMANENT_SECRETARY, _role.Role.COMMISSIONER, _role.Role.AUDITOR),
    (0, _common.Get)('reports/overview'),
    (0, _swagger.ApiOperation)({
        summary: 'System-wide report totals'
    }),
    _ts_param(0, (0, _common.Query)('from')),
    _ts_param(1, (0, _common.Query)('to')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], AuditController.prototype, "overview", null);
_ts_decorate([
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard, _rolesguard.RolesGuard),
    (0, _rolesdecorator.Roles)(_role.Role.ADMIN, _role.Role.DEPARTMENT_HOD, _role.Role.PERMANENT_SECRETARY, _role.Role.COMMISSIONER, _role.Role.AUDITOR),
    (0, _common.Get)('reports/department-performance'),
    (0, _swagger.ApiOperation)({
        summary: 'Per-department performance metrics'
    }),
    _ts_param(0, (0, _common.Query)('from')),
    _ts_param(1, (0, _common.Query)('to')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], AuditController.prototype, "departmentPerformance", null);
_ts_decorate([
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard, _rolesguard.RolesGuard),
    (0, _rolesdecorator.Roles)(_role.Role.ADMIN, _role.Role.DEPARTMENT_HOD, _role.Role.PERMANENT_SECRETARY, _role.Role.COMMISSIONER, _role.Role.AUDITOR),
    (0, _common.Get)('reports/officer-performance'),
    (0, _swagger.ApiOperation)({
        summary: 'Per-officer performance metrics'
    }),
    _ts_param(0, (0, _common.Query)('from')),
    _ts_param(1, (0, _common.Query)('to')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], AuditController.prototype, "officerPerformance", null);
_ts_decorate([
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard, _rolesguard.RolesGuard),
    (0, _rolesdecorator.Roles)(_role.Role.ADMIN, _role.Role.DEPARTMENT_HOD, _role.Role.PERMANENT_SECRETARY, _role.Role.COMMISSIONER, _role.Role.AUDITOR),
    (0, _common.Get)('reports/trend'),
    (0, _swagger.ApiOperation)({
        summary: 'Daily complaints trend over N days'
    }),
    _ts_param(0, (0, _common.Query)('days')),
    _ts_param(1, (0, _common.Query)('from')),
    _ts_param(2, (0, _common.Query)('to')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], AuditController.prototype, "trend", null);
_ts_decorate([
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard, _rolesguard.RolesGuard),
    (0, _rolesdecorator.Roles)(_role.Role.ADMIN, _role.Role.DEPARTMENT_HOD, _role.Role.PERMANENT_SECRETARY, _role.Role.COMMISSIONER, _role.Role.AUDITOR),
    (0, _common.Get)('reports/status-by-department'),
    (0, _swagger.ApiOperation)({
        summary: 'Ticket counts by department and status'
    }),
    _ts_param(0, (0, _common.Query)('from')),
    _ts_param(1, (0, _common.Query)('to')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], AuditController.prototype, "statusByDepartment", null);
_ts_decorate([
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard, _rolesguard.RolesGuard),
    (0, _rolesdecorator.Roles)(_role.Role.ADMIN, _role.Role.DEPARTMENT_HOD, _role.Role.PERMANENT_SECRETARY, _role.Role.COMMISSIONER, _role.Role.AUDITOR),
    (0, _common.Get)('reports/priority-breakdown'),
    (0, _swagger.ApiOperation)({
        summary: 'Ticket counts by priority'
    }),
    _ts_param(0, (0, _common.Query)('from')),
    _ts_param(1, (0, _common.Query)('to')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], AuditController.prototype, "priorityBreakdown", null);
AuditController = _ts_decorate([
    (0, _swagger.ApiTags)('audit'),
    (0, _common.Controller)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _auditservice.AuditService === "undefined" ? Object : _auditservice.AuditService,
        typeof _reportsservice.ReportsService === "undefined" ? Object : _reportsservice.ReportsService
    ])
], AuditController);

//# sourceMappingURL=audit.controller.js.map