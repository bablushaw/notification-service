import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PushTemplateEntity, SmsTemplateEntity } from '../../database/entities';
import { PUSH_TEMPLATES, SMS_TEMPLATES } from './template.seed';
import { TemplateStore } from './template.store';

@Injectable()
export class TemplateSeedService implements OnModuleInit {
  private readonly logger = new Logger(TemplateSeedService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly store: TemplateStore,
    @InjectRepository(SmsTemplateEntity)
    private readonly smsRepo: Repository<SmsTemplateEntity>,
    @InjectRepository(PushTemplateEntity)
    private readonly pushRepo: Repository<PushTemplateEntity>,
  ) {}

  async onModuleInit() {
    await this.store.connectRedis();
    if (this.config.get<boolean>('seed.onBoot', true)) {
      await this.seedAll();
    }
  }

  async seedSms(): Promise<number> {
    await this.smsRepo.upsert(SMS_TEMPLATES, ['templateType']);
    await this.store.clear();
    this.logger.log(`sms templates seeded (${SMS_TEMPLATES.length})`);
    return SMS_TEMPLATES.length;
  }

  async seedPush(): Promise<number> {
    await this.pushRepo.upsert(PUSH_TEMPLATES, ['templateType']);
    await this.store.clear();
    this.logger.log(`push templates seeded (${PUSH_TEMPLATES.length})`);
    return PUSH_TEMPLATES.length;
  }

  async seedAll() {
    await this.seedSms();
    await this.seedPush();
  }
}
