"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "TicketsScheduler", {
    enumerable: true,
    get: function() {
        return TicketsScheduler;
    }
});
const _common = require("@nestjs/common");
const _schedule = require("@nestjs/schedule");
const _config = require("@nestjs/config");
const _prismaservice = require("../prisma/prisma.service");
const _ticketsservice = require("./tickets.service");
const _auditservice = require("../audit/audit.service");
const _auditeventtype = require("../audit/audit-event-type");
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
let TicketsScheduler = class TicketsScheduler {
    constructor(ticketsService, prisma, config, audit, eventEmitter){
        this.ticketsService = ticketsService;
        this.prisma = prisma;
        this.config = config;
        this.audit = audit;
        this.eventEmitter = eventEmitter;
        this.logger = new _common.Logger(TicketsScheduler.name);
    }
    /** Daily 02:00 — auto-close resolved tickets past the feedback grace. */ async autoCloseOverdue() {
        this.logger.log('Running daily auto-close sweep…');
        try {
            const closed = await this.ticketsService.autoCloseOverdue();
            this.logger.log(`Auto-close complete: ${closed} ticket(s) closed.`);
        } catch (err) {
            this.logger.error(`Auto-close failed: ${err.message}`);
        }
    }
    /** Daily 03:00 — archive closed tickets past the retention window. */ async archiveRetained() {
        this.logger.log('Running daily archival sweep…');
        try {
            const days = this.config.get('ARCHIVE_RETENTION_DAYS') ?? 90;
            const cutoff = new Date(Date.now() - days * 24 * 3_600_000);
            const retained = await this.prisma.ticket.findMany({
                where: {
                    status: 'CLOSED',
                    closedAt: {
                        lt: cutoff
                    },
                    archived: false
                },
                select: {
                    id: true
                }
            });
            for (const t of retained){
                await this.prisma.ticket.update({
                    where: {
                        id: t.id
                    },
                    data: {
                        archived: true,
                        archivedAt: new Date()
                    }
                });
                await this.audit.log({
                    ticketId: t.id,
                    eventType: _auditeventtype.AuditEventType.TICKET_ARCHIVED,
                    meta: {
                        reason: 'retention',
                        days
                    }
                });
            }
            this.logger.log(`Archival complete: ${retained.length} ticket(s) archived.`);
        } catch (err) {
            this.logger.error(`Archival failed: ${err.message}`);
        }
    }
};
_ts_decorate([
    (0, _schedule.Cron)(_schedule.CronExpression.EVERY_DAY_AT_2AM),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", []),
    _ts_metadata("design:returntype", Promise)
], TicketsScheduler.prototype, "autoCloseOverdue", null);
_ts_decorate([
    (0, _schedule.Cron)('0 3 * * *'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", []),
    _ts_metadata("design:returntype", Promise)
], TicketsScheduler.prototype, "archiveRetained", null);
TicketsScheduler = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _ticketsservice.TicketsService === "undefined" ? Object : _ticketsservice.TicketsService,
        typeof _prismaservice.PrismaService === "undefined" ? Object : _prismaservice.PrismaService,
        typeof _config.ConfigService === "undefined" ? Object : _config.ConfigService,
        typeof _auditservice.AuditService === "undefined" ? Object : _auditservice.AuditService,
        typeof _eventemitter.EventEmitter2 === "undefined" ? Object : _eventemitter.EventEmitter2
    ])
], TicketsScheduler);

//# sourceMappingURL=tickets-scheduler.service.js.map