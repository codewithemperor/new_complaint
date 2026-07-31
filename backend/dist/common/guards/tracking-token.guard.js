"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "TrackingTokenGuard", {
    enumerable: true,
    get: function() {
        return TrackingTokenGuard;
    }
});
const _common = require("@nestjs/common");
const _trackingtokenservice = require("../../tickets/tracking-token.service");
const _prismaservice = require("../../prisma/prisma.service");
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
let TrackingTokenGuard = class TrackingTokenGuard {
    constructor(trackingTokenService, prisma){
        this.trackingTokenService = trackingTokenService;
        this.prisma = prisma;
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const token = request.query.token;
        const passcode = request.query.passcode;
        // Path 1: passcode-based auth (preferred).
        if (passcode) {
            const ticketCode = request.params.code;
            if (!ticketCode) {
                throw new _common.UnauthorizedException('Ticket code is required');
            }
            const ticket = await this.prisma.ticket.findUnique({
                where: {
                    ticketCode
                },
                select: {
                    id: true,
                    citizenId: true,
                    trackingPasscode: true
                }
            });
            if (!ticket || !ticket.trackingPasscode || ticket.trackingPasscode !== passcode) {
                throw new _common.UnauthorizedException('Invalid ticket code or passcode');
            }
            request.tracking = {
                ticketId: ticket.id,
                citizenId: ticket.citizenId
            };
            return true;
        }
        // Path 2: JWT token (legacy backward-compat).
        if (token) {
            const payload = this.trackingTokenService.verify(token);
            if (!payload) {
                throw new _common.UnauthorizedException('Invalid or expired tracking token');
            }
            request.tracking = payload;
            return true;
        }
        throw new _common.UnauthorizedException('A tracking passcode or token is required to view this complaint');
    }
};
TrackingTokenGuard = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _trackingtokenservice.TrackingTokenService === "undefined" ? Object : _trackingtokenservice.TrackingTokenService,
        typeof _prismaservice.PrismaService === "undefined" ? Object : _prismaservice.PrismaService
    ])
], TrackingTokenGuard);

//# sourceMappingURL=tracking-token.guard.js.map