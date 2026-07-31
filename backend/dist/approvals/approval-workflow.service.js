"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ApprovalWorkflowService", {
    enumerable: true,
    get: function() {
        return ApprovalWorkflowService;
    }
});
const _common = require("@nestjs/common");
const _eventemitter = require("@nestjs/event-emitter");
const _prismaservice = require("../prisma/prisma.service");
const _slaclockservice = require("../sla/sla-clock.service");
const _ticketstatemachine = require("../tickets/ticket-state-machine");
const _escalationservice = require("./escalation.service");
const _ticketstatus = require("../common/types/ticket-status");
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
let ApprovalWorkflowService = class ApprovalWorkflowService {
    constructor(prisma, stateMachine, slaClock, escalation, eventEmitter){
        this.prisma = prisma;
        this.stateMachine = stateMachine;
        this.slaClock = slaClock;
        this.escalation = escalation;
        this.eventEmitter = eventEmitter;
    }
    /**
   * Approve at the current tier. HOD approval is sufficient (departmental
   * sign-off) → ticket returns to officer (APPROVED → IN_PROGRESS). PS /
   * Commissioner approvals likewise complete the chain and resume the SLA clock.
   */ async approve(ticketId, dto, user) {
        const { request, ticket } = await this.loadAndAuthorize(ticketId, user);
        const now = new Date();
        await this.prisma.$transaction(async (tx)=>{
            // Concurrency guard: only the first decide flips PENDING → APPROVED.
            // The WHERE clause ensures a second concurrent attempt updates 0 rows.
            const updated = await tx.approvalRequest.updateMany({
                where: {
                    id: request.id,
                    status: 'PENDING'
                },
                data: {
                    status: 'APPROVED',
                    actionedById: user.id,
                    decision: dto.comment ?? null,
                    decidedAt: now
                }
            });
            if (updated.count === 0) {
                throw new _common.ConflictException('This approval request has already been decided.');
            }
            this.stateMachine.assertCanTransition(ticket.status, _ticketstatus.TicketStatus.APPROVED);
            await tx.ticket.update({
                where: {
                    id: ticketId
                },
                data: {
                    status: _ticketstatus.TicketStatus.APPROVED
                }
            });
            // APPROVED → IN_PROGRESS (back to officer to finalise resolution, M6).
            await tx.ticket.update({
                where: {
                    id: ticketId
                },
                data: {
                    status: _ticketstatus.TicketStatus.IN_PROGRESS
                }
            });
            await this.slaClock.resume(tx, ticketId);
            await this.recordDecision(tx, ticketId, user, 'APPROVED', dto.comment);
        });
        this.eventEmitter.emit('ticket.approved', {
            ticketId,
            approverName: user.fullName,
            approverRole: user.role,
            comment: dto.comment
        });
        return {
            status: _ticketstatus.TicketStatus.IN_PROGRESS
        };
    }
    /** Return to the officer with mandatory feedback. Resumes the SLA clock. */ async return(ticketId, dto, user) {
        const { request, ticket } = await this.loadAndAuthorize(ticketId, user);
        await this.prisma.$transaction(async (tx)=>{
            const updated = await tx.approvalRequest.updateMany({
                where: {
                    id: request.id,
                    status: 'PENDING'
                },
                data: {
                    status: 'RETURNED',
                    actionedById: user.id,
                    decision: dto.comment,
                    decidedAt: new Date()
                }
            });
            if (updated.count === 0) {
                throw new _common.ConflictException('This approval request has already been decided.');
            }
            this.stateMachine.assertCanTransition(ticket.status, _ticketstatus.TicketStatus.IN_PROGRESS);
            await tx.ticket.update({
                where: {
                    id: ticketId
                },
                data: {
                    status: _ticketstatus.TicketStatus.IN_PROGRESS
                }
            });
            await this.slaClock.resume(tx, ticketId);
            await this.recordDecision(tx, ticketId, user, 'RETURNED', dto.comment);
        });
        this.eventEmitter.emit('ticket.returned', {
            ticketId,
            approverName: user.fullName,
            approverRole: user.role,
            comment: dto.comment
        });
        return {
            status: _ticketstatus.TicketStatus.IN_PROGRESS
        };
    }
    /**
   * Escalate to the next tier (HOD → PS, PS → Commissioner). The ticket stays
   * PENDING_APPROVAL and the *same* approval request advances its
   * `approverRole` / `currentApproverId` to the next tier — the request is
   * still in-flight, just held higher up. (The decision history is captured
   * via the movement + system minute, not by closing the request.)
   */ async escalate(ticketId, dto, user) {
        const { request, ticket } = await this.loadAndAuthorize(ticketId, user);
        if (ticket.status !== _ticketstatus.TicketStatus.PENDING_APPROVAL) {
            throw new _common.BadRequestException('Only pending-approval tickets can be escalated.');
        }
        let newRole;
        await this.prisma.$transaction(async (tx)=>{
            // Advance FIRST (while the request is still PENDING — advance() looks up
            // the active PENDING request). It updates approverRole + currentApproverId
            // on the same row and writes the ESCALATED movement.
            const result = await this.escalation.advance(tx, ticketId, user.id, dto.reason);
            newRole = result.newApproverRole;
            // Concurrency guard: ensure nobody else decided between our load and now.
            const stillPending = await tx.approvalRequest.count({
                where: {
                    id: request.id,
                    status: 'PENDING'
                }
            });
            if (stillPending === 0) {
                throw new _common.ConflictException('This approval request has already been decided.');
            }
            await this.recordDecision(tx, ticketId, user, 'ESCALATED', dto.reason);
        });
        const eventName = newRole === _ticketstatus.ApproverRole.COMMISSIONER ? 'escalation.to.commissioner' : 'escalation.to.ps';
        this.eventEmitter.emit(eventName, {
            ticketId,
            escalatedByName: user.fullName,
            reason: dto.reason
        });
        return {
            escalatedTo: newRole
        };
    }
    /**
   * Refer externally (e.g. to the Public Complaints Commission). Terminal:
   * status → REFERRED. Citizen is notified naming the body.
   */ async refer(ticketId, dto, user) {
        const { request, ticket } = await this.loadAndAuthorize(ticketId, user);
        await this.prisma.$transaction(async (tx)=>{
            const updated = await tx.approvalRequest.updateMany({
                where: {
                    id: request.id,
                    status: 'PENDING'
                },
                data: {
                    status: 'REFERRED',
                    actionedById: user.id,
                    decision: dto.reason ?? null,
                    referredBody: dto.referredBody,
                    decidedAt: new Date()
                }
            });
            if (updated.count === 0) {
                throw new _common.ConflictException('This approval request has already been decided.');
            }
            this.stateMachine.assertCanTransition(ticket.status, _ticketstatus.TicketStatus.REFERRED);
            await tx.ticket.update({
                where: {
                    id: ticketId
                },
                data: {
                    status: _ticketstatus.TicketStatus.REFERRED
                }
            });
            await this.recordDecision(tx, ticketId, user, 'REFERRED', dto.reason);
        });
        this.eventEmitter.emit('external.referral', {
            ticketId,
            referredBody: dto.referredBody,
            reason: dto.reason
        });
        return {
            status: _ticketstatus.TicketStatus.REFERRED
        };
    }
    /**
   * Load the ticket + its active PENDING approval request, and verify the
   * caller is the current approver (or an active delegate for PS).
   */ async loadAndAuthorize(ticketId, user) {
        const ticket = await this.prisma.ticket.findUnique({
            where: {
                id: ticketId
            },
            select: {
                id: true,
                status: true,
                departmentId: true
            }
        });
        if (!ticket) throw new _common.NotFoundException('Ticket not found');
        const request = await this.prisma.approvalRequest.findFirst({
            where: {
                ticketId,
                status: 'PENDING'
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        if (!request) {
            throw new _common.NotFoundException('No pending approval request for this ticket.');
        }
        await this.assertApprover(request, ticket, user);
        return {
            request,
            ticket
        };
    }
    /**
   * The caller must be the request's currentApprover. For the PS tier, an
   * active delegate may also act. SUPER_ADMIN bypasses.
   */ async assertApprover(request, ticket, user) {
        const { Role } = await Promise.resolve().then(()=>/*#__PURE__*/ _interop_require_wildcard(require("../common/types/role")));
        if (user.role === Role.SUPER_ADMIN) return;
        if (request.currentApproverId === user.id) return;
        // Delegation: PS-tier request where the caller is the PS's active delegate.
        if (request.approverRole === _ticketstatus.ApproverRole.PERMANENT_SECRETARY && request.currentApproverId) {
            const now = new Date();
            const delegation = await this.prisma.delegation.findFirst({
                where: {
                    delegatorId: request.currentApproverId,
                    delegateId: user.id,
                    isActive: true,
                    validFrom: {
                        lte: now
                    },
                    validTo: {
                        gte: now
                    }
                }
            });
            if (delegation) return;
        }
        throw new _common.ForbiddenException('You are not the current approver for this ticket.');
    }
    /**
   * Append a system minute + a TicketMovement capturing the decision, per
   * spec §6 ("each decision appends a TicketMovement and a system Minute").
   */ async recordDecision(tx, ticketId, user, decision, comment) {
        await tx.minute.create({
            data: {
                ticketId,
                authorId: user.id,
                body: `[${decision}] ${comment ?? ''}`.trim(),
                isInternal: true
            }
        });
        await tx.ticketMovement.create({
            data: {
                ticketId,
                type: decision === 'APPROVED' ? 'APPROVED' : 'ESCALATED',
                fromUserId: user.id,
                note: `${decision}${comment ? ': ' + comment : ''}`
            }
        });
    }
    /**
   * List approval requests for an approver's inbox. Filters by the caller's
   * tier (role) and optional status. Eager-loads ticket + officer for display.
   */ async findInbox(filters) {
        const { approverRole, status, currentApproverId, page = 1, pageSize = 20 } = filters;
        const where = {};
        if (approverRole) where.approverRole = approverRole;
        if (status) where.status = status;
        if (currentApproverId) where.currentApproverId = currentApproverId;
        const [items, total] = await Promise.all([
            this.prisma.approvalRequest.findMany({
                where,
                orderBy: {
                    createdAt: 'desc'
                },
                skip: (page - 1) * pageSize,
                take: pageSize,
                include: {
                    ticket: {
                        select: {
                            id: true,
                            ticketCode: true,
                            subject: true,
                            priority: true,
                            status: true,
                            department: {
                                select: {
                                    name: true
                                }
                            },
                            assignedOfficer: {
                                select: {
                                    fullName: true
                                }
                            },
                            minutes: {
                                where: {
                                    isInternal: false
                                },
                                orderBy: {
                                    createdAt: 'asc'
                                },
                                take: 1,
                                select: {
                                    body: true
                                }
                            }
                        }
                    }
                }
            }),
            this.prisma.approvalRequest.count({
                where
            })
        ]);
        return {
            items,
            total,
            page,
            pageSize
        };
    }
};
ApprovalWorkflowService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _prismaservice.PrismaService === "undefined" ? Object : _prismaservice.PrismaService,
        typeof _ticketstatemachine.TicketStateMachine === "undefined" ? Object : _ticketstatemachine.TicketStateMachine,
        typeof _slaclockservice.SlaClockService === "undefined" ? Object : _slaclockservice.SlaClockService,
        typeof _escalationservice.EscalationService === "undefined" ? Object : _escalationservice.EscalationService,
        typeof _eventemitter.EventEmitter2 === "undefined" ? Object : _eventemitter.EventEmitter2
    ])
], ApprovalWorkflowService);

//# sourceMappingURL=approval-workflow.service.js.map