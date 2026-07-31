"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "UsersService", {
    enumerable: true,
    get: function() {
        return UsersService;
    }
});
const _common = require("@nestjs/common");
const _bcrypt = /*#__PURE__*/ _interop_require_wildcard(require("bcrypt"));
const _prismaservice = require("../prisma/prisma.service");
const _role = require("../common/types/role");
function _getRequireWildcardCache(nodeInterop) {
    if (typeof WeakMap !== "function") return null;
    var cacheBabelInterop = new WeakMap();
    var cacheNodeInterop = new WeakMap();
    return (_getRequireWildcardCache = function(nodeInterop) {
        return nodeInterop ? cacheNodeInterop : cacheBabelInterop;
    })(nodeInterop);
}
function _interop_require_wildcard(obj, nodeInterop) {
    if (!nodeInterop && obj && obj.__esModule) return obj;
    if (obj === null || typeof obj !== "object" && typeof obj !== "function") return {
        default: obj
    };
    var cache = _getRequireWildcardCache(nodeInterop);
    if (cache && cache.has(obj)) return cache.get(obj);
    var newObj = {
        __proto__: null
    };
    var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;
    for(var key in obj){
        if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) {
            var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;
            if (desc && (desc.get || desc.set)) Object.defineProperty(newObj, key, desc);
            else newObj[key] = obj[key];
        }
    }
    newObj.default = obj;
    if (cache) cache.set(obj, newObj);
    return newObj;
}
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
const BCRYPT_COST = 12;
let UsersService = class UsersService {
    constructor(prisma){
        this.prisma = prisma;
    }
    findById(id) {
        return this.prisma.user.findUnique({
            where: {
                id
            }
        });
    }
    findByEmail(email) {
        return this.prisma.user.findUnique({
            where: {
                email
            }
        });
    }
    /** Returns a user-safe record (no passwordHash). */ findPublicById(id) {
        return this.prisma.user.findUnique({
            where: {
                id
            },
            select: {
                id: true,
                email: true,
                fullName: true,
                role: true,
                designation: true,
                phone: true,
                departmentId: true,
                isActive: true,
                lastLoginAt: true
            }
        });
    }
    async touchLastLogin(id) {
        await this.prisma.user.update({
            where: {
                id
            },
            data: {
                lastLoginAt: new Date()
            }
        });
    }
    /** List staff users with optional filters (admin user-management view). */ findMany(filters) {
        const { role, departmentId, isActive, page = 1, pageSize = 50 } = filters;
        const where = {};
        if (role) where.role = role;
        if (departmentId) where.departmentId = departmentId;
        if (typeof isActive === 'boolean') where.isActive = isActive;
        return this.prisma.$transaction(async (tx)=>{
            const [items, total] = await Promise.all([
                tx.user.findMany({
                    where,
                    orderBy: {
                        fullName: 'asc'
                    },
                    skip: (page - 1) * pageSize,
                    take: pageSize,
                    select: {
                        id: true,
                        email: true,
                        fullName: true,
                        role: true,
                        designation: true,
                        phone: true,
                        departmentId: true,
                        department: {
                            select: {
                                id: true,
                                name: true,
                                code: true
                            }
                        },
                        isActive: true,
                        lastLoginAt: true
                    }
                }),
                tx.user.count({
                    where
                })
            ]);
            return {
                items,
                total,
                page,
                pageSize
            };
        });
    }
    /** Create a new staff user (Super Admin). */ async create(dto) {
        const existing = await this.prisma.user.findUnique({
            where: {
                email: dto.email
            }
        });
        if (existing) {
            throw new _common.ConflictException('A user with this email already exists.');
        }
        const passwordHash = await _bcrypt.hash(dto.password, BCRYPT_COST);
        return this.prisma.user.create({
            data: {
                email: dto.email,
                fullName: dto.fullName,
                role: dto.role,
                passwordHash,
                designation: dto.designation,
                phone: dto.phone,
                departmentId: dto.departmentId
            },
            select: {
                id: true,
                email: true,
                fullName: true,
                role: true,
                designation: true,
                phone: true,
                departmentId: true,
                isActive: true
            }
        });
    }
    /** Update a staff user (Super Admin). */ async update(id, dto) {
        const user = await this.prisma.user.findUnique({
            where: {
                id
            }
        });
        if (!user) throw new _common.NotFoundException('User not found.');
        // Hash a new password if provided.
        let passwordHash;
        if (dto.password) {
            passwordHash = await _bcrypt.hash(dto.password, BCRYPT_COST);
        }
        return this.prisma.user.update({
            where: {
                id
            },
            data: {
                fullName: dto.fullName,
                role: dto.role,
                designation: dto.designation,
                phone: dto.phone,
                departmentId: dto.departmentId,
                isActive: dto.isActive,
                ...passwordHash ? {
                    passwordHash
                } : {}
            },
            select: {
                id: true,
                email: true,
                fullName: true,
                role: true,
                designation: true,
                phone: true,
                departmentId: true,
                isActive: true
            }
        });
    }
    /** Soft-deactivate a user (isActive = false). Never hard-deletes. */ async deactivate(id) {
        const user = await this.prisma.user.findUnique({
            where: {
                id
            }
        });
        if (!user) throw new _common.NotFoundException('User not found.');
        if (user.role === _role.Role.SUPER_ADMIN) {
            throw new _common.BadRequestException('Super Admin accounts cannot be deactivated.');
        }
        return this.prisma.user.update({
            where: {
                id
            },
            data: {
                isActive: false
            },
            select: {
                id: true,
                isActive: true
            }
        });
    }
};
UsersService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _prismaservice.PrismaService === "undefined" ? Object : _prismaservice.PrismaService
    ])
], UsersService);

//# sourceMappingURL=users.service.js.map