"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "CreateUserDto", {
    enumerable: true,
    get: function() {
        return CreateUserDto;
    }
});
const _classvalidator = require("class-validator");
const _swagger = require("@nestjs/swagger");
const _role = require("../../common/types/role");
const _permission = require("../../common/types/permission");
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
let CreateUserDto = class CreateUserDto {
};
_ts_decorate([
    (0, _swagger.ApiProperty)(),
    (0, _classvalidator.IsEmail)(),
    _ts_metadata("design:type", String)
], CreateUserDto.prototype, "email", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)(),
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.MaxLength)(120),
    _ts_metadata("design:type", String)
], CreateUserDto.prototype, "fullName", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        enum: _role.Role,
        enumName: 'Role'
    }),
    (0, _classvalidator.IsEnum)(_role.Role),
    _ts_metadata("design:type", typeof _role.Role === "undefined" ? Object : _role.Role)
], CreateUserDto.prototype, "role", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        minLength: 8
    }),
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.MinLength)(8),
    (0, _classvalidator.MaxLength)(72),
    _ts_metadata("design:type", String)
], CreateUserDto.prototype, "password", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)(),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.MaxLength)(120),
    _ts_metadata("design:type", String)
], CreateUserDto.prototype, "designation", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)(),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.MaxLength)(30),
    _ts_metadata("design:type", String)
], CreateUserDto.prototype, "phone", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)(),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsUUID)(),
    _ts_metadata("design:type", String)
], CreateUserDto.prototype, "departmentId", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        enum: _permission.Permission,
        enumName: 'Permission',
        type: [
            String
        ],
        description: 'Module permissions for ADMIN users (ignored for other roles).'
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsEnum)(_permission.Permission, {
        each: true
    }),
    (0, _classvalidator.ArrayUnique)(),
    _ts_metadata("design:type", Array)
], CreateUserDto.prototype, "permissions", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        description: 'Grant Super Admin bypass (only meaningful for ADMIN role).'
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsBoolean)(),
    _ts_metadata("design:type", Boolean)
], CreateUserDto.prototype, "isSuperAdmin", void 0);

//# sourceMappingURL=create-user.dto.js.map