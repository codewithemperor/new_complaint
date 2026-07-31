"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "DepartmentsService", {
    enumerable: true,
    get: function() {
        return DepartmentsService;
    }
});
const _common = require("@nestjs/common");
const _prismaservice = require("../prisma/prisma.service");
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
let DepartmentsService = class DepartmentsService {
    constructor(prisma){
        this.prisma = prisma;
    }
    /** Returns all departments, ordered by name. */ findAll() {
        return this.prisma.department.findMany({
            orderBy: {
                name: 'asc'
            },
            select: {
                id: true,
                name: true,
                code: true,
                description: true
            }
        });
    }
    findByCode(code) {
        return this.prisma.department.findUnique({
            where: {
                code
            }
        });
    }
    /** Create a department. */ async create(dto) {
        const existing = await this.prisma.department.findUnique({
            where: {
                code: dto.code
            }
        });
        if (existing) {
            throw new _common.ConflictException(`Department code "${dto.code}" already exists.`);
        }
        return this.prisma.department.create({
            data: {
                name: dto.name,
                code: dto.code,
                description: dto.description
            },
            select: {
                id: true,
                name: true,
                code: true,
                description: true
            }
        });
    }
    /** Update a department. */ async update(id, dto) {
        const dept = await this.prisma.department.findUnique({
            where: {
                id
            }
        });
        if (!dept) throw new _common.NotFoundException('Department not found.');
        if (dto.code && dto.code !== dept.code) {
            const clash = await this.prisma.department.findUnique({
                where: {
                    code: dto.code
                }
            });
            if (clash) {
                throw new _common.ConflictException(`Department code "${dto.code}" already exists.`);
            }
        }
        return this.prisma.department.update({
            where: {
                id
            },
            data: {
                name: dto.name,
                code: dto.code,
                description: dto.description
            },
            select: {
                id: true,
                name: true,
                code: true,
                description: true
            }
        });
    }
    /**
   * Delete a department — only if it has no active users or open tickets
   * (referential integrity). Otherwise throw 409 with a helpful message.
   */ async remove(id) {
        const dept = await this.prisma.department.findUnique({
            where: {
                id
            }
        });
        if (!dept) throw new _common.NotFoundException('Department not found.');
        const [activeUsers, openTickets] = await Promise.all([
            this.prisma.user.count({
                where: {
                    departmentId: id,
                    isActive: true
                }
            }),
            this.prisma.ticket.count({
                where: {
                    departmentId: id,
                    status: {
                        notIn: [
                            'CLOSED'
                        ]
                    }
                }
            })
        ]);
        if (activeUsers > 0 || openTickets > 0) {
            throw new _common.ConflictException(`Cannot delete: department has ${activeUsers} active user(s) and ${openTickets} open ticket(s). Reassign them first.`);
        }
        await this.prisma.department.delete({
            where: {
                id
            }
        });
        return {
            id,
            deleted: true
        };
    }
};
DepartmentsService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _prismaservice.PrismaService === "undefined" ? Object : _prismaservice.PrismaService
    ])
], DepartmentsService);

//# sourceMappingURL=departments.service.js.map