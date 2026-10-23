import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('Nearo Notification Service API')
    .setDescription(
      `
SMS + push for Nearo. Socket.IO stays on realtime-service.

HTTP is api-key protected except \`GET /health\`. TCP events \`sms\` and \`notification\` on port 4005 require the same key in \`apiKey\` (not a user JWT).

Missing \`static/development/pushNotification.config.json\` logs the payload and writes \`notification_logs.status=SKIPPED\`. It does not fail the HTTP call.

Development SMS is LOCAL (console + \`sms_logs\`). Twilio runs only when \`NODE_ENV=production\` and \`TWILIO_*\` are set.

iOS hardware silent switch: \`interruption-level: time-sensitive\` breaks through Focus, not the Ring/Silent switch. Critical Alerts need an Apple entitlement and are out of scope.
      `.trim(),
    )
    .setVersion('1.0.0')
    .addServer('http://localhost:3005', 'Local development')
    .addApiKey(
      { type: 'apiKey', name: 'x-api-key', in: 'header' },
      'api-key',
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);
}
