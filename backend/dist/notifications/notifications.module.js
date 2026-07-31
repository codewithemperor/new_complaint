"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "NotificationsModule", {
    enumerable: true,
    get: function() {
        return NotificationsModule;
    }
});
const _common = require("@nestjs/common");
const _mailer = require("@nestjs-modules/mailer");
const _handlebarsadapter = require("@nestjs-modules/mailer/adapters/handlebars.adapter");
const _path = require("path");
const _config = require("@nestjs/config");
const _notificationsservice = require("./notifications.service");
const _ticketnotificationslistener = require("./ticket-notifications.listener");
const _notificationscontroller = require("./notifications.controller");
const _prismamodule = require("../prisma/prisma.module");
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
let NotificationsModule = class NotificationsModule {
};
NotificationsModule = _ts_decorate([
    (0, _common.Module)({
        imports: [
            _prismamodule.PrismaModule,
            _mailer.MailerModule.forRootAsync({
                imports: [
                    _config.ConfigModule
                ],
                inject: [
                    _config.ConfigService
                ],
                useFactory: (config)=>({
                        transport: {
                            host: config.get('MAIL_HOST'),
                            port: config.get('MAIL_PORT'),
                            auth: {
                                user: config.get('MAIL_USER'),
                                pass: config.get('MAIL_PASS')
                            }
                        },
                        defaults: {
                            from: config.get('MAIL_FROM')
                        },
                        template: {
                            // In dev (nest start --watch) __dirname is dist/notifications; in prod
                            // it's dist/notifications too. Assets config in nest-cli.json copies
                            // .hbs files alongside. For dev robustness we fall back to src/.
                            dir: (0, _path.join)(process.cwd(), 'src', 'notifications', 'templates'),
                            adapter: new _handlebarsadapter.HandlebarsAdapter(),
                            options: {
                                context: {
                                    appName: 'KwaraMOc Complaints'
                                }
                            }
                        }
                    })
            })
        ],
        providers: [
            _notificationsservice.EmailService,
            _ticketnotificationslistener.TicketNotificationsListener,
            _notificationscontroller.NotificationsController,
            _common.Logger
        ],
        controllers: [
            _notificationscontroller.NotificationsController
        ],
        exports: [
            _notificationsservice.EmailService
        ]
    })
], NotificationsModule);

//# sourceMappingURL=notifications.module.js.map