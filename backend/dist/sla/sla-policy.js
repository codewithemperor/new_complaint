"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "SlaPolicy", {
    enumerable: true,
    get: function() {
        return SlaPolicy;
    }
});
const _common = require("@nestjs/common");
const _config = require("@nestjs/config");
const _prismaservice = require("../prisma/prisma.service");
const _ticketstatus = require("../common/types/ticket-status");
const _role = require("../common/types/role");
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
let SlaPolicy = class SlaPolicy {
    constructor(config, prisma){
        this.config = config;
        this.prisma = prisma;
        this.cache = null;
    }
    async onModuleInit() {
        await this.loadCache();
    }
    /** Reload the cache from the DB (called after an admin edits the matrix). */ async invalidate() {
        await this.loadCache();
    }
    async loadCache() {
        try {
            const rows = await this.prisma.slaConfig.findMany();
            const map = new Map();
            for (const r of rows){
                // SQLite: escalationChain is stored as JSON string, parse it
                const chain = typeof r.escalationChain === 'string' ? JSON.parse(r.escalationChain) : r.escalationChain;
                map.set(r.priority, {
                    firstResponseHours: r.firstResponseHours,
                    resolutionHours: r.resolutionHours,
                    warningThreshold: Number(r.warningThreshold),
                    escalationChain: chain
                });
            }
            this.cache = map;
        } catch  {
            // Table may not be seeded yet; env fallbacks apply.
            this.cache = null;
        }
    }
    /** First-response target in hours (SUBMITTED → IN_PROGRESS). */ firstResponseHours(priority) {
        const row = this.cache?.get(priority);
        if (row) return row.firstResponseHours;
        const key = `SLA_${priority}_FIRST_RESPONSE_HOURS`;
        return this.config.get(key) ?? this.defaultFirstResponse(priority);
    }
    /** Resolution target in hours (ASSIGNED → RESOLVED). */ resolutionHours(priority) {
        const row = this.cache?.get(priority);
        if (row) return row.resolutionHours;
        const key = `SLA_${priority}_RESOLUTION_HOURS`;
        return this.config.get(key) ?? this.defaultResolution(priority);
    }
    /** Fraction of the target at which a warning fires (default 0.8). */ warningThreshold() {
        const anyRow = this.cache?.values().next().value;
        if (anyRow) return anyRow.warningThreshold;
        return this.config.get('SLA_WARNING_THRESHOLD') ?? 0.8;
    }
    /**
   * The escalation chain (lowest → highest tier) for a priority. DB-stored if
   * available; otherwise the static default. Returned as Roles for advance().
   */ escalationChain(priority) {
        const row = this.cache?.get(priority);
        if (row?.escalationChain?.length) {
            return row.escalationChain;
        }
        switch(priority){
            case _ticketstatus.Priority.P1:
            case _ticketstatus.Priority.P2:
                return [
                    _role.Role.DIRECTOR,
                    _role.Role.PERMANENT_SECRETARY,
                    _role.Role.COMMISSIONER
                ];
            case _ticketstatus.Priority.P3:
                return [
                    _role.Role.DIRECTOR,
                    _role.Role.PERMANENT_SECRETARY
                ];
            case _ticketstatus.Priority.P4:
            default:
                return [
                    _role.Role.DIRECTOR
                ];
        }
    }
    defaultFirstResponse(priority) {
        switch(priority){
            case _ticketstatus.Priority.P1:
                return 1;
            case _ticketstatus.Priority.P2:
                return 4;
            case _ticketstatus.Priority.P3:
                return 24;
            case _ticketstatus.Priority.P4:
                return 48;
        }
    }
    defaultResolution(priority) {
        switch(priority){
            case _ticketstatus.Priority.P1:
                return 24;
            case _ticketstatus.Priority.P2:
                return 72;
            case _ticketstatus.Priority.P3:
                return 240;
            case _ticketstatus.Priority.P4:
                return 360;
        }
    }
};
SlaPolicy = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _config.ConfigService === "undefined" ? Object : _config.ConfigService,
        typeof _prismaservice.PrismaService === "undefined" ? Object : _prismaservice.PrismaService
    ])
], SlaPolicy);

//# sourceMappingURL=sla-policy.js.map