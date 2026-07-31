"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "AuthController", {
    enumerable: true,
    get: function() {
        return AuthController;
    }
});
const _common = require("@nestjs/common");
const _config = require("@nestjs/config");
const _swagger = require("@nestjs/swagger");
const _authservice = require("./auth.service");
const _logindto = require("./dtos/login.dto");
const _authresponsedto = require("./dtos/auth-response.dto");
const _userresponsedto = require("../users/dtos/user-response.dto");
const _ispublicdecorator = require("../common/decorators/is-public.decorator");
const _jwtauthguard = require("../common/guards/jwt-auth.guard");
const _currentuserdecorator = require("../common/decorators/current-user.decorator");
const _ttl = require("../common/utils/ttl");
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
function _ts_param(paramIndex, decorator) {
    return function(target, key) {
        decorator(target, key, paramIndex);
    };
}
const COOKIE_NAME = 'kwmoc_token';
let AuthController = class AuthController {
    constructor(authService, configService){
        this.authService = authService;
        this.configService = configService;
    }
    async login(dto, res) {
        const result = await this.authService.login(dto);
        this.setAuthCookie(res, result.accessToken);
        return result;
    }
    async logout(res) {
        res.clearCookie(COOKIE_NAME, {
            path: '/',
            domain: this.configService.get('COOKIE_DOMAIN') || undefined
        });
    }
    async me(user) {
        return user;
    }
    setAuthCookie(res, token) {
        const ttlMs = (0, _ttl.ttlToMs)(this.configService.get('JWT_ACCESS_TTL') ?? '8h');
        res.cookie(COOKIE_NAME, token, {
            httpOnly: true,
            secure: this.configService.get('COOKIE_SECURE', false),
            sameSite: 'lax',
            maxAge: ttlMs,
            path: '/',
            domain: this.configService.get('COOKIE_DOMAIN') || undefined
        });
    }
};
_ts_decorate([
    (0, _ispublicdecorator.Public)(),
    (0, _common.Post)('login'),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    (0, _swagger.ApiOperation)({
        summary: 'Staff login — sets httpOnly cookie + returns token'
    }),
    (0, _swagger.ApiBody)({
        type: _logindto.LoginDto
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        type: _authresponsedto.AuthResponseDto
    }),
    (0, _swagger.ApiResponse)({
        status: 401,
        description: 'Invalid credentials'
    }),
    _ts_param(0, (0, _common.Body)()),
    _ts_param(1, (0, _common.Res)({
        passthrough: true
    })),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _logindto.LoginDto === "undefined" ? Object : _logindto.LoginDto,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
_ts_decorate([
    (0, _ispublicdecorator.Public)(),
    (0, _common.Post)('logout'),
    (0, _common.HttpCode)(_common.HttpStatus.NO_CONTENT),
    (0, _swagger.ApiOperation)({
        summary: 'Clear the auth cookie'
    }),
    _ts_param(0, (0, _common.Res)({
        passthrough: true
    })),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
_ts_decorate([
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard),
    (0, _common.Get)('me'),
    (0, _swagger.ApiOperation)({
        summary: 'Current authenticated user'
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        type: _userresponsedto.UserResponseDto
    }),
    (0, _swagger.ApiResponse)({
        status: 401,
        description: 'Unauthenticated'
    }),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof AuthenticatedUser === "undefined" ? Object : AuthenticatedUser
    ]),
    _ts_metadata("design:returntype", Promise)
], AuthController.prototype, "me", null);
AuthController = _ts_decorate([
    (0, _swagger.ApiTags)('auth'),
    (0, _common.Controller)('auth'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _authservice.AuthService === "undefined" ? Object : _authservice.AuthService,
        typeof _config.ConfigService === "undefined" ? Object : _config.ConfigService
    ])
], AuthController);

//# sourceMappingURL=auth.controller.js.map