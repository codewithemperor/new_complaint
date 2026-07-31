"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "DepartmentsModule", {
    enumerable: true,
    get: function() {
        return DepartmentsModule;
    }
});
const _common = require("@nestjs/common");
const _departmentscontroller = require("./departments.controller");
const _departmentsservice = require("./departments.service");
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
let DepartmentsModule = class DepartmentsModule {
};
DepartmentsModule = _ts_decorate([
    (0, _common.Module)({
        controllers: [
            _departmentscontroller.DepartmentsController
        ],
        providers: [
            _departmentsservice.DepartmentsService
        ],
        exports: [
            _departmentsservice.DepartmentsService
        ]
    })
], DepartmentsModule);

//# sourceMappingURL=departments.module.js.map