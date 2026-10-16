import nodemailer from 'nodemailer';
import { env } from '../../config/env';
import { logger } from '../utils/logger';

export interface EmailOptions {
  to: string;
  toName?: string;
  subject: string;
  html: string;
  text?: string;
}

export interface OutboxEmailRecord extends EmailOptions {
  id: string;
  sentAt: string;
  status: 'Delivered' | 'Queued' | 'Failed';
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private sentEmails: OutboxEmailRecord[] = [];

  constructor() {
    if (env.EMAIL_PROVIDER === 'smtp' && env.SMTP_HOST) {
      this.transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT || 587,
        secure: env.SMTP_PORT === 465,
        auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD } : undefined,
      });
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    const record: OutboxEmailRecord = {
      id: `mail-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      ...options,
      sentAt: new Date().toISOString(),
      status: 'Delivered',
    };

    this.sentEmails.push(record);

    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: env.EMAIL_FROM,
          to: options.to,
          subject: options.subject,
          html: options.html,
          text: options.text || options.subject,
        });
        logger.info({ to: options.to, subject: options.subject }, 'Email sent successfully via SMTP');
        return true;
      } catch (error) {
        logger.error({ error, to: options.to }, 'Failed to deliver email via SMTP');
        record.status = 'Failed';
        return false;
      }
    }

    // Mock / Console mode
    logger.info({ to: options.to, subject: options.subject }, `[EMAIL MOCK DISPATCH] ${options.subject} to ${options.to}`);
    return true;
  }

  getSentEmails(): OutboxEmailRecord[] {
    return [...this.sentEmails];
  }
}

export const emailService = new EmailService();
