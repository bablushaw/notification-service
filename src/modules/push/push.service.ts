import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { interpolate } from '../../common/template.util';
import { NotificationLogEntity } from '../../database/entities';
import { TemplateStore } from '../templates/template.store';
import { FcmClient } from './fcm.client';
import {
  channelFor,
  expoMessage,
  fcmMessage,
  isExpoToken,
  PushEnvelope,
  stringData,
} from './push-message';
import { TokenResolver } from './token-resolver';

export type PushEvent = {
  userId?: string;
  roleName?: string;
  templateType: string;
  templateVariables?: Record<string, unknown>;
  data?: Record<string, unknown>;
};

export type PushTransport = {
  configured(): boolean;
  sendNative(messages: unknown[]): Promise<number>;
  sendExpo(messages: unknown[]): Promise<number>;
};

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);

  constructor(
    private readonly templates: TemplateStore,
    private readonly tokens: TokenResolver,
    private readonly fcm: FcmClient,
    @InjectRepository(NotificationLogEntity)
    private readonly logs: Repository<NotificationLogEntity>,
  ) {}

  async send(event: PushEvent, transport: PushTransport = this.fcm): Promise<boolean> {
    try {
      const template = await this.templates.getPush(event.templateType);
      const vars = event.templateVariables ?? {};
      const title = template ? interpolate(template.title, vars) : event.templateType;
      const body = template ? interpolate(template.body, vars) : '';
      const routed = channelFor(event.templateType, template?.channelId);
      const data = stringData(event.data, {
        templateType: event.templateType,
        channelId: routed.channelId,
      });
      if (event.roleName && !data.roleName) data.roleName = event.roleName;

      if (!template) {
        await this.logRow({
          templateType: event.templateType,
          userId: event.userId,
          title,
          body,
          channelId: routed.channelId,
          status: 'SKIPPED',
          error: 'missing template',
        });
        return true;
      }

      const deviceTokens = stringList(event.data?.deviceTokens);
      const recipientUserRoleIds = stringList(event.data?.recipientUserRoleIds);
      const resolved = await this.tokens.resolve({
        userId: event.userId,
        roleName: event.roleName ?? stringField(event.data?.roleName),
        recipientUserRoleIds,
        deviceTokens,
        countryCode: stringField(event.data?.countryCode) || stringField(vars.countryCode),
        mobileNumber:
          stringField(event.data?.mobileNumber) || stringField(vars.mobileNumber),
        deviceId:
          stringField(event.data?.deviceInstallationId) ||
          stringField(vars.deviceInstallationId),
      });

      if (!resolved.length) {
        this.logger.log(
          `push skipped (no tokens) ${event.templateType} ${JSON.stringify({ title, body, data })}`,
        );
        await this.logRow({
          templateType: event.templateType,
          userId: event.userId,
          title,
          body,
          channelId: routed.channelId,
          status: 'SKIPPED',
          error: 'no device token',
        });
        return true;
      }

      const envelopes: PushEnvelope[] = resolved.map((token) => ({
        token,
        title,
        body,
        channelId: routed.channelId,
        loud: routed.loud || Boolean(template.loud),
        data,
      }));
      const expo = envelopes.filter((row) => isExpoToken(row.token));
      const native = envelopes.filter((row) => !isExpoToken(row.token));

      if (expo.length) {
        const sent = await transport.sendExpo(expo.map(expoMessage));
        await this.logBatch(event, expo, sent, null);
      }

      if (native.length) {
        if (!transport.configured()) {
          this.logger.log(
            `push skipped (no FCM config) ${JSON.stringify({
              title,
              body,
              data,
              channelId: routed.channelId,
              tokens: native.map((row) => row.token),
            })}`,
          );
          for (const row of native) {
            await this.logRow({
              templateType: event.templateType,
              userId: event.userId,
              token: row.token,
              title,
              body,
              channelId: row.loud ? 'nearo_jobs_loud' : row.channelId,
              status: 'SKIPPED',
              error: 'missing pushNotification.config.json',
            });
          }
        } else {
          const sent = await transport.sendNative(native.map(fcmMessage));
          await this.logBatch(event, native, sent, null);
        }
      }
      return true;
    } catch (err) {
      this.logger.warn(
        `push skipped: ${err instanceof Error ? err.message : err}`,
      );
      return true;
    }
  }

  private async logBatch(
    event: PushEvent,
    rows: PushEnvelope[],
    sent: number,
    error: string | null,
  ) {
    for (let i = 0; i < rows.length; i += 1) {
      const row = rows[i];
      await this.logRow({
        templateType: event.templateType,
        userId: event.userId,
        token: row.token,
        title: row.title,
        body: row.body,
        channelId: row.loud ? 'nearo_jobs_loud' : row.channelId,
        status: i < sent ? 'SENT' : 'FAILED',
        error: i < sent ? null : error ?? 'provider rejected',
      });
    }
  }

  private async logRow(row: {
    templateType: string;
    userId?: string;
    token?: string;
    title: string;
    body: string;
    channelId: string;
    status: string;
    error: string | null;
  }) {
    await this.logs.save(
      this.logs.create({
        templateType: row.templateType,
        userId: row.userId ?? null,
        token: row.token ?? null,
        title: row.title,
        body: row.body,
        channelId: row.channelId,
        status: row.status,
        error: row.error,
      }),
    );
  }
}

function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && Boolean(item));
}

function stringField(value: unknown): string {
  return typeof value === 'string' ? value : '';
}
