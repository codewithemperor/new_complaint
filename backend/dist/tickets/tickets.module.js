"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "TicketsModule", {
    enumerable: true,
    get: function() {
        return TicketsModule;
    }
});
const _common = require("@nestjs/common");
const _jwt = require("@nestjs/jwt");
const _config = require("@nestjs/config");
const _ticketscontroller = require("./tickets.controller");
const _ticketsservice = require("./tickets.service");
const _ticketidgenerator = require("./ticket-id-generator");
const _ticketstatemachine = require("./ticket-state-machine");
const _trackingtokenservice = require("./tracking-token.service");
const _trackingtokenguard = require("../common/guards/tracking-token.guard");
const _ticketsschedulerservice = require("./tickets-scheduler.service");
const _storagemodule = require("../storage/storage.module");
const _notificationsmodule = require("../notifications/notifications.module");
const _routingmodule = require("../routing/routing.module");
const _slamodule = require("../sla/sla.module");
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
let TicketsModule = class TicketsModule {
};
TicketsModule = _ts_decorate([
    (0, _common.Module)({
        imports: [
            _storagemodule.StorageModule,
            _notificationsmodule.NotificationsModule,
            _routingmodule.RoutingModule,
            _slamodule.SlaModule,
            _jwt.JwtModule.registerAsync({
                imports: [
                    _config.ConfigModule
                ],
                inject: [
                    _config.ConfigService
                ],
                useFactory: (config)=>({
                        secret: config.get('APP_TOKEN_SECRET')
                    })
            })
        ],
        controllers: [
            _ticketscontroller.TicketsController
        ],
        providers: [
            _ticketsservice.TicketsService,
            _ticketidgenerator.TicketIdGenerator,
            _ticketstatemachine.TicketStateMachine,
            _trackingtokenservice.TrackingTokenService,
            _trackingtokenguard.TrackingTokenGuard,
            _ticketsschedulerservice.TicketsScheduler
        ],
        exports: [
            _ticketsservice.TicketsService,
            _ticketstatemachine.TicketStateMachine,
            _trackingtokenservice.TrackingTokenService
        ]
    })
], TicketsModule);

//# sourceMappingURL=tickets.module.js.map