import mongoose from 'mongoose';
import { connectDatabase } from '../config/database';
import { Game, Package } from '../models/Game';
import { Order } from '../models/Order';

const duplicateGroups = async (model: any, match: Record<string, unknown>, key: Record<string, string>) => {
  const groups = await model.aggregate([{ $match: match }, { $group: { _id: key, count: { $sum: 1 } } }, { $match: { count: { $gt: 1 } } }, { $project: { _id: 0, count: 1 } }]);
  return { duplicateGroupCount: groups.length, duplicateRecordCount: groups.reduce((total: number, group: { count: number }) => total + group.count, 0), groups };
};

async function run() {
  await connectDatabase();
  const report = {
    gameProviderIdentity: await duplicateGroups(Game, { provider: { $type: 'string' }, providerGameId: { $type: 'string' } }, { provider: '$provider', providerGameId: '$providerGameId' }),
    packageProviderIdentity: await duplicateGroups(Package, { provider: { $type: 'string' }, providerPackageId: { $type: 'string' } }, { provider: '$provider', providerPackageId: '$providerPackageId' }),
    packageCatalogKey: await duplicateGroups(Package, { catalogKey: { $type: 'string' } }, { gameId: '$gameId', catalogKey: '$catalogKey' }),
    orderIdempotency: await duplicateGroups(Order, { idempotencyKey: { $type: 'string' } }, { idempotencyKey: '$idempotencyKey' })
  };
  console.log(JSON.stringify({ report, indexCreationPerformed: false }, null, 2));
}

run().catch((error) => { console.error(error.message); process.exitCode = 1; }).finally(() => mongoose.disconnect());
