"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "TrackingTokenService", {
    enumerable: true,
    get: function() {
        return TrackingTokenService;
    }
});
const _common = require("@nestjs/common");
const _jwt = require("@nestjs/jwt");
const _config = require("@nestjs/config");
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
let TrackingTokenService = class TrackingTokenService {
    constructor(jwtService, configService){
        this.jwtService = jwtService;
        this.configService = configService;
    }
    issue(payload) {
        return this.jwtService.sign(payload, {
            secret: this.configService.get('APP_TOKEN_SECRET'),
            expiresIn: '90d'
        });
    }
    verify(token) {
        try {
            return this.jwtService.verify(token, {
                secret: this.configService.get('APP_TOKEN_SECRET')
            });
        } catch  {
            return null;
        }
    }
};
TrackingTokenService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _jwt.JwtService === "undefined" ? Object : _jwt.JwtService,
        typeof _config.ConfigService === "undefined" ? Object : _config.ConfigService
    ])
], TrackingTokenService);

//# sourceMappingURL=tracking-token.service.js.map