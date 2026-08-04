"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "RoutingRulesController", {
    enumerable: true,
    get: function() {
        return RoutingRulesController;
    }
});
const _common = require("@nestjs/common");
const _swagger = require("@nestjs/swagger");
const _prismaservice = require("../prisma/prisma.service");
const _jwtauthguard = require("../common/guards/jwt-auth.guard");
const _rolesguard = require("../common/guards/roles.guard");
const _rolesdecorator = require("../common/decorators/roles.decorator");
const _permissionsdecorator = require("../common/decorators/permissions.decorator");
const _role = require("../common/types/role");
const _permission = require("../common/types/permission");
const _createroutingruledto = require("./dtos/create-routing-rule.dto");
const _updateroutingruledto = require("./dtos/update-routing-rule.dto");
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
let RoutingRulesController = class RoutingRulesController {
    constructor(prisma){
        this.prisma = prisma;
    }
    async list() {
        return this.prisma.routingRule.findMany({
            orderBy: [
                {
                    category: 'asc'
                },
                {
                    priorityRank: 'desc'
                }
            ],
            include: {
                department: {
                    select: {
                        id: true,
                        name: true,
                        code: true
                    }
                }
            }
        });
    }
    async create(dto) {
        return this.prisma.routingRule.create({
            data: {
                category: dto.category,
                priority: dto.priority,
                lga: dto.lga,
                departmentId: dto.departmentId,
                defaultOfficerId: dto.defaultOfficerId,
                priorityRank: dto.priorityRank ?? 0,
                isActive: dto.isActive ?? true
            },
            include: {
                department: {
                    select: {
                        id: true,
                        name: true,
                        code: true
                    }
                }
            }
        });
    }
    async update(id, dto) {
        const existing = await this.prisma.routingRule.findUnique({
            where: {
                id
            }
        });
        if (!existing) throw new _common.NotFoundException('Routing rule not found');
        return this.prisma.routingRule.update({
            where: {
                id
            },
            data: {
                ...dto.category !== undefined && {
                    category: dto.category
                },
                ...dto.priority !== undefined && {
                    priority: dto.priority
                },
                ...dto.lga !== undefined && {
                    lga: dto.lga
                },
                ...dto.departmentId !== undefined && {
                    departmentId: dto.departmentId
                },
                ...dto.defaultOfficerId !== undefined && {
                    defaultOfficerId: dto.defaultOfficerId
                },
                ...dto.priorityRank !== undefined && {
                    priorityRank: dto.priorityRank
                },
                ...dto.isActive !== undefined && {
                    isActive: dto.isActive
                }
            },
            include: {
                department: {
                    select: {
                        id: true,
                        name: true,
                        code: true
                    }
                }
            }
        });
    }
    async remove(id) {
        const existing = await this.prisma.routingRule.findUnique({
            where: {
                id
            }
        });
        if (!existing) throw new _common.NotFoundException('Routing rule not found');
        await this.prisma.routingRule.delete({
            where: {
                id
            }
        });
        return {
            deleted: true
        };
    }
};
_ts_decorate([
    (0, _common.Get)(),
    (0, _swagger.ApiOperation)({
        summary: 'List all routing rules (Super Admin)'
    }),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", []),
    _ts_metadata("design:returntype", Promise)
], RoutingRulesController.prototype, "list", null);
_ts_decorate([
    (0, _common.Post)(),
    (0, _swagger.ApiOperation)({
        summary: 'Create a routing rule (Super Admin)'
    }),
    _ts_param(0, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _createroutingruledto.CreateRoutingRuleDto === "undefined" ? Object : _createroutingruledto.CreateRoutingRuleDto
    ]),
    _ts_metadata("design:returntype", Promise)
], RoutingRulesController.prototype, "create", null);
_ts_decorate([
    (0, _common.Patch)(':id'),
    (0, _swagger.ApiOperation)({
        summary: 'Update a routing rule (Super Admin)'
    }),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof _updateroutingruledto.UpdateRoutingRuleDto === "undefined" ? Object : _updateroutingruledto.UpdateRoutingRuleDto
    ]),
    _ts_metadata("design:returntype", Promise)
], RoutingRulesController.prototype, "update", null);
_ts_decorate([
    (0, _common.Delete)(':id'),
    (0, _swagger.ApiOperation)({
        summary: 'Delete a routing rule (Super Admin)'
    }),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], RoutingRulesController.prototype, "remove", null);
RoutingRulesController = _ts_decorate([
    (0, _swagger.ApiTags)('routing-rules'),
    (0, _common.Controller)('routing-rules'),
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard, _rolesguard.RolesGuard),
    (0, _rolesdecorator.Roles)(_role.Role.ADMIN),
    (0, _permissionsdecorator.Permissions)(_permission.Permission.ROUTING),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _prismaservice.PrismaService === "undefined" ? Object : _prismaservice.PrismaService
    ])
], RoutingRulesController);

//# sourceMappingURL=routing-rules.controller.js.map