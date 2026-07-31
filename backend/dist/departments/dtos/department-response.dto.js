"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "DepartmentResponseDto", {
    enumerable: true,
    get: function() {
        return DepartmentResponseDto;
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
let DepartmentResponseDto = class DepartmentResponseDto {
};
_ts_decorate([
    (0, _swagger.ApiProperty)({
        type: ()=>String
    }),
    _ts_metadata("design:type", String)
], DepartmentResponseDto.prototype, "id", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        type: ()=>String
    }),
    _ts_metadata("design:type", String)
], DepartmentResponseDto.prototype, "name", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        type: ()=>String
    }),
    _ts_metadata("design:type", String)
], DepartmentResponseDto.prototype, "code", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        type: ()=>String,
        nullable: true,
        required: false
    }),
    _ts_metadata("design:type", Object)
], DepartmentResponseDto.prototype, "description", void 0);

//# sourceMappingURL=department-response.dto.js.map