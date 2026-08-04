"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "RoutingService", {
    enumerable: true,
    get: function() {
        return RoutingService;
    }
});
const _common = require("@nestjs/common");
const _eventemitter = require("@nestjs/event-emitter");
const _prismaservice = require("../prisma/prisma.service");
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
let RoutingService = class RoutingService {
    constructor(prisma, eventEmitter){
        this.prisma = prisma;
        this.eventEmitter = eventEmitter;
    }
    async resolve(input) {
        const rule = await this.prisma.routingRule.findFirst({
            where: {
                category: input.category,
                isActive: true,
                OR: [
                    {
                        priority: input.priority,
                        lga: input.lga ?? null
                    },
                    {
                        priority: input.priority,
                        lga: null
                    },
                    {
                        priority: null,
                        lga: input.lga ?? null
                    },
                    {
                        priority: null,
                        lga: null
                    }
                ]
            },
            orderBy: {
                priorityRank: 'desc'
            }
        });
        if (!rule) return null;
        let officerId = rule.defaultOfficerId ?? undefined;
        if (!officerId) {
            const fallbackOfficer = await this.prisma.user.findFirst({
                where: {
                    departmentId: rule.departmentId,
                    role: 'DEPARTMENT_STAFF',
                    isActive: true
                }
            });
            officerId = fallbackOfficer?.id;
            if (!officerId) {
                const fallbackHod = await this.prisma.user.findFirst({
                    where: {
                        departmentId: rule.departmentId,
                        role: 'DEPARTMENT_HOD',
                        isActive: true
                    }
                });
                officerId = fallbackHod?.id;
            }
        }
        return {
            departmentId: rule.departmentId,
            officerId
        };
    }
    async assign(tx, ticketId, departmentId, officerId, triagedById, note) {
        await tx.ticket.update({
            where: {
                id: ticketId
            },
            data: {
                departmentId,
                assignedOfficerId: officerId ?? null,
                status: 'ASSIGNED'
            }
        });
        await tx.ticketMovement.create({
            data: {
                ticketId,
                type: _ticketstatus.MovementType.ASSIGNED,
                fromUserId: triagedById,
                toUserId: officerId ?? null,
                note: note ?? `Assigned to department`
            }
        });
    }
    async emitAssigned(ticketId) {
        this.eventEmitter.emit('ticket.assigned', {
            ticketId
        });
    }
};
RoutingService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _prismaservice.PrismaService === "undefined" ? Object : _prismaservice.PrismaService,
        typeof _eventemitter.EventEmitter2 === "undefined" ? Object : _eventemitter.EventEmitter2
    ])
], RoutingService);

//# sourceMappingURL=routing.service.js.map