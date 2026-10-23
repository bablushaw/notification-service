import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  PORT: Joi.number().default(3005),
  API_PREFIX: Joi.string().default('api/v1'),
  TCP_HOST: Joi.string().default('0.0.0.0'),
  TCP_PORT: Joi.number().default(4005),
  API_KEY: Joi.string().min(8).default('nearo_dev_notification_tcp_key_change_me'),

  DB_HOST: Joi.string().default('localhost'),
  DB_PORT: Joi.number().default(5432),
  DB_USERNAME: Joi.string().default('postgres'),
  DB_PASSWORD: Joi.string().default('admin'),
  DB_NAME: Joi.string().default('nearo'),
  DB_SYNC: Joi.boolean().truthy('true').falsy('false').default(true),
  DB_LOGGING: Joi.boolean().truthy('true').falsy('false').default(false),

  SEED_ON_BOOT: Joi.boolean().truthy('true').falsy('false').default(true),

  REDIS_HOST: Joi.string().allow('').default(''),
  REDIS_PORT: Joi.number().default(6380),

  TWILIO_ACCOUNT_SID: Joi.string().allow('').default(''),
  TWILIO_AUTH_TOKEN: Joi.string().allow('').default(''),
  TWILIO_FROM: Joi.string().allow('').default(''),

  CORS_ORIGINS: Joi.string().default('*'),
});
