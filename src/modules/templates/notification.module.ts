import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  NotificationLogEntity,
  PushTemplateEntity,
  SmsLogEntity,
  SmsTemplateEntity,
} from '../../database/entities';
import { FcmClient } from '../push/fcm.client';
import { NotificationController } from '../push/notification.controller';
import { PushTemplateController } from '../push/push-template.controller';
import { PushService } from '../push/push.service';
import { TokenResolver } from '../push/token-resolver';
import { SmsController } from '../sms/sms.controller';
import { SmsService } from '../sms/sms.service';
import { TemplateSeedService } from './template-seed.service';
import { TemplateStore } from './template.store';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SmsTemplateEntity,
      PushTemplateEntity,
      SmsLogEntity,
      NotificationLogEntity,
    ]),
  ],
  controllers: [
    SmsController,
    PushTemplateController,
    NotificationController,
  ],
  providers: [
    TemplateStore,
    TemplateSeedService,
    SmsService,
    PushService,
    TokenResolver,
    FcmClient,
  ],
})
export class NotificationModule {}
