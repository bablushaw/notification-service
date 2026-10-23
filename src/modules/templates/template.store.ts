import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import Redis from 'ioredis';
import { Repository } from 'typeorm';
import { PushTemplateEntity, SmsTemplateEntity } from '../../database/entities';

@Injectable()
export class TemplateStore implements OnModuleDestroy {
  private readonly logger = new Logger(TemplateStore.name);
  private redis: Redis | null = null;

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(SmsTemplateEntity)
    private readonly smsRepo: Repository<SmsTemplateEntity>,
    @InjectRepository(PushTemplateEntity)
    private readonly pushRepo: Repository<PushTemplateEntity>,
  ) {}

  async connectRedis() {
    const host = this.config.get<string>('redis.host');
    if (!host || this.redis) return;
    const client = new Redis({
      host,
      port: this.config.get<number>('redis.port', 6380),
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      connectTimeout: 1000,
    });
    try {
      await client.connect();
      this.redis = client;
    } catch (err) {
      this.logger.warn(
        `redis unavailable, templates from postgres: ${err instanceof Error ? err.message : err}`,
      );
      client.disconnect();
    }
  }

  async onModuleDestroy() {
    try {
      await this.redis?.quit();
    } catch {
      this.redis?.disconnect();
    }
  }

  async getSms(templateType: string): Promise<SmsTemplateEntity | null> {
    const cached = await this.cacheGet(`sms:${templateType}`);
    if (cached) return JSON.parse(cached) as SmsTemplateEntity;
    const row = await this.smsRepo.findOne({ where: { templateType } });
    if (row) await this.cacheSet(`sms:${templateType}`, JSON.stringify(row));
    return row;
  }

  async getPush(templateType: string): Promise<PushTemplateEntity | null> {
    const cached = await this.cacheGet(`push:${templateType}`);
    if (cached) return JSON.parse(cached) as PushTemplateEntity;
    const row = await this.pushRepo.findOne({ where: { templateType } });
    if (row) await this.cacheSet(`push:${templateType}`, JSON.stringify(row));
    return row;
  }

  async clear() {
    if (!this.redis) return;
    try {
      const keys = await this.redis.keys('nearo:tpl:*');
      if (keys.length) await this.redis.del(...keys);
    } catch (err) {
      this.logger.warn(
        `template cache clear skipped: ${err instanceof Error ? err.message : err}`,
      );
    }
  }

  private async cacheGet(key: string): Promise<string | null> {
    if (!this.redis) return null;
    try {
      return await this.redis.get(`nearo:tpl:${key}`);
    } catch {
      return null;
    }
  }

  private async cacheSet(key: string, value: string) {
    if (!this.redis) return;
    try {
      await this.redis.set(`nearo:tpl:${key}`, value, 'EX', 300);
    } catch {
      /* postgres remains the source */
    }
  }
}
