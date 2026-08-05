import mongoose from 'mongoose';
import { connectDatabase } from '../config/database';
import { ProviderLog, ProviderOrder } from '../models/Provider';
import { redactProviderLogData } from '../utils/redaction';

const changed = (value: unknown) => JSON.stringify(value) !== JSON.stringify(redactProviderLogData(value));
const sanitize = (value: unknown) => redactProviderLogData(value);

async function sanitizeCollection(model: typeof ProviderLog, fields: string[], apply: boolean) {
  const records = await model.find({}).select(fields.join(' ')).lean() as Array<Record<string, unknown>>;
  const operations = records.flatMap((record) => {
    const update: Record<string, unknown> = {};
    for (const field of fields) if (changed(record[field])) update[field] = sanitize(record[field]);
    return Object.keys(update).length ? [{ updateOne: { filter: { _id: record._id }, update: { $set: update } } }] : [];
  });
  if (apply && operations.length) await model.bulkWrite(operations as any, { ordered: false });
  return { scanned: records.length, changed: operations.length };
}

async function run() {
  const apply = process.argv.includes('--apply');
  if (apply && process.env.CONFIRM_PROVIDER_LOG_SANITIZATION !== 'true') throw new Error('Refusing write: set CONFIRM_PROVIDER_LOG_SANITIZATION=true and use --apply.');
  await connectDatabase();
  const providerLogs = await sanitizeCollection(ProviderLog, ['endpoint', 'requestPayload', 'responsePayload'], apply);
  const providerOrders = await sanitizeCollection(ProviderOrder as any, ['responseData', 'errorMessage'], apply);
  console.log(JSON.stringify({ mode: apply ? 'apply' : 'dry-run', providerLogs, providerOrders, valuesPrinted: false, credentialRotationRecommended: true }, null, 2));
}

run().catch((error) => { console.error(error.message); process.exitCode = 1; }).finally(() => mongoose.disconnect());
