import mongoose from 'mongoose';
import { connectDatabase } from '../config/database';
import { Settings } from '../models/System';

const legacyCredentialFields = [
  'abaPayWayMerchantId', 'abaPayWayApiKey', 'abaPayWayApiUrl', 'bakongMerchantName', 'bakongMerchantId', 'bakongAccountId', 'bakongApiToken',
  'g2bulkApiUrl', 'g2bulkApiKey', 'g2bulkApiSecret', 'g2bulkUserId', 'telegramBotToken', 'telegramChatId'
] as const;

const environmentRequirements: Record<string, string[]> = {
  abaPayWayMerchantId: ['ABA_PAYWAY_MERCHANT_ID'], abaPayWayApiKey: ['ABA_PAYWAY_API_KEY'], abaPayWayApiUrl: ['ABA_PAYWAY_API_URL'],
  bakongMerchantName: ['BAKONG_MERCHANT_NAME'], bakongMerchantId: ['BAKONG_MERCHANT_ID'], bakongAccountId: ['BAKONG_ACCOUNT_ID'], bakongApiToken: ['BAKONG_API_TOKEN'],
  g2bulkApiUrl: ['G2BULK_API_URL'], g2bulkApiKey: ['G2BULK_API_KEY'], g2bulkApiSecret: ['G2BULK_API_SECRET'], g2bulkUserId: ['G2BULK_USER_ID'],
  telegramBotToken: ['TELEGRAM_BOT_TOKEN'], telegramChatId: ['TELEGRAM_CHAT_ID']
};

const configured = (name: string) => Boolean(process.env[name]?.trim());

async function run() {
  const apply = process.argv.includes('--apply');
  if (apply && process.env.CONFIRM_SETTINGS_CREDENTIAL_MIGRATION !== 'true') throw new Error('Refusing write: set CONFIRM_SETTINGS_CREDENTIAL_MIGRATION=true and use --apply.');
  await connectDatabase();
  const settings = await Settings.findOne().select(legacyCredentialFields.map((field) => `+${field}`).join(' ')).lean() as Record<string, unknown> | null;
  const populated = legacyCredentialFields.filter((field) => typeof settings?.[field] === 'string' && (settings[field] as string).trim());
  const missingEnvironment = populated.filter((field) => environmentRequirements[field].some((name) => !configured(name)));
  console.log(JSON.stringify({ mode: apply ? 'apply' : 'dry-run', settingsDocumentFound: Boolean(settings), populatedLegacyFieldNames: populated, missingEnvironmentVariables: missingEnvironment.flatMap((field) => environmentRequirements[field].filter((name) => !configured(name))), valuesPrinted: false }, null, 2));
  if (!apply || populated.length === 0) return;
  if (missingEnvironment.length) throw new Error('Refusing migration because required server environment variables are not configured.');
  await Settings.updateOne({ _id: settings!._id }, { $unset: Object.fromEntries(populated.map((field) => [field, 1])) });
  console.log(JSON.stringify({ migratedFieldCount: populated.length, valuesPrinted: false }, null, 2));
}

run().catch((error) => { console.error(error.message); process.exitCode = 1; }).finally(() => mongoose.disconnect());
