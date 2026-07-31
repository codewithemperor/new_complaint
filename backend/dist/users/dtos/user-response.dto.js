"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "UserResponseDto", {
    enumerable: true,
    get: function() {
        return UserResponseDto;
    }
});
const _swagger = require("@nestjs/swagger");
const _role = require("../../common/types/role");
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
let UserResponseDto = class UserResponseDto {
};
_ts_decorate([
    (0, _swagger.ApiProperty)({
        type: ()=>String
    }),
    _ts_metadata("design:type", String)
], UserResponseDto.prototype, "id", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        type: ()=>String
    }),
    _ts_metadata("design:type", String)
], UserResponseDto.prototype, "email", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        type: ()=>String
    }),
    _ts_metadata("design:type", String)
], UserResponseDto.prototype, "fullName", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        enum: _role.Role,
        enumName: 'Role'
    }),
    _ts_metadata("design:type", typeof _role.Role === "undefined" ? Object : _role.Role)
], UserResponseDto.prototype, "role", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        type: ()=>String,
        nullable: true
    }),
    _ts_metadata("design:type", Object)
], UserResponseDto.prototype, "designation", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        type: ()=>String,
        nullable: true
    }),
    _ts_metadata("design:type", Object)
], UserResponseDto.prototype, "phone", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        type: ()=>String,
        nullable: true
    }),
    _ts_metadata("design:type", Object)
], UserResponseDto.prototype, "departmentId", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        type: ()=>Boolean
    }),
    _ts_metadata("design:type", Boolean)
], UserResponseDto.prototype, "isActive", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        type: ()=>String,
        format: 'date-time',
        nullable: true
    }),
    _ts_metadata("design:type", Object)
], UserResponseDto.prototype, "lastLoginAt", void 0);

//# sourceMappingURL=user-response.dto.js.map