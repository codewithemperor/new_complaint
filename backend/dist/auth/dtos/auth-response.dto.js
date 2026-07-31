"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "AuthResponseDto", {
    enumerable: true,
    get: function() {
        return AuthResponseDto;
    }
});
const _swagger = require("@nestjs/swagger");
const _userresponsedto = require("../../users/dtos/user-response.dto");
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
let AuthResponseDto = class AuthResponseDto {
};
_ts_decorate([
    (0, _swagger.ApiProperty)({
        type: ()=>_userresponsedto.UserResponseDto
    }),
    _ts_metadata("design:type", typeof _userresponsedto.UserResponseDto === "undefined" ? Object : _userresponsedto.UserResponseDto)
], AuthResponseDto.prototype, "user", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        type: ()=>String
    }),
    _ts_metadata("design:type", String)
], AuthResponseDto.prototype, "accessToken", void 0);

//# sourceMappingURL=auth-response.dto.js.map