import nodemailer from 'nodemailer';
import { env } from '../../config/env';
import { logger } from '../utils/logger';

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  toName?: string;
}

export interface EmailDispatchResult {
  provider: 'smtp' | 'mock' | 'console';
  delivered: boolean;
  messageId: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  public outbox: Array<SendEmailOptions & { id: string; sentAt: string; status: string }> = [];

  constructor() {
    if (env.EMAIL_PROVIDER === 'smtp' && env.SMTP_HOST && env.SMTP_USER) {
      this.transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT || 587,
        secure: (env.SMTP_PORT || 587) === 465,
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASSWORD,
        },
      });
    }
  }

  async sendEmail(options: SendEmailOptions): Promise<EmailDispatchResult> {
    const id = `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    if (env.EMAIL_PROVIDER === 'smtp' && this.transporter) {
      try {
        const info = await this.transporter.sendMail({
          from: env.EMAIL_FROM,
          to: options.to,
          subject: options.subject,
          text: options.text,
          html: options.html,
        });

        logger.info({ to: options.to, messageId: info.messageId }, 'Email dispatched via SMTP');
        return {
          provider: 'smtp',
          delivered: true,
          messageId: info.messageId || id,
        };
      } catch (err: any) {
        logger.error({ err: err.message, to: options.to }, 'Failed to deliver email via SMTP');
        throw err;
      }
    }

    // In 'console' or 'mock' modes:
    const status = env.EMAIL_PROVIDER === 'mock' ? 'Mocked' : 'Simulated (Console)';
    this.outbox.push({
      ...options,
      id,
      sentAt: new Date().toISOString(),
      status,
    });

    logger.info(
      { to: options.to, subject: options.subject, provider: env.EMAIL_PROVIDER, messageId: id },
      `[${env.EMAIL_PROVIDER.toUpperCase()}] Email recorded in delivery dispatch pipeline`
    );

    return {
      provider: env.EMAIL_PROVIDER,
      delivered: false, // Explicitly false for mock/console per requirements
      messageId: id,
    };
  }

  getOutbox() {
    return this.outbox;
  }

  clearOutbox() {
    this.outbox = [];
  }
}

export const emailService = new EmailService();
