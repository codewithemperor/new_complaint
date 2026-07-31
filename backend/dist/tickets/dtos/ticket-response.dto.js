"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
    });
}
_export(exports, {
    get TicketResponseDto () {
        return TicketResponseDto;
    },
    get TrackTicketDto () {
        return TrackTicketDto;
    }
});
const _swagger = require("@nestjs/swagger");
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
let TicketResponseDto = class TicketResponseDto {
};
_ts_decorate([
    (0, _swagger.ApiProperty)({
        type: ()=>String
    }),
    _ts_metadata("design:type", String)
], TicketResponseDto.prototype, "id", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        example: 'KWMOC-2026-000001'
    }),
    _ts_metadata("design:type", String)
], TicketResponseDto.prototype, "ticketCode", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        enum: _ticketstatus.TicketStatus,
        enumName: 'TicketStatus'
    }),
    _ts_metadata("design:type", typeof _ticketstatus.TicketStatus === "undefined" ? Object : _ticketstatus.TicketStatus)
], TicketResponseDto.prototype, "status", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        type: ()=>String
    }),
    _ts_metadata("design:type", Object)
], TicketResponseDto.prototype, "category", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        enum: _ticketstatus.Priority,
        enumName: 'Priority'
    }),
    _ts_metadata("design:type", Object)
], TicketResponseDto.prototype, "priority", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        enum: _ticketstatus.Sensitivity,
        enumName: 'Sensitivity'
    }),
    _ts_metadata("design:type", typeof _ticketstatus.Sensitivity === "undefined" ? Object : _ticketstatus.Sensitivity)
], TicketResponseDto.prototype, "sensitivity", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)(),
    _ts_metadata("design:type", String)
], TicketResponseDto.prototype, "subject", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)(),
    _ts_metadata("design:type", String)
], TicketResponseDto.prototype, "description", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        enum: _ticketstatus.Channel,
        enumName: 'Channel'
    }),
    _ts_metadata("design:type", typeof _ticketstatus.Channel === "undefined" ? Object : _ticketstatus.Channel)
], TicketResponseDto.prototype, "channel", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        type: ()=>String
    }),
    _ts_metadata("design:type", Object)
], TicketResponseDto.prototype, "lga", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        type: ()=>String
    }),
    _ts_metadata("design:type", Object)
], TicketResponseDto.prototype, "departmentId", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        type: ()=>String,
        format: 'date-time'
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], TicketResponseDto.prototype, "createdAt", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        type: ()=>String,
        format: 'date-time'
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], TicketResponseDto.prototype, "updatedAt", void 0);
let TrackTicketDto = class TrackTicketDto {
};
_ts_decorate([
    (0, _swagger.ApiProperty)(),
    _ts_metadata("design:type", String)
], TrackTicketDto.prototype, "ticketCode", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        enum: _ticketstatus.TicketStatus,
        enumName: 'TicketStatus'
    }),
    _ts_metadata("design:type", typeof _ticketstatus.TicketStatus === "undefined" ? Object : _ticketstatus.TicketStatus)
], TrackTicketDto.prototype, "status", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)(),
    _ts_metadata("design:type", String)
], TrackTicketDto.prototype, "subject", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)(),
    _ts_metadata("design:type", String)
], TrackTicketDto.prototype, "description", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        type: ()=>String
    }),
    _ts_metadata("design:type", Object)
], TrackTicketDto.prototype, "category", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        type: ()=>String,
        format: 'date-time'
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], TrackTicketDto.prototype, "createdAt", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        type: ()=>String,
        format: 'date-time'
    }),
    _ts_metadata("design:type", Object)
], TrackTicketDto.prototype, "resolvedAt", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        type: ()=>String
    }),
    _ts_metadata("design:type", Object)
], TrackTicketDto.prototype, "resolutionText", void 0);

//# sourceMappingURL=ticket-response.dto.js.map