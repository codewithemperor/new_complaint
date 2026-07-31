"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "AppModule", {
    enumerable: true,
    get: function() {
        return AppModule;
    }
});
const _common = require("@nestjs/common");
const _config = require("@nestjs/config");
const _eventemitter = require("@nestjs/event-emitter");
const _schedule = require("@nestjs/schedule");
const _core = require("@nestjs/core");
const _config1 = require("./config/config");
const _prismamodule = require("./prisma/prisma.module");
const _storagemodule = require("./storage/storage.module");
const _healthmodule = require("./health/health.module");
const _authmodule = require("./auth/auth.module");
const _usersmodule = require("./users/users.module");
const _departmentsmodule = require("./departments/departments.module");
const _notificationsmodule = require("./notifications/notifications.module");
const _ticketsmodule = require("./tickets/tickets.module");
const _routingmodule = require("./routing/routing.module");
const _slamodule = require("./sla/sla.module");
const _approvalsmodule = require("./approvals/approvals.module");
const _auditmodule = require("./audit/audit.module");
const _remindersmodule = require("./reminders/reminders.module");
const _jwtauthguard = require("./common/guards/jwt-auth.guard");
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
let AppModule = class AppModule {
};
AppModule = _ts_decorate([
    (0, _common.Module)({
        imports: [
            _config.ConfigModule.forRoot({
                isGlobal: true,
                validationSchema: _config1.configValidationSchema
            }),
            _eventemitter.EventEmitterModule.forRoot(),
            _schedule.ScheduleModule.forRoot(),
            _prismamodule.PrismaModule,
            _storagemodule.StorageModule,
            _healthmodule.HealthModule,
            _authmodule.AuthModule,
            _usersmodule.UsersModule,
            _departmentsmodule.DepartmentsModule,
            _notificationsmodule.NotificationsModule,
            _ticketsmodule.TicketsModule,
            _routingmodule.RoutingModule,
            _slamodule.SlaModule,
            _approvalsmodule.ApprovalsModule,
            _auditmodule.AuditModule,
            _remindersmodule.RemindersModule
        ],
        // JwtAuthGuard is the global default; routes opt out with @Public().
        // RolesGuard is applied per-route via @UseGuards(RolesGuard) + @Roles(...).
        providers: [
            {
                provide: _core.APP_GUARD,
                useClass: _jwtauthguard.JwtAuthGuard
            }
        ]
    })
], AppModule);

//# sourceMappingURL=app.module.js.map