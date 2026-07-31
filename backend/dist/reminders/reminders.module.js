"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "RemindersModule", {
    enumerable: true,
    get: function() {
        return RemindersModule;
    }
});
const _common = require("@nestjs/common");
const _prismamodule = require("../prisma/prisma.module");
const _remindersservice = require("./reminders.service");
const _reminderscontroller = require("./reminders.controller");
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
let RemindersModule = class RemindersModule {
};
RemindersModule = _ts_decorate([
    (0, _common.Module)({
        imports: [
            _prismamodule.PrismaModule
        ],
        controllers: [
            _reminderscontroller.RemindersController
        ],
        providers: [
            _remindersservice.RemindersService
        ],
        exports: [
            _remindersservice.RemindersService
        ]
    })
], RemindersModule);

//# sourceMappingURL=reminders.module.js.map