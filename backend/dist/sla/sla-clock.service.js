"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "SlaClockService", {
    enumerable: true,
    get: function() {
        return SlaClockService;
    }
});
const _common = require("@nestjs/common");
const _prismaservice = require("../prisma/prisma.service");
const _slapolicy = require("./sla-policy");
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
let SlaClockService = class SlaClockService {
    constructor(prisma, policy){
        this.prisma = prisma;
        this.policy = policy;
    }
    /**
   * Start the clock for a ticket (officer clicks Start → IN_PROGRESS).
   * Snapshots the resolution target for the ticket's priority.
   */ async start(tx, ticket) {
        const priority = ticket.priority ?? _ticketstatus.Priority.P4;
        const targetHours = this.policy.resolutionHours(priority);
        const now = new Date();
        await tx.ticket.update({
            where: {
                id: ticket.id
            },
            data: {
                slaStartedAt: now,
                slaFirstRespondedAt: now,
                slaTargetHours: targetHours,
                slaDueAt: new Date(now.getTime() + targetHours * 3600_000),
                slaPausedAt: null
            }
        });
    }
    /**
   * Pause the clock for an out-of-officer-hands wait (info request, approval,
   * inter-dept consultation). Closes any already-open pause first.
   */ async pause(tx, ticketId, reason) {
        const now = new Date();
        // Close any currently-open pause for this ticket.
        await tx.slaPause.updateMany({
            where: {
                ticketId,
                resumedAt: null
            },
            data: {
                resumedAt: now
            }
        });
        // Open a new pause interval.
        await tx.slaPause.create({
            data: {
                ticketId,
                reason,
                startedAt: now
            }
        });
        await tx.ticket.update({
            where: {
                id: ticketId
            },
            data: {
                slaPausedAt: now,
                awaiting: reason
            }
        });
    }
    /**
   * Resume the clock (e.g. citizen replied to an info request). Closes the
   * open pause and clears the awaiting flag.
   */ async resume(tx, ticketId) {
        await tx.slaPause.updateMany({
            where: {
                ticketId,
                resumedAt: null
            },
            data: {
                resumedAt: new Date()
            }
        });
        await tx.ticket.update({
            where: {
                id: ticketId
            },
            data: {
                slaPausedAt: null,
                awaiting: _ticketstatus.AwaitingState.NONE
            }
        });
    }
    /**
   * Net elapsed hours since the clock started, minus all closed pause
   * intervals. If a pause is currently open, the elapsed time stops at the
   * pause start (the clock is "off").
   */ async elapsedHours(ticketId) {
        const ticket = await this.prisma.ticket.findUnique({
            where: {
                id: ticketId
            },
            select: {
                slaStartedAt: true
            }
        });
        if (!ticket?.slaStartedAt) return 0;
        const pauses = await this.prisma.slaPause.findMany({
            where: {
                ticketId
            },
            select: {
                startedAt: true,
                resumedAt: true
            }
        });
        const now = new Date();
        let pausedMs = 0;
        for (const p of pauses){
            const end = p.resumedAt ?? now; // open pause: count up to now
            pausedMs += end.getTime() - p.startedAt.getTime();
        }
        const elapsedMs = now.getTime() - ticket.slaStartedAt.getTime() - pausedMs;
        return Math.max(0, elapsedMs / 3600_000);
    }
    /**
   * Remaining hours before breach. Negative ⇒ already breached. Returns null
   * if the clock hasn't started or has no target snapshot.
   */ async remainingHours(ticketId) {
        const ticket = await this.prisma.ticket.findUnique({
            where: {
                id: ticketId
            },
            select: {
                slaTargetHours: true
            }
        });
        if (!ticket?.slaTargetHours) return null;
        const elapsed = await this.elapsedHours(ticketId);
        return ticket.slaTargetHours - elapsed;
    }
};
SlaClockService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _prismaservice.PrismaService === "undefined" ? Object : _prismaservice.PrismaService,
        typeof _slapolicy.SlaPolicy === "undefined" ? Object : _slapolicy.SlaPolicy
    ])
], SlaClockService);

//# sourceMappingURL=sla-clock.service.js.map