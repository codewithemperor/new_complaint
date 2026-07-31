"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "SlaController", {
    enumerable: true,
    get: function() {
        return SlaController;
    }
});
const _common = require("@nestjs/common");
const _swagger = require("@nestjs/swagger");
const _jwtauthguard = require("../common/guards/jwt-auth.guard");
const _rolesguard = require("../common/guards/roles.guard");
const _rolesdecorator = require("../common/decorators/roles.decorator");
const _role = require("../common/types/role");
const _prismaservice = require("../prisma/prisma.service");
const _slapolicy = require("./sla-policy");
const _slaclockservice = require("./sla-clock.service");
const _updateslaconfigdto = require("./update-sla-config.dto");
const _ticketstatus = require("../common/types/ticket-status");
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
let SlaController = class SlaController {
    constructor(prisma, policy, clock){
        this.prisma = prisma;
        this.policy = policy;
        this.clock = clock;
    }
    /** Active tickets with SLA data for the breach dashboard. */ async breaching(view) {
        const statuses = [
            _ticketstatus.TicketStatus.ASSIGNED,
            _ticketstatus.TicketStatus.IN_PROGRESS,
            _ticketstatus.TicketStatus.PENDING_APPROVAL,
            _ticketstatus.TicketStatus.APPROVED
        ];
        const tickets = await this.prisma.ticket.findMany({
            where: {
                status: {
                    in: statuses
                },
                slaStartedAt: {
                    not: null
                }
            },
            orderBy: {
                slaBreached: 'desc'
            },
            take: 200,
            include: {
                department: {
                    select: {
                        name: true
                    }
                },
                assignedOfficer: {
                    select: {
                        fullName: true
                    }
                }
            }
        });
        // Enrich with live remaining hours.
        const enriched = await Promise.all(tickets.map(async (t)=>({
                ...t,
                slaRemainingHours: t.slaTargetHours ? await this.clock.remainingHours(t.id) : null
            })));
        // Filter by view if requested.
        let result = enriched;
        if (view === 'breached') {
            result = enriched.filter((t)=>t.slaBreached);
        } else if (view === 'warning') {
            const threshold = this.policy.warningThreshold();
            result = enriched.filter((t)=>!t.slaBreached && (t.slaRemainingHours ?? 0) <= threshold * (t.slaTargetHours ?? 0));
        }
        return {
            items: result,
            total: result.length
        };
    }
    /** The SLA config matrix. */ async config() {
        return this.prisma.slaConfig.findMany({
            orderBy: {
                priority: 'asc'
            }
        });
    }
    /** Edit one priority's SLA config (Super Admin). Invalidates the cache. */ async updateConfig(priority, dto) {
        const updated = await this.prisma.slaConfig.upsert({
            where: {
                priority: priority
            },
            update: {
                firstResponseHours: dto.firstResponseHours,
                resolutionHours: dto.resolutionHours,
                warningThreshold: dto.warningThreshold,
                escalationChain: JSON.stringify(dto.escalationChain)
            },
            create: {
                priority: priority,
                firstResponseHours: dto.firstResponseHours,
                resolutionHours: dto.resolutionHours,
                warningThreshold: dto.warningThreshold,
                escalationChain: JSON.stringify(dto.escalationChain)
            }
        });
        await this.policy.invalidate();
        return updated;
    }
};
_ts_decorate([
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard, _rolesguard.RolesGuard),
    (0, _rolesdecorator.Roles)(_role.Role.ADMIN_OFFICER, _role.Role.SUPER_ADMIN, _role.Role.AUDITOR),
    (0, _common.Get)('breaching'),
    (0, _swagger.ApiOperation)({
        summary: 'SLA breach dashboard (admin)'
    }),
    _ts_param(0, (0, _common.Query)('view')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], SlaController.prototype, "breaching", null);
_ts_decorate([
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard, _rolesguard.RolesGuard),
    (0, _rolesdecorator.Roles)(_role.Role.ADMIN_OFFICER, _role.Role.SUPER_ADMIN, _role.Role.AUDITOR),
    (0, _common.Get)('config'),
    (0, _swagger.ApiOperation)({
        summary: 'SLA config matrix (admin)'
    }),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", []),
    _ts_metadata("design:returntype", Promise)
], SlaController.prototype, "config", null);
_ts_decorate([
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard, _rolesguard.RolesGuard),
    (0, _rolesdecorator.Roles)(_role.Role.SUPER_ADMIN),
    (0, _common.Patch)('config/:priority'),
    (0, _swagger.ApiOperation)({
        summary: 'Update SLA config for a priority (Super Admin)'
    }),
    _ts_param(0, (0, _common.Param)('priority')),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof _updateslaconfigdto.UpdateSlaConfigDto === "undefined" ? Object : _updateslaconfigdto.UpdateSlaConfigDto
    ]),
    _ts_metadata("design:returntype", Promise)
], SlaController.prototype, "updateConfig", null);
SlaController = _ts_decorate([
    (0, _swagger.ApiTags)('sla'),
    (0, _common.Controller)('sla'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _prismaservice.PrismaService === "undefined" ? Object : _prismaservice.PrismaService,
        typeof _slapolicy.SlaPolicy === "undefined" ? Object : _slapolicy.SlaPolicy,
        typeof _slaclockservice.SlaClockService === "undefined" ? Object : _slaclockservice.SlaClockService
    ])
], SlaController);

//# sourceMappingURL=sla.controller.js.map