import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private resend: Resend;
  private fromEmail: string;

  constructor(private config: ConfigService) {
    this.resend = new Resend(this.config.get('RESEND_API_KEY'));
    this.fromEmail = this.config.get('RESEND_FROM_EMAIL') || 'onboarding@resend.dev';
  }

  async send(to: string, subject: string, html: string) {
    try {
      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to,
        subject,
        html,
      });

      if (error) {
        console.error('Email send error:', error);
        return { success: false, error };
      }

      return { success: true, data };
    } catch (err) {
      console.error('Email send exception:', err);
      return { success: false, error: err };
    }
  }
}