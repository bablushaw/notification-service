export default () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3005', 10),
  apiPrefix: process.env.API_PREFIX ?? 'api/v1',
  tcp: {
    host: process.env.TCP_HOST ?? '0.0.0.0',
    port: parseInt(process.env.TCP_PORT ?? '4005', 10),
  },
  apiKey: process.env.API_KEY ?? 'nearo_dev_notification_tcp_key_change_me',
  database: {
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    username: process.env.DB_USERNAME ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'admin',
    name: process.env.DB_NAME ?? 'nearo',
    sync: process.env.DB_SYNC !== 'false',
    logging: process.env.DB_LOGGING === 'true',
  },
  seed: {
    onBoot: process.env.SEED_ON_BOOT !== 'false',
  },
  redis: {
    host: process.env.REDIS_HOST || '',
    port: parseInt(process.env.REDIS_PORT ?? '6380', 10),
  },
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID || '',
    authToken: process.env.TWILIO_AUTH_TOKEN || '',
    from: process.env.TWILIO_FROM || '',
  },
  corsOrigins: (process.env.CORS_ORIGINS ?? '*')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
});
