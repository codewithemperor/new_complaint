"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "EmailService", {
    enumerable: true,
    get: function() {
        return EmailService;
    }
});
const _common = require("@nestjs/common");
const _mailer = require("@nestjs-modules/mailer");
const _prismaservice = require("../prisma/prisma.service");
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
let EmailService = class EmailService {
    constructor(mailerService, prisma){
        this.mailerService = mailerService;
        this.prisma = prisma;
        this.logger = new _common.Logger(EmailService.name);
    }
    async send(input) {
        const { to, subject, template, context, ticketId, eventId } = input;
        try {
            // Use the mailer's template rendering by passing template + context.
            // sendMail returns { response, messageId } on success.
            const info = await this.mailerService.sendMail({
                to,
                subject,
                template: `${template}`,
                context: {
                    ...context,
                    subject
                }
            });
            // Re-render to capture the HTML body for the audit log.
            const html = JSON.stringify(info);
            await this.prisma.notificationLog.create({
                data: {
                    ticketId: ticketId ?? null,
                    eventId,
                    recipient: to,
                    subject,
                    body: html,
                    status: 'SENT',
                    sentAt: new Date()
                }
            });
            this.logger.log(`Sent ${eventId} to ${to}`);
        } catch (err) {
            const error = err;
            this.logger.error(`Failed to send ${eventId} to ${to}: ${error.message}`);
            await this.prisma.notificationLog.create({
                data: {
                    ticketId: ticketId ?? null,
                    eventId,
                    recipient: to,
                    subject,
                    body: JSON.stringify(context),
                    status: 'FAILED',
                    error: error.message
                }
            });
        }
    }
};
EmailService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _mailer.MailerService === "undefined" ? Object : _mailer.MailerService,
        typeof _prismaservice.PrismaService === "undefined" ? Object : _prismaservice.PrismaService
    ])
], EmailService);

//# sourceMappingURL=notifications.service.js.map