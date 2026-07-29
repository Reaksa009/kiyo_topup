import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('5000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  API_PREFIX: z.string().default('/api/v1'),
  CLIENT_URL: z.string().default('http://localhost:3000'),
  ADMIN_URL: z.string().default('http://localhost:3000/admin'),

  MONGODB_URI: z.string().default('mongodb://localhost:27017/kiyo_topup'),
  REDIS_URI: z.string().default('redis://localhost:6379'),

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

  TELEGRAM_BOT_TOKEN: z.string().default(''),
  TELEGRAM_CHAT_ID: z.string().default(''),

  SEED_ADMIN_EMAIL: z.string().default('admin@kiyotopup.com'),
  SEED_ADMIN_PASSWORD: z.string().default('AdminKiyoTopUp2026!')
});

export const env = envSchema.parse(process.env);
