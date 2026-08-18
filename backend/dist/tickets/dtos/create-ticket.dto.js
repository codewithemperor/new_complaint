"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "CreateTicketDto", {
    enumerable: true,
    get: function() {
        return CreateTicketDto;
    }
});
const _swagger = require("@nestjs/swagger");
const _classvalidator = require("class-validator");
const _classtransformer = require("class-transformer");
const _ticketstatus = require("../../common/types/ticket-status");
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
let CreateTicketDto = class CreateTicketDto {
};
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        type: ()=>String
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], CreateTicketDto.prototype, "name", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        example: 'citizen@example.com'
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsEmail)(),
    _ts_metadata("design:type", String)
], CreateTicketDto.prototype, "email", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        type: ()=>String
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], CreateTicketDto.prototype, "phone", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        description: 'Local Government Area'
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], CreateTicketDto.prototype, "lga", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        default: false
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classtransformer.Transform)(({ value })=>value === true || value === 'true'),
    (0, _classvalidator.IsBoolean)(),
    _ts_metadata("design:type", Boolean)
], CreateTicketDto.prototype, "isAnonymous", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        example: 'Service quality'
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], CreateTicketDto.prototype, "category", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        enum: _ticketstatus.Priority,
        enumName: 'Priority'
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsEnum)(_ticketstatus.Priority),
    _ts_metadata("design:type", typeof _ticketstatus.Priority === "undefined" ? Object : _ticketstatus.Priority)
], CreateTicketDto.prototype, "priority", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        example: 'Pothole on Unity Road'
    }),
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.MinLength)(5),
    (0, _classvalidator.MaxLength)(200),
    _ts_metadata("design:type", String)
], CreateTicketDto.prototype, "subject", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        example: 'There is a large pothole near the market...'
    }),
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.MinLength)(10),
    (0, _classvalidator.MaxLength)(10000),
    _ts_metadata("design:type", String)
], CreateTicketDto.prototype, "description", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        enum: _ticketstatus.Channel,
        enumName: 'Channel',
        default: _ticketstatus.Channel.WEB
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsEnum)(_ticketstatus.Channel),
    _ts_metadata("design:type", typeof _ticketstatus.Channel === "undefined" ? Object : _ticketstatus.Channel)
], CreateTicketDto.prototype, "channel", void 0);

//# sourceMappingURL=create-ticket.dto.js.map