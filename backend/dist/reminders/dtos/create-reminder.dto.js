"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "CreateReminderDto", {
    enumerable: true,
    get: function() {
        return CreateReminderDto;
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
let CreateReminderDto = class CreateReminderDto {
};
_ts_decorate([
    (0, _swagger.ApiProperty)({
        description: 'Ticket ID to set a reminder for'
    }),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], CreateReminderDto.prototype, "ticketId", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        description: 'Note or message for the reminder'
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.MinLength)(1),
    _ts_metadata("design:type", String)
], CreateReminderDto.prototype, "note", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        description: 'When to remind (ISO 8601 date string)',
        example: '2026-03-15T09:00:00.000Z'
    }),
    (0, _classvalidator.IsDateString)(),
    _ts_metadata("design:type", String)
], CreateReminderDto.prototype, "remindAt", void 0);

//# sourceMappingURL=create-reminder.dto.js.map