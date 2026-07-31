"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "HealthController", {
    enumerable: true,
    get: function() {
        return HealthController;
    }
});
const _common = require("@nestjs/common");
const _swagger = require("@nestjs/swagger");
const _ispublicdecorator = require("../common/decorators/is-public.decorator");
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
let HealthController = class HealthController {
    constructor(prisma){
        this.prisma = prisma;
    }
    async check() {
        let db = 'ok';
        try {
            await this.prisma.$queryRaw`SELECT 1`;
        } catch (err) {
            db = err.message;
        }
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
            db
        };
    }
};
_ts_decorate([
    (0, _ispublicdecorator.Public)(),
    (0, _common.Get)(),
    (0, _swagger.ApiOperation)({
        summary: 'Liveness + DB reachability check'
    }),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", []),
    _ts_metadata("design:returntype", Promise)
], HealthController.prototype, "check", null);
HealthController = _ts_decorate([
    (0, _swagger.ApiTags)('health'),
    (0, _common.Controller)('health'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _prismaservice.PrismaService === "undefined" ? Object : _prismaservice.PrismaService
    ])
], HealthController);

//# sourceMappingURL=health.controller.js.map