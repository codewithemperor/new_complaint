"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "DelegationsService", {
    enumerable: true,
    get: function() {
        return DelegationsService;
    }
});
const _common = require("@nestjs/common");
const _prismaservice = require("../prisma/prisma.service");
const _role = require("../common/types/role");
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
let DelegationsService = class DelegationsService {
    constructor(prisma){
        this.prisma = prisma;
    }
    async create(dto, user) {
        if (user.role !== _role.Role.PERMANENT_SECRETARY && !user.isSuperAdmin) {
            throw new _common.ForbiddenException('Only the Permanent Secretary may delegate approval authority.');
        }
        const validFrom = new Date(dto.validFrom);
        const validTo = new Date(dto.validTo);
        if (validTo <= validFrom) {
            throw new _common.BadRequestException('validTo must be after validFrom.');
        }
        const delegate = await this.prisma.user.findUnique({
            where: {
                id: dto.delegateId
            }
        });
        if (!delegate) throw new _common.NotFoundException('Delegate user not found.');
        if (delegate.role !== _role.Role.DEPARTMENT_HOD) {
            throw new _common.BadRequestException('Delegation target must be a Department HOD.');
        }
        return this.prisma.delegation.create({
            data: {
                delegatorId: user.id,
                delegateId: dto.delegateId,
                validFrom,
                validTo,
                reason: dto.reason,
                isActive: true
            }
        });
    }
    /** List delegations, optionally filtered to active ones. */ async findMany(filters) {
        const where = {};
        if (filters.activeOnly) {
            const now = new Date();
            where.isActive = true;
            where.validFrom = {
                lte: now
            };
            where.validTo = {
                gte: now
            };
        }
        if (filters.delegatorId) where.delegatorId = filters.delegatorId;
        return this.prisma.delegation.findMany({
            where,
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                delegator: {
                    select: {
                        fullName: true,
                        role: true
                    }
                },
                delegate: {
                    select: {
                        fullName: true,
                        role: true,
                        department: {
                            select: {
                                name: true
                            }
                        }
                    }
                }
            }
        });
    }
    async revoke(id, user) {
        const delegation = await this.prisma.delegation.findUnique({
            where: {
                id
            }
        });
        if (!delegation) throw new _common.NotFoundException('Delegation not found.');
        if (delegation.delegatorId !== user.id && !user.isSuperAdmin) {
            throw new _common.ForbiddenException('You may only revoke your own delegations.');
        }
        return this.prisma.delegation.update({
            where: {
                id
            },
            data: {
                isActive: false
            }
        });
    }
};
DelegationsService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _prismaservice.PrismaService === "undefined" ? Object : _prismaservice.PrismaService
    ])
], DelegationsService);

//# sourceMappingURL=delegations.service.js.map