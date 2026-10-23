import { Controller, HttpCode, Logger, Post, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { apiKeyMatches, ApiKeyGuard } from '../../common/guards/api-key.guard';
import { TemplateSeedService } from '../templates/template-seed.service';
import { SmsEventDto } from './dto/sms-event.dto';
import { SmsService } from './sms.service';

@ApiTags('sms')
@ApiSecurity('api-key')
@Controller('sms')
export class SmsController {
  private readonly logger = new Logger(SmsController.name);

  constructor(
    private readonly sms: SmsService,
    private readonly seed: TemplateSeedService,
    private readonly config: ConfigService,
  ) {}

  @Post('seed')
  @HttpCode(200)
  @UseGuards(ApiKeyGuard)
  @ApiOperation({ summary: 'Upsert Nearo SMS templates' })
  seedTemplates() {
    return this.seed.seedSms().then((count) => ({ ok: true, count }));
  }

  @EventPattern('sms')
  async onSms(@Payload() body: SmsEventDto) {
    if (!this.allowed(body?.apiKey)) return;
    await this.sms.send(body);
  }

  @MessagePattern({ cmd: 'sms' })
  async onSmsSync(@Payload() body: SmsEventDto): Promise<boolean> {
    if (!this.allowed(body?.apiKey)) return false;
    return this.sms.send(body);
  }

  private allowed(apiKey: unknown): boolean {
    const ok = apiKeyMatches(this.config.get<string>('apiKey', ''), apiKey);
    if (!ok) this.logger.warn('sms ignored: api key');
    return ok;
  }
}
