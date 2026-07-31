"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "EscalationService", {
    enumerable: true,
    get: function() {
        return EscalationService;
    }
});
const _common = require("@nestjs/common");
const _prismaservice = require("../prisma/prisma.service");
const _slapolicy = require("../sla/sla-policy");
const _role = require("../common/types/role");
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
let EscalationService = class EscalationService {
    constructor(prisma, slaPolicy){
        this.prisma = prisma;
        this.slaPolicy = slaPolicy;
    }
    /**
   * Advance the current approval request one tier. Writes the role/user change
   * and a TicketMovement. Does NOT change ticket.status (it stays
   * PENDING_APPROVAL). Throws ConflictException if already at the top tier.
   */ async advance(tx, ticketId, escalatedById, reason) {
        const ticket = await tx.ticket.findUnique({
            where: {
                id: ticketId
            },
            select: {
                id: true,
                priority: true,
                departmentId: true
            }
        });
        if (!ticket) throw new _common.NotFoundException('Ticket not found');
        // The active (PENDING) approval request.
        const request = await tx.approvalRequest.findFirst({
            where: {
                ticketId,
                status: 'PENDING'
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        if (!request) {
            throw new _common.ConflictException('No pending approval request to escalate.');
        }
        const chain = this.slaPolicy.escalationChain(ticket.priority);
        const currentRole = request.approverRole;
        const currentIdx = chain.indexOf(currentRole);
        const nextRole = chain[currentIdx + 1];
        if (!nextRole) {
            throw new _common.ConflictException('Already at the top approval tier.');
        }
        const nextApproverId = await this.resolveApprover(nextRole, ticket.departmentId ?? null);
        await tx.approvalRequest.update({
            where: {
                id: request.id
            },
            data: {
                approverRole: nextRole,
                currentApproverId: nextApproverId
            }
        });
        await tx.ticketMovement.create({
            data: {
                ticketId,
                type: 'ESCALATED',
                fromUserId: escalatedById,
                toUserId: nextApproverId,
                note: reason ?? `Escalated to ${nextRole}`
            }
        });
        return {
            newApproverRole: nextRole,
            newApproverId: nextApproverId
        };
    }
    /**
   * Resolve the user occupying an approver role for a ticket.
   *  - DIRECTOR → the department's active DIRECTOR (HOD)
   *  - PERMANENT_SECRETARY → the active PS user, or their delegate if a
   *    Delegation covers the current moment.
   *  - COMMISSIONER → the active COMMISSIONER user.
   */ async resolveApprover(role, departmentId) {
        if (role === _ticketstatus.ApproverRole.DIRECTOR) {
            if (!departmentId) return null;
            const hod = await this.prisma.user.findFirst({
                where: {
                    departmentId,
                    role: _role.Role.DIRECTOR,
                    isActive: true
                }
            });
            return hod?.id ?? null;
        }
        if (role === _ticketstatus.ApproverRole.PERMANENT_SECRETARY) {
            const ps = await this.prisma.user.findFirst({
                where: {
                    role: _role.Role.PERMANENT_SECRETARY,
                    isActive: true
                }
            });
            if (!ps) return null;
            // Check for an active delegation by this PS.
            const now = new Date();
            const delegation = await this.prisma.delegation.findFirst({
                where: {
                    delegatorId: ps.id,
                    isActive: true,
                    validFrom: {
                        lte: now
                    },
                    validTo: {
                        gte: now
                    }
                }
            });
            return delegation?.delegateId ?? ps.id;
        }
        // COMMISSIONER
        const commissioner = await this.prisma.user.findFirst({
            where: {
                role: _role.Role.COMMISSIONER,
                isActive: true
            }
        });
        return commissioner?.id ?? null;
    }
};
EscalationService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _prismaservice.PrismaService === "undefined" ? Object : _prismaservice.PrismaService,
        typeof _slapolicy.SlaPolicy === "undefined" ? Object : _slapolicy.SlaPolicy
    ])
], EscalationService);

//# sourceMappingURL=escalation.service.js.map