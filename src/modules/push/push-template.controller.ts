import { Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { TemplateSeedService } from '../templates/template-seed.service';

@ApiTags('push')
@ApiSecurity('api-key')
@Controller('push')
export class PushTemplateController {
  constructor(private readonly seed: TemplateSeedService) {}

  @Post('seed')
  @HttpCode(200)
  @UseGuards(ApiKeyGuard)
  @ApiOperation({ summary: 'Upsert Nearo push templates' })
  seedTemplates() {
    return this.seed.seedPush().then((count) => ({ ok: true, count }));
  }
}
