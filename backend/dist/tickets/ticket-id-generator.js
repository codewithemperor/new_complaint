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
    }
    /**
   * Atomically reserves the next sequence number for the given year and
   * returns the formatted ticket code. Must be called inside a transaction.
   */ async nextCode(tx) {
        const year = new Date().getFullYear();
        // SQLite doesn't support SELECT FOR UPDATE, so we use upsert.
        const seq = await tx.ticketSequence.upsert({
            where: {
                year
            },
            update: {
                lastValue: {
                    increment: 1
                }
            },
            create: {
                id: year,
                year,
                lastValue: 1
            }
        });
        return `KWMOC-${year}-${String(seq.lastValue).padStart(6, '0')}`;
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