import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { interpolate } from '../../common/template.util';
import { SmsLogEntity } from '../../database/entities';
import { TemplateStore } from '../templates/template.store';

export type SmsEvent = {
  userId?: string;
  templateType: string;
  templateVariables?: Record<string, unknown>;
};

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly templates: TemplateStore,
    @InjectRepository(SmsLogEntity)
    private readonly logs: Repository<SmsLogEntity>,
  ) {}

  async send(event: SmsEvent): Promise<boolean> {
    try {
      const template = await this.templates.getSms(event.templateType);
      const vars = event.templateVariables ?? {};
      const messageTo = stringVar(vars.messageTo) || stringVar(vars.message_to);
      if (!template) {
        await this.write({
          templateType: event.templateType,
          messageTo,
          body: '',
          status: 'SKIPPED',
          provider: 'LOCAL',
          error: 'missing template',
        });
        return true;
      }
      const body = interpolate(template.body, vars);
      if (this.useTwilio()) {
        const error = await this.twilio(messageTo, body);
        await this.write({
          templateType: event.templateType,
          messageTo,
          body,
          status: error ? 'FAILED' : 'SENT',
          provider: 'TWILIO',
          error,
        });
        return true;
      }
      this.logger.log(`[LOCAL SMS] ${event.templateType} to=${messageTo} ${body}`);
      await this.write({
        templateType: event.templateType,
        messageTo,
        body,
        status: 'LOCAL',
        provider: 'LOCAL',
        error: null,
      });
      return true;
    } catch (err) {
      this.logger.warn(
        `sms skipped: ${err instanceof Error ? err.message : err}`,
      );
      return true;
    }
  }

  /** Twilio only in production when credentials exist. Dev OTP stays local. */
  private useTwilio(): boolean {
    if (this.config.get<string>('nodeEnv') !== 'production') return false;
    const sid = this.config.get<string>('twilio.accountSid');
    const token = this.config.get<string>('twilio.authToken');
    const from = this.config.get<string>('twilio.from');
    return Boolean(sid && token && from);
  }

  private async twilio(to: string, body: string): Promise<string | null> {
    const sid = this.config.get<string>('twilio.accountSid', '');
    const token = this.config.get<string>('twilio.authToken', '');
    const from = this.config.get<string>('twilio.from', '');
    if (!to) return 'missing messageTo';
    try {
      const form = new URLSearchParams({ To: to, From: from, Body: body });
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: form,
          signal: AbortSignal.timeout(8000),
        },
      );
      if (!response.ok) return `twilio HTTP ${response.status}`;
      return null;
    } catch (err) {
      return err instanceof Error ? err.message : String(err);
    }
  }

  private async write(row: {
    templateType: string;
    messageTo: string;
    body: string;
    status: string;
    provider: string;
    error: string | null;
  }) {
    await this.logs.save(
      this.logs.create({
        templateType: row.templateType,
        messageTo: row.messageTo || null,
        body: row.body,
        status: row.status,
        provider: row.provider,
        error: row.error,
      }),
    );
  }
}

function stringVar(value: unknown): string {
  return typeof value === 'string' ? value : value == null ? '' : String(value);
}
