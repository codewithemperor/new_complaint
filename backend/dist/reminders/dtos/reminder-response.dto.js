"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ReminderResponseDto", {
    enumerable: true,
    get: function() {
        return ReminderResponseDto;
    }
});
const _swagger = require("@nestjs/swagger");
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
let ReminderResponseDto = class ReminderResponseDto {
};
_ts_decorate([
    (0, _swagger.ApiProperty)(),
    _ts_metadata("design:type", String)
], ReminderResponseDto.prototype, "id", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        description: 'Ticket ID this reminder is for'
    }),
    _ts_metadata("design:type", String)
], ReminderResponseDto.prototype, "ticketId", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        description: 'User ID who owns this reminder'
    }),
    _ts_metadata("design:type", String)
], ReminderResponseDto.prototype, "userId", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        description: 'Note attached to the reminder'
    }),
    _ts_metadata("design:type", Object)
], ReminderResponseDto.prototype, "note", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        description: 'When the reminder triggers',
        format: 'date-time'
    }),
    _ts_metadata("design:type", String)
], ReminderResponseDto.prototype, "remindAt", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        description: 'Whether the reminder is still active'
    }),
    _ts_metadata("design:type", Boolean)
], ReminderResponseDto.prototype, "isActive", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        description: 'When the reminder was created',
        format: 'date-time'
    }),
    _ts_metadata("design:type", String)
], ReminderResponseDto.prototype, "createdAt", void 0);

//# sourceMappingURL=reminder-response.dto.js.map