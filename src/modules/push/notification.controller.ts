import { Body, Controller, HttpCode, Logger, Post, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { apiKeyMatches, ApiKeyGuard } from '../../common/guards/api-key.guard';
import { NotificationEventDto } from './dto/notification-event.dto';
import { PushService } from './push.service';

@ApiTags('notifications')
@ApiSecurity('api-key')
@Controller('notifications')
export class NotificationController {
  private readonly logger = new Logger(NotificationController.name);

  constructor(
    private readonly push: PushService,
    private readonly config: ConfigService,
  ) {}

  @Post('send')
  @HttpCode(200)
  @UseGuards(ApiKeyGuard)
  @ApiOperation({
    summary: 'Send a push from a Nearo template',
    description:
      'Pass data.deviceTokens for a live device test, or data.recipientUserRoleIds to resolve devices.fcm_token. Missing FCM config returns 200 and logs SKIPPED.',
  })
  sendHttp(@Body() body: NotificationEventDto) {
    return this.push.send(body).then((ok) => ({ ok }));
  }

  @EventPattern('notification')
  async onNotification(@Payload() body: NotificationEventDto) {
    if (!this.allowed(body?.apiKey)) return;
    await this.push.send(body);
  }

  @MessagePattern({ cmd: 'notification' })
  async onNotificationSync(@Payload() body: NotificationEventDto): Promise<boolean> {
    if (!this.allowed(body?.apiKey)) return false;
    return this.push.send(body);
  }

  private allowed(apiKey: unknown): boolean {
    const ok = apiKeyMatches(this.config.get<string>('apiKey', ''), apiKey);
    if (!ok) this.logger.warn('notification ignored: api key');
    return ok;
  }
}
