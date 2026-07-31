import { Logger, Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/adapters/handlebars.adapter';
import { join } from 'path';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EmailService } from './notifications.service';
import { TicketNotificationsListener } from './ticket-notifications.listener';
import { NotificationsController } from './notifications.controller';
import { PrismaModule } from '../prisma/prisma.module';

/**
 * NotificationsModule — owns email delivery.
 *
 * Configures @nestjs-modules/mailer with SMTP transport from env (Mailtrap for
 * dev, real SMTP for prod) and the Handlebars template adapter pointing at
 * src/notifications/templates.
 */
@Module({
  imports: [
    PrismaModule,
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        transport: {
          host: config.get<string>('MAIL_HOST'),
          port: config.get<number>('MAIL_PORT'),
          auth: {
            user: config.get<string>('MAIL_USER'),
            pass: config.get<string>('MAIL_PASS'),
          },
        },
        defaults: {
          from: config.get<string>('MAIL_FROM'),
        },
        template: {
          // In dev (nest start --watch) __dirname is dist/notifications; in prod
          // it's dist/notifications too. Assets config in nest-cli.json copies
          // .hbs files alongside. For dev robustness we fall back to src/.
          dir: join(process.cwd(), 'src', 'notifications', 'templates'),
          adapter: new HandlebarsAdapter(),
          options: {
            context: {
              appName: 'KwaraMOc Complaints',
            },
          },
        },
      }),
    }),
  ],
  providers: [EmailService, TicketNotificationsListener, NotificationsController, Logger],
  controllers: [NotificationsController],
  exports: [EmailService],
})
export class NotificationsModule {}
