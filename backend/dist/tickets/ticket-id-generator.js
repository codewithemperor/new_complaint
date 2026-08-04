"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "TicketIdGenerator", {
    enumerable: true,
    get: function() {
        return TicketIdGenerator;
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
let TicketIdGenerator = class TicketIdGenerator {
    constructor(prisma){
        this.prisma = prisma;
        this.logger = new _common.Logger(TicketIdGenerator.name);
    }
    /**
   * Atomically reserves the next sequence number for the current year and
   * returns the formatted ticket code. Must be called inside a transaction.
   */ async nextCode(tx) {
        const year = new Date().getFullYear();
        // Defensive sync: find the max existing numeric suffix for this year so the
        // counter never lags behind real rows (which would cause a unique violation
        // on ticket_code). Cheap (one indexed scan on ticket_code) and rare to drift.
        const latest = await tx.ticket.findFirst({
            where: {
                ticketCode: {
                    startsWith: `KWMOC-${year}-`
                }
            },
            orderBy: {
                ticketCode: 'desc'
            },
            select: {
                ticketCode: true
            }
        });
        const maxExisting = latest ? parseInt(latest.ticketCode.split('-').pop() ?? '0', 10) || 0 : 0;
        const current = await tx.ticketSequence.findUnique({
            where: {
                year
            }
        });
        const base = Math.max(current?.lastValue ?? 0, maxExisting);
        const nextValue = base + 1;
        // Upsert keeps a single row per year and persists the reconciled counter.
        await tx.ticketSequence.upsert({
            where: {
                year
            },
            update: {
                lastValue: nextValue
            },
            create: {
                id: year,
                year,
                lastValue: nextValue
            }
        });
        const code = `KWMOC-${year}-${String(nextValue).padStart(6, '0')}`;
        // If we had to jump the counter forward, surface it so it's not silent.
        if (current && nextValue > current.lastValue + 1) {
            this.logger.warn(`TicketSequence for ${year} jumped ${current.lastValue} → ${nextValue} (max existing code: ${maxExisting}).`);
        }
        return code;
    }
};
TicketIdGenerator = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _prismaservice.PrismaService === "undefined" ? Object : _prismaservice.PrismaService
    ])
], TicketIdGenerator);

//# sourceMappingURL=ticket-id-generator.js.map