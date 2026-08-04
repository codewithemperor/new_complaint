"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "TriageTicketDto", {
    enumerable: true,
    get: function() {
        return TriageTicketDto;
    }
});
const _classvalidator = require("class-validator");
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
let TriageTicketDto = class TriageTicketDto {
};
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], TriageTicketDto.prototype, "category", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsEnum)(_ticketstatus.Priority),
    _ts_metadata("design:type", typeof _ticketstatus.Priority === "undefined" ? Object : _ticketstatus.Priority)
], TriageTicketDto.prototype, "priority", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsUUID)(),
    _ts_metadata("design:type", String)
], TriageTicketDto.prototype, "departmentId", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsEnum)(_ticketstatus.Sensitivity),
    _ts_metadata("design:type", typeof _ticketstatus.Sensitivity === "undefined" ? Object : _ticketstatus.Sensitivity)
], TriageTicketDto.prototype, "sensitivity", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], TriageTicketDto.prototype, "triageNote", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsUUID)(),
    _ts_metadata("design:type", String)
], TriageTicketDto.prototype, "overrideOfficerId", void 0);

//# sourceMappingURL=triage-ticket.dto.js.map