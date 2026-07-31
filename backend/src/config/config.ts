import * as Joi from 'joi';

/**
 * Validated environment configuration.
 * Loaded via ConfigModule.forRoot({ validationSchema }) in AppModule.
 * Fails fast at boot if any required var is missing or malformed — preferable
 * to a runtime crash on first request.
 */
export const configValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(4000),

  // Database (SQLite default)
  DATABASE_URL: Joi.string().default('file:./prisma/dev.db'),

  // Auth
  JWT_SECRET: Joi.string().min(16).default('kwmoc-dev-secret-key-2026-min16'),
  JWT_ACCESS_TTL: Joi.string().default('8h'),
  APP_TOKEN_SECRET: Joi.string().min(16).default('kwmoc-tracking-token-secret-min16'),

  // CORS / cookies
  CORS_ORIGIN: Joi.string().default('http://localhost:3000'),
  COOKIE_DOMAIN: Joi.string().default('localhost'),
  COOKIE_SECURE: Joi.boolean().default(false),

  // Email (optional in dev — notifications silently skip)
  MAIL_HOST: Joi.string().allow(''),
  MAIL_PORT: Joi.number().default(2525),
  MAIL_USER: Joi.string().allow(''),
  MAIL_PASS: Joi.string().allow(''),
  MAIL_FROM: Joi.string().default('noreply@kwmoc.gov.ng'),

  // Storage
  STORAGE_DRIVER: Joi.string().valid('local', 'cloudinary').default('local'),
  UPLOADS_DIR: Joi.string().default('./uploads'),
  CLOUDINARY_CLOUD_NAME: Joi.string().allow(''),
  CLOUDINARY_API_KEY: Joi.string().allow(''),
  CLOUDINARY_API_SECRET: Joi.string().allow(''),

  // App
  APP_URL: Joi.string().default('http://localhost:3000'),

  // SLA (see planning/05-sla-matrix.md §1). Hours, calendar-time (working-day
  // math is deferred per §8). Override per environment if needed.
  SLA_P1_FIRST_RESPONSE_HOURS: Joi.number().default(1),
  SLA_P2_FIRST_RESPONSE_HOURS: Joi.number().default(4),
  SLA_P3_FIRST_RESPONSE_HOURS: Joi.number().default(24),
  SLA_P4_FIRST_RESPONSE_HOURS: Joi.number().default(48),
  SLA_P1_RESOLUTION_HOURS: Joi.number().default(24),
  SLA_P2_RESOLUTION_HOURS: Joi.number().default(72),
  SLA_P3_RESOLUTION_HOURS: Joi.number().default(240),
  SLA_P4_RESOLUTION_HOURS: Joi.number().default(360),
  SLA_WARNING_THRESHOLD: Joi.number().default(0.8),

  // Resolution & closure (see planning/milestone-6-resolution-closure.md).
  FEEDBACK_GRACE_DAYS: Joi.number().default(7),
  REOPEN_WINDOW_DAYS: Joi.number().default(14),

  // Archival retention (M8). Closed tickets archived after this many days.
  ARCHIVE_RETENTION_DAYS: Joi.number().default(90),
});
