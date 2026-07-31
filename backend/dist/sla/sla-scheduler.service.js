"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "SlaScheduler", {
    enumerable: true,
    get: function() {
        return SlaScheduler;
    }
});
const _common = require("@nestjs/common");
const _schedule = require("@nestjs/schedule");
const _prismaservice = require("../prisma/prisma.service");
const _slapolicy = require("./sla-policy");
const _slaclockservice = require("./sla-clock.service");
const _escalationservice = require("../approvals/escalation.service");
const _ticketstatus = require("../common/types/ticket-status");
const _eventemitter = require("@nestjs/event-emitter");
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
let SlaScheduler = class SlaScheduler {
    static{
        /** Marker for system-initiated movements (no real user). */ this.SYSTEM_ACTOR = '00000000-0000-0000-0000-000000000000';
    }
    static{
        /** Active statuses whose SLA clock is running. */ this.ACTIVE_STATUSES = [
            _ticketstatus.TicketStatus.ASSIGNED,
            _ticketstatus.TicketStatus.IN_PROGRESS,
            _ticketstatus.TicketStatus.PENDING_APPROVAL,
            _ticketstatus.TicketStatus.APPROVED
        ];
    }
    constructor(prisma, policy, clock, escalation, eventEmitter){
        this.prisma = prisma;
        this.policy = policy;
        this.clock = clock;
        this.escalation = escalation;
        this.eventEmitter = eventEmitter;
        this.logger = new _common.Logger(SlaScheduler.name);
    }
    /** Hourly — emit SLA_WARNING at the warning threshold (idempotent). */ async checkWarnings() {
        const candidates = await this.fetchActiveClockRunning();
        let warned = 0;
        const threshold = this.policy.warningThreshold();
        for (const t of candidates){
            if (t.slaBreached) continue;
            const remaining = await this.clock.remainingHours(t.id);
            if (remaining === null || remaining > threshold * (t.slaTargetHours ?? 0)) continue;
            // Idempotency: only warn once per ticket.
            const already = await this.prisma.notificationLog.findFirst({
                where: {
                    ticketId: t.id,
                    eventId: 'SLA_WARNING',
                    status: 'SENT'
                }
            });
            if (already) continue;
            this.eventEmitter.emit('sla.warning', {
                ticketId: t.id,
                percentElapsed: Math.round((1 - remaining / (t.slaTargetHours ?? 1)) * 100),
                dueAt: t.slaStartedAt ? new Date(t.slaStartedAt.getTime() + (t.slaTargetHours ?? 0) * 3600_000) : null
            });
            warned++;
        }
        if (warned > 0) this.logger.log(`SLA warnings emitted: ${warned}`);
    }
    /** Hourly — detect breaches, set slaBreached, auto-escalate one tier. */ async checkBreaches() {
        const candidates = await this.fetchActiveClockRunning();
        let breached = 0;
        for (const t of candidates){
            if (t.slaBreached) continue;
            const remaining = await this.clock.remainingHours(t.id);
            if (remaining === null || remaining > 0) continue;
            // Breach detected.
            await this.prisma.ticket.update({
                where: {
                    id: t.id
                },
                data: {
                    slaBreached: true
                }
            });
            await this.handleAutoEscalation(t.id, t.priority, t.status);
            breached++;
        }
        if (breached > 0) this.logger.log(`SLA breaches processed: ${breached}`);
    }
    /**
   * Auto-escalate a breached ticket one tier. If there's an active
   * ApprovalRequest, advance it (PENDING_APPROVAL). Otherwise (ticket stuck in
   * ASSIGNED/IN_PROGRESS with no officer action), create an approval request
   * addressed to the HOD — the first escalation target. Writes an
   * AUTO_ESCALATED movement either way.
   */ async handleAutoEscalation(ticketId, priority, status) {
        const ticket = await this.prisma.ticket.findUnique({
            where: {
                id: ticketId
            },
            select: {
                id: true,
                departmentId: true
            }
        });
        if (!ticket) return;
        try {
            if (status === _ticketstatus.TicketStatus.PENDING_APPROVAL) {
                // Advance the existing approval chain one tier.
                await this.prisma.$transaction(async (tx)=>{
                    await this.escalation.advance(tx, ticketId, SlaScheduler.SYSTEM_ACTOR, 'SLA breach auto-escalation');
                });
            } else {
                // No active approval — escalate to the HOD (create a PENDING request).
                const hodId = await this.escalation.resolveApprover('DIRECTOR', ticket.departmentId);
                await this.prisma.$transaction(async (tx)=>{
                    await tx.approvalRequest.create({
                        data: {
                            ticketId,
                            requestedById: SlaScheduler.SYSTEM_ACTOR,
                            approverRole: 'DIRECTOR',
                            currentApproverId: hodId,
                            status: 'PENDING'
                        }
                    });
                    await tx.ticketMovement.create({
                        data: {
                            ticketId,
                            type: 'AUTO_ESCALATED',
                            toUserId: hodId,
                            note: 'SLA breach auto-escalation to HOD'
                        }
                    });
                });
            }
        } catch (err) {
            // Already at top tier is fine; log and continue.
            this.logger.warn(`Auto-escalation for ${ticketId}: ${err.message}`);
        }
        const chain = this.policy.escalationChain(priority ?? _ticketstatus.Priority.P4);
        const escalatedToRole = chain[0] ?? 'DIRECTOR';
        this.eventEmitter.emit('sla.breach', {
            ticketId,
            escalatedToRole
        });
    }
    /**
   * Fetch active, clock-running tickets (awaiting = NONE, not breached unless
   * the warning check needs them). Paginated to stay bounded.
   */ async fetchActiveClockRunning() {
        return this.prisma.ticket.findMany({
            where: {
                status: {
                    in: SlaScheduler.ACTIVE_STATUSES
                },
                awaiting: _ticketstatus.AwaitingState.NONE,
                slaStartedAt: {
                    not: null
                },
                slaTargetHours: {
                    not: null
                }
            },
            select: {
                id: true,
                status: true,
                priority: true,
                slaStartedAt: true,
                slaTargetHours: true,
                slaBreached: true
            },
            take: 500
        });
    }
};
_ts_decorate([
    (0, _schedule.Cron)(_schedule.CronExpression.EVERY_HOUR),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", []),
    _ts_metadata("design:returntype", Promise)
], SlaScheduler.prototype, "checkWarnings", null);
_ts_decorate([
    (0, _schedule.Cron)(_schedule.CronExpression.EVERY_HOUR),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", []),
    _ts_metadata("design:returntype", Promise)
], SlaScheduler.prototype, "checkBreaches", null);
SlaScheduler = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _prismaservice.PrismaService === "undefined" ? Object : _prismaservice.PrismaService,
        typeof _slapolicy.SlaPolicy === "undefined" ? Object : _slapolicy.SlaPolicy,
        typeof _slaclockservice.SlaClockService === "undefined" ? Object : _slaclockservice.SlaClockService,
        typeof _escalationservice.EscalationService === "undefined" ? Object : _escalationservice.EscalationService,
        typeof _eventemitter.EventEmitter2 === "undefined" ? Object : _eventemitter.EventEmitter2
    ])
], SlaScheduler);

//# sourceMappingURL=sla-scheduler.service.js.map