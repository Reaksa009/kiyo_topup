import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const booleanEnv = z.enum(['true', 'false']).default('false').transform((value) => value === 'true');

const envSchema = z.object({
  PORT: z.string().default('5000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  API_PREFIX: z.string().default('/api/v1'),
  CLIENT_URL: z.string().default(process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://kiyotopup.vercel.app'),
  ADMIN_URL: z.string().default(process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}/admin` : 'https://kiyotopup.vercel.app/admin'),
  CORS_ORIGINS: z.string().default(''),
  DEPLOYMENT_ENVIRONMENT: z.enum(['development', 'preview', 'production']).default(
    process.env.VERCEL_ENV === 'production' || process.env.VERCEL_ENV === 'preview'
      ? process.env.VERCEL_ENV
      : process.env.NODE_ENV === 'production'
      ? 'production'
      : 'development'
  ),
  MONGODB_DATABASE_NAME: z.string().trim().min(1).default('kiyo_topup'),

  MONGODB_URI: z.string().default('mongodb://localhost:27017/kiyo_topup'),
  REDIS_URI: z.string().default('redis://localhost:6379'),
  ALLOW_IN_MEMORY_DB: booleanEnv,
  AUTO_SEED_DATABASE: booleanEnv,
  ENABLE_PAYMENT_SIMULATOR: booleanEnv,

  JWT_SECRET: z.string().default('kiyo_topup_secret_jwt_key_2026'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  JWT_REFRESH_SECRET: z.string().default('kiyo_topup_secret_refresh_jwt_key_2026'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),

  // The KHQRcc profile ID is public and appears in checkout URLs; only the API key is secret.
  ABA_PAYWAY_MERCHANT_ID: z.string().default('pVWqrqi5ioEWXUVNm34yj5YUcemo90sU'),
  ABA_PAYWAY_API_KEY: z.string().default('aba_payway_api_key_sample'),
  ABA_PAYWAY_API_URL: z.string().url().default('https://khqr.cc/api/payment/requestv2'),
  ABA_PAYWAY_PUBLIC_KEY: z.string().default('aba_public_key_sample'),

  BAKONG_MERCHANT_NAME: z.string().default('KIYO TOPUP STORE'),
  BAKONG_MERCHANT_CITY: z.string().default('Phnom Penh'),
  BAKONG_MERCHANT_ID: z.string().default('kiyo_bakong_merchant_01'),
  BAKONG_ACCOUNT_ID: z.string().default('kiyo@acleda'),
  BAKONG_API_TOKEN: z.string().default('bakong_api_token_sample'),
  BAKONG_API_URL: z.string().default('https://api-bakong.nbc.gov.kh/v1/check_transaction_by_md5'),

  KHQR_PROVIDER: z.enum(['bakong_open_api', 'khqr_link']).default('bakong_open_api'),
  KHQR_API_BASE_URL: z.string().url().default('https://api.khqr.link'),
  KHQR_API_TOKEN: z.string().default(''),
  KHQR_BAKONG_ACCOUNT_ID: z.string().default(''),
  KHQR_ACCOUNT_NAME: z.string().default('KIYO TOPUP'),
  KHQR_MERCHANT_CITY: z.string().default('PHNOM PENH'),
  KHQR_CURRENCY: z.enum(['USD', 'KHR']).default('USD'),

  G2BULK_API_URL: z.string().default('https://api.g2bulk.com/v1'),
  G2BULK_API_KEY: z.string().default('g2bulk_api_key_sample'),
  G2BULK_API_SECRET: z.string().default('g2bulk_api_secret_sample'),
  G2BULK_USER_ID: z.string().default('kiyo_topup_user'),
  MINIMUM_PROFIT_MINOR: z.coerce.number().int().min(0).default(0),
  MAX_PROVIDER_PRICE_CHANGE_BPS: z.coerce.number().int().min(0).default(500),
  BAKONG_WEBHOOK_SECRET: z.string().default(''),
  G2BULK_WEBHOOK_SECRET: z.string().default(''),

  TELEGRAM_BOT_TOKEN: z.string().default(''),
  TELEGRAM_FAILED_BOT_TOKEN: z.string().default(''),
  TELEGRAM_ORDER_WP_BOT_TOKEN: z.string().default(''),
  TELEGRAM_PAYMENT_RECEIVED_BOT_TOKEN: z.string().default(''),
  TELEGRAM_PROVIDER_LOW_BALANCE_BOT_TOKEN: z.string().default(''),
  TELEGRAM_CHAT_ID: z.string().default(''),

  SEED_ADMIN_EMAIL: z.string().default('admin@kiyotopup.com'),
  SEED_ADMIN_PASSWORD: z.string().default('AdminKiyoTopUp2026!')
}).superRefine((config, context) => {
  if (config.NODE_ENV !== 'production') return;

  const isStrict = process.env.STRICT_ENV_VALIDATION === 'true';
  const reportIssue = (path: string[], message: string) => {
    if (isStrict) {
      context.addIssue({ code: z.ZodIssueCode.custom, path, message });
    } else {
      console.warn(`[CONFIG WARNING] ${path.join('.')}: ${message}`);
    }
  };

  const vercelEnvironment = process.env.VERCEL_ENV;
  if (vercelEnvironment === 'preview' && config.DEPLOYMENT_ENVIRONMENT !== 'preview') {
    reportIssue(['DEPLOYMENT_ENVIRONMENT'], 'Preview deployments must use DEPLOYMENT_ENVIRONMENT=preview.');
  }
  if (vercelEnvironment === 'production' && config.DEPLOYMENT_ENVIRONMENT !== 'production') {
    reportIssue(['DEPLOYMENT_ENVIRONMENT'], 'Production deployments must use DEPLOYMENT_ENVIRONMENT=production.');
  }
  if (config.DEPLOYMENT_ENVIRONMENT === 'preview' && !/preview|staging/i.test(config.MONGODB_DATABASE_NAME)) {
    reportIssue(['MONGODB_DATABASE_NAME'], 'Preview deployments must use an explicitly preview/staging MongoDB database name.');
  }
  if (config.DEPLOYMENT_ENVIRONMENT === 'production' && /preview|staging|test/i.test(config.MONGODB_DATABASE_NAME)) {
    reportIssue(['MONGODB_DATABASE_NAME'], 'Production deployments cannot use a preview, staging, or test MongoDB database name.');
  }
  for (const origin of [config.CLIENT_URL, config.ADMIN_URL, ...config.CORS_ORIGINS.split(',')].filter(Boolean)) {
    try {
      const url = new URL(origin);
      if (url.protocol !== 'https:' || url.hostname === 'localhost') throw new Error('invalid origin');
    } catch {
      reportIssue(['CORS_ORIGINS'], 'Production CORS origins must be explicit HTTPS origins.');
      break;
    }
  }

  const rejectSecret = (field: keyof typeof config, value: string, minimumLength = 32) => {
    if (value.length < minimumLength || /sample|change|kiyo_topup_(secret|prod)|AdminKiyoTopUp2026/i.test(value)) {
      reportIssue([field], `${field} must be replaced with a strong production secret`);
    }
  };

  rejectSecret('JWT_SECRET', config.JWT_SECRET);
  rejectSecret('JWT_REFRESH_SECRET', config.JWT_REFRESH_SECRET);
  rejectSecret('ABA_PAYWAY_API_KEY', config.ABA_PAYWAY_API_KEY, 16);
  if (config.KHQR_PROVIDER === 'khqr_link') {
    rejectSecret('KHQR_API_TOKEN', config.KHQR_API_TOKEN, 16);

    if (!/^[a-z0-9._-]+@[a-z0-9._-]+$/i.test(config.KHQR_BAKONG_ACCOUNT_ID)) {
      reportIssue(['KHQR_BAKONG_ACCOUNT_ID'], 'KHQR_BAKONG_ACCOUNT_ID must be a valid Bakong account ID');
    }

    const khqrApiUrl = new URL(config.KHQR_API_BASE_URL);
    if (khqrApiUrl.protocol !== 'https:' || khqrApiUrl.hostname !== 'api.khqr.link') {
      reportIssue(['KHQR_API_BASE_URL'], 'KHQR_API_BASE_URL must use the official https://api.khqr.link endpoint');
    }

    if (config.KHQR_CURRENCY !== 'USD') {
      reportIssue(['KHQR_CURRENCY'], 'KHQR Link currently supports USD payments in this integration');
    }
  } else {
    rejectSecret('BAKONG_API_TOKEN', config.BAKONG_API_TOKEN, 16);
  }

  rejectSecret('BAKONG_WEBHOOK_SECRET', config.BAKONG_WEBHOOK_SECRET);
  rejectSecret('SEED_ADMIN_PASSWORD', config.SEED_ADMIN_PASSWORD, 14);

  if (config.ALLOW_IN_MEMORY_DB) {
    reportIssue(['ALLOW_IN_MEMORY_DB'], 'In-memory database fallback cannot be enabled in production');
  }

  if (config.ENABLE_PAYMENT_SIMULATOR) {
    reportIssue(['ENABLE_PAYMENT_SIMULATOR'], 'Payment simulation cannot be enabled in production');
  }
  if (config.AUTO_SEED_DATABASE) {
    reportIssue(['AUTO_SEED_DATABASE'], 'Automatic database seeding cannot be enabled in production.');
  }
});

export const env = envSchema.parse(process.env);

export const shouldAutoSeedDatabase = (
  autoSeedDatabase: boolean,
  runtime: NodeJS.ProcessEnv = process.env
): boolean => {
  const isProductionRuntime =
    runtime.NODE_ENV === 'production' ||
    runtime.VERCEL === '1' ||
    runtime.VERCEL_ENV === 'production';

  return autoSeedDatabase && !isProductionRuntime;
};
