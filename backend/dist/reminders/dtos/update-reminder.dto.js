"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "UpdateReminderDto", {
    enumerable: true,
    get: function() {
        return UpdateReminderDto;
    }
});
const _swagger = require("@nestjs/swagger");
const _classvalidator = require("class-validator");
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
let UpdateReminderDto = class UpdateReminderDto {
};
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        description: 'Updated note or message'
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.MinLength)(1),
    _ts_metadata("design:type", String)
], UpdateReminderDto.prototype, "note", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        description: 'Updated reminder datetime (ISO 8601)',
        example: '2026-03-20T10:00:00.000Z'
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsDateString)(),
    _ts_metadata("design:type", String)
], UpdateReminderDto.prototype, "remindAt", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        description: 'Whether the reminder is active'
    }),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", Boolean)
], UpdateReminderDto.prototype, "isActive", void 0);

//# sourceMappingURL=update-reminder.dto.js.map