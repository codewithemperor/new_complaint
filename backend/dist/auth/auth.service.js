"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "AuthService", {
    enumerable: true,
    get: function() {
        return AuthService;
    }
});
const _common = require("@nestjs/common");
const _config = require("@nestjs/config");
const _jwt = require("@nestjs/jwt");
const _bcrypt = /*#__PURE__*/ _interop_require_wildcard(require("bcrypt"));
const _usersservice = require("../users/users.service");
const _ttl = require("../common/utils/ttl");
function _getRequireWildcardCache(nodeInterop) {
    if (typeof WeakMap !== "function") return null;
    var cacheBabelInterop = new WeakMap();
    var cacheNodeInterop = new WeakMap();
    return (_getRequireWildcardCache = function(nodeInterop) {
        return nodeInterop ? cacheNodeInterop : cacheBabelInterop;
    })(nodeInterop);
}
function _interop_require_wildcard(obj, nodeInterop) {
    if (!nodeInterop && obj && obj.__esModule) return obj;
    if (obj === null || typeof obj !== "object" && typeof obj !== "function") return {
        default: obj
    };
    var cache = _getRequireWildcardCache(nodeInterop);
    if (cache && cache.has(obj)) return cache.get(obj);
    var newObj = {
        __proto__: null
    };
    var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;
    for(var key in obj){
        if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) {
            var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;
            if (desc && (desc.get || desc.set)) Object.defineProperty(newObj, key, desc);
            else newObj[key] = obj[key];
        }
    }
    newObj.default = obj;
    if (cache) cache.set(obj, newObj);
    return newObj;
}
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
let AuthService = class AuthService {
    constructor(usersService, jwtService, configService){
        this.usersService = usersService;
        this.jwtService = jwtService;
        this.configService = configService;
    }
    /**
   * Validates credentials and returns the user-safe record on success.
   * Throws UnauthorizedException on any failure (no user vs. wrong password
   * share the same message to avoid user-enumeration).
   */ async validateCredentials(dto) {
        const user = await this.usersService.findByEmail(dto.email);
        if (!user || !user.isActive) {
            throw new _common.UnauthorizedException('Invalid credentials');
        }
        const ok = await _bcrypt.compare(dto.password, user.passwordHash);
        if (!ok) {
            throw new _common.UnauthorizedException('Invalid credentials');
        }
        return user;
    }
    /** Issues a signed JWT for the given user. */ issueAccessToken(user) {
        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role
        };
        const ttl = this.configService.get('JWT_ACCESS_TTL') ?? '8h';
        return this.jwtService.sign(payload, {
            expiresIn: (0, _ttl.ttlToSeconds)(ttl)
        });
    }
    /** Full login flow: validate, touch lastLoginAt, return user-safe record + token. */ async login(dto) {
        const user = await this.validateCredentials(dto);
        await this.usersService.touchLastLogin(user.id);
        const accessToken = this.issueAccessToken(user);
        const safe = await this.usersService.findPublicById(user.id);
        if (!safe) throw new _common.NotFoundException('User not found after login');
        // Cast Prisma Role → local Role (identical string enum values, nominally different types).
        return {
            user: safe,
            accessToken
        };
    }
};
AuthService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _usersservice.UsersService === "undefined" ? Object : _usersservice.UsersService,
        typeof _jwt.JwtService === "undefined" ? Object : _jwt.JwtService,
        typeof _config.ConfigService === "undefined" ? Object : _config.ConfigService
    ])
], AuthService);

//# sourceMappingURL=auth.service.js.map