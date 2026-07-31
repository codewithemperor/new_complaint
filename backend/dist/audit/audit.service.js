"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "AuditService", {
    enumerable: true,
    get: function() {
        return AuditService;
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
let AuditService = class AuditService {
    constructor(prisma){
        this.prisma = prisma;
        this.logger = new _common.Logger(AuditService.name);
    }
    async log(input) {
        try {
            await this.prisma.auditEvent.create({
                data: {
                    ticketId: input.ticketId ?? null,
                    actorId: input.actorId ?? null,
                    eventType: input.eventType,
                    meta: input.meta ? JSON.stringify(input.meta) : null,
                    ip: input.req?.ip ?? null,
                    userAgent: input.req?.headers?.['user-agent']?.toString() ?? null
                }
            });
        } catch (err) {
            // Audit must never break the calling flow.
            this.logger.error(`Audit log failed for ${input.eventType}: ${err.message}`);
        }
    }
    /** Filtered, paginated audit list for the auditor UI. */ async list(query) {
        const { ticketId, ticketCode, actorId, eventType, from, to, page = 1, pageSize = 50 } = query;
        const where = {};
        if (ticketId) where.ticketId = ticketId;
        if (actorId) where.actorId = actorId;
        if (eventType) where.eventType = eventType;
        if (from || to) {
            where.createdAt = {
                ...from ? {
                    gte: new Date(from)
                } : {},
                ...to ? {
                    lte: new Date(to)
                } : {}
            };
        }
        // ticketCode needs a join — resolve to ticketId first.
        if (ticketCode && !ticketId) {
            const t = await this.prisma.ticket.findUnique({
                where: {
                    ticketCode
                },
                select: {
                    id: true
                }
            });
            where.ticketId = t?.id ?? '00000000-0000-0000-0000-000000000000';
        }
        const [items, total] = await Promise.all([
            this.prisma.auditEvent.findMany({
                where,
                orderBy: {
                    createdAt: 'desc'
                },
                skip: (page - 1) * pageSize,
                take: pageSize,
                include: {
                    actor: {
                        select: {
                            fullName: true,
                            role: true
                        }
                    },
                    ticket: {
                        select: {
                            ticketCode: true,
                            subject: true
                        }
                    }
                }
            }),
            this.prisma.auditEvent.count({
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
    /** Export a ticket's (or full filtered set's) audit trail as CSV. */ async exportCsv(query) {
        const rows = await this.list({
            ...query,
            page: 1,
            pageSize: 10000
        });
        const header = [
            'timestamp',
            'event_type',
            'ticket_code',
            'actor',
            'role',
            'ip',
            'meta'
        ].join(',');
        const lines = rows.items.map((e)=>[
                new Date(e.createdAt).toISOString(),
                e.eventType,
                e.ticket?.ticketCode ?? '',
                e.actor?.fullName ?? '',
                e.actor?.role ?? '',
                e.ip ?? '',
                e.meta ? String(e.meta).replace(/"/g, '""') : ''
            ].map((v)=>`"${String(v).replace(/"/g, '""')}"`).join(','));
        return [
            header,
            ...lines
        ].join('\n');
    }
};
AuditService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _prismaservice.PrismaService === "undefined" ? Object : _prismaservice.PrismaService
    ])
], AuditService);

//# sourceMappingURL=audit.service.js.map