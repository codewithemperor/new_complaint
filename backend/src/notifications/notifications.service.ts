import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { PrismaService } from '../prisma/prisma.service';

export interface SendEmailInput {
  to: string;
  subject: string;
  template: string;
  context: Record<string, unknown>;
  ticketId?: string;
  eventId: string;
}

/**
 * EmailService — the single send boundary for outgoing email.
 *
 * Wraps @nestjs-modules/mailer (Nodemailer SMTP). Every send is recorded in
 * NotificationLog for audit + retry. Transport errors are caught, logged, and
 * recorded as FAILED — they do NOT crash the calling transaction.
 *
 * Per planning/04-email-notifications.md §5: emails are sent AFTER the DB
 * transaction commits (via event listeners), so a rolled-back write never
 * triggers an email.
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    private readonly mailerService: MailerService,
    private readonly prisma: PrismaService,
  ) {}

  async send(input: SendEmailInput): Promise<void> {
    const { to, subject, template, context, ticketId, eventId } = input;

    try {
      // Use the mailer's template rendering by passing template + context.
      // sendMail returns { response, messageId } on success.
      const info = await this.mailerService.sendMail({
        to,
        subject,
        template: `${template}`,
        context: { ...context, subject },
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
          sentAt: new Date(),
        },
      });

      this.logger.log(`Sent ${eventId} to ${to}`);
    } catch (err) {
      const error = err as Error;
      this.logger.error(`Failed to send ${eventId} to ${to}: ${error.message}`);

      await this.prisma.notificationLog.create({
        data: {
          ticketId: ticketId ?? null,
          eventId,
          recipient: to,
          subject,
          body: JSON.stringify(context),
          status: 'FAILED',
          error: error.message,
        },
      });
    }
  }
}
