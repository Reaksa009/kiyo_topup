import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const booleanEnv = z.enum(['true', 'false']).default('false').transform((value) => value === 'true');

const envSchema = z.object({
  PORT: z.string().default('5000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  API_PREFIX: z.string().default('/api/v1'),
  CLIENT_URL: z.string().default('http://localhost:3000'),
  ADMIN_URL: z.string().default('http://localhost:3000/admin'),
  CORS_ORIGINS: z.string().default(''),

  MONGODB_URI: z.string().default('mongodb://localhost:27017/kiyo_topup'),
  REDIS_URI: z.string().default('redis://localhost:6379'),
  ALLOW_IN_MEMORY_DB: booleanEnv,
  AUTO_SEED_DATABASE: booleanEnv,
  ENABLE_PAYMENT_SIMULATOR: booleanEnv,

  JWT_SECRET: z.string().default('kiyo_topup_secret_jwt_key_2026'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  JWT_REFRESH_SECRET: z.string().default('kiyo_topup_secret_refresh_jwt_key_2026'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),

  ABA_PAYWAY_MERCHANT_ID: z.string().default('kiyo_merchant_001'),
  ABA_PAYWAY_API_KEY: z.string().default('aba_payway_api_key_sample'),
  ABA_PAYWAY_API_URL: z.string().default('https://checkout-sandbox.payway.com.kh/api/payment-gateway/v1/payments/purchase'),
  ABA_PAYWAY_PUBLIC_KEY: z.string().default('aba_public_key_sample'),

  BAKONG_MERCHANT_NAME: z.string().default('KIYO TOPUP STORE'),
  BAKONG_MERCHANT_CITY: z.string().default('Phnom Penh'),
  BAKONG_MERCHANT_ID: z.string().default('kiyo_bakong_merchant_01'),
  BAKONG_ACCOUNT_ID: z.string().default('kiyo@acleda'),
  BAKONG_API_TOKEN: z.string().default('bakong_api_token_sample'),
  BAKONG_API_URL: z.string().default('https://api-bakong.nbc.gov.kh/v1/check_transaction_by_md5'),

  G2BULK_API_URL: z.string().default('https://api.g2bulk.com/v1'),
  G2BULK_API_KEY: z.string().default('g2bulk_api_key_sample'),
  G2BULK_API_SECRET: z.string().default('g2bulk_secret_sample'),
  G2BULK_USER_ID: z.string().default('kiyo_topup_user'),
  BAKONG_WEBHOOK_SECRET: z.string().default(''),
  G2BULK_WEBHOOK_SECRET: z.string().default(''),

  TELEGRAM_BOT_TOKEN: z.string().default(''),
  TELEGRAM_CHAT_ID: z.string().default(''),

  SEED_ADMIN_EMAIL: z.string().default('admin@kiyotopup.com'),
  SEED_ADMIN_PASSWORD: z.string().default('AdminKiyoTopUp2026!')
}).superRefine((config, context) => {
  if (config.NODE_ENV !== 'production') return;

  const rejectSecret = (field: keyof typeof config, value: string, minimumLength = 32) => {
    if (value.length < minimumLength || /sample|change|kiyo_topup_(secret|prod)|AdminKiyoTopUp2026/i.test(value)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: [field],
        message: `${field} must be replaced with a strong production secret`
      });
    }
  };

  rejectSecret('JWT_SECRET', config.JWT_SECRET);
  rejectSecret('JWT_REFRESH_SECRET', config.JWT_REFRESH_SECRET);
  rejectSecret('ABA_PAYWAY_API_KEY', config.ABA_PAYWAY_API_KEY, 16);
  rejectSecret('BAKONG_API_TOKEN', config.BAKONG_API_TOKEN, 16);
  rejectSecret('G2BULK_API_KEY', config.G2BULK_API_KEY, 16);
  rejectSecret('G2BULK_API_SECRET', config.G2BULK_API_SECRET, 16);
  rejectSecret('BAKONG_WEBHOOK_SECRET', config.BAKONG_WEBHOOK_SECRET);
  rejectSecret('G2BULK_WEBHOOK_SECRET', config.G2BULK_WEBHOOK_SECRET);
  rejectSecret('SEED_ADMIN_PASSWORD', config.SEED_ADMIN_PASSWORD, 14);

  if (config.ALLOW_IN_MEMORY_DB) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['ALLOW_IN_MEMORY_DB'],
      message: 'In-memory database fallback cannot be enabled in production'
    });
  }

  if (config.ENABLE_PAYMENT_SIMULATOR) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['ENABLE_PAYMENT_SIMULATOR'],
      message: 'Payment simulation cannot be enabled in production'
    });
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
