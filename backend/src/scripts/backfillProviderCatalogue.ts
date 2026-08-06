import mongoose from 'mongoose';
import { connectDatabase } from '../config/database';
import { Game } from '../models/Game';
import { Package } from '../models/Package';
import { majorToMinor } from '../utils/money';
import { logger } from '../utils/logger';

export interface BackfillReport {
  inserted: number;
  updated: number;
  skipped: number;
  failed: number;
  dryRun: boolean;
}

const providerStatusForLegacyStatus = (status: string) => status === 'active' ? 'available' : 'unavailable';

export const buildGameBackfill = (game: any) => ({
  provider: game.provider || 'g2bulk',
  providerCode: game.providerCode || game.slug,
  providerName: game.providerName || game.title,
  displayName: game.displayName || game.title,
  description: game.description || game.instructions || '',
  logoUrl: game.logoUrl || game.thumbnail,
  coverImageUrl: game.coverImageUrl || game.bannerUrl,
  providerStatus: game.providerStatus || providerStatusForLegacyStatus(game.status),
  isEnabled: game.isEnabled ?? game.status === 'active',
  isFeatured: game.isFeatured ?? game.isPopular,
  ...(game.lastSyncedAt ? {} : { lastSyncedAt: new Date() })
});

export const buildPackageBackfill = (pkg: any, game: any) => ({
  provider: pkg.provider || String(pkg.providerType || '').toLowerCase(),
  providerGameId: pkg.providerGameId || game.providerGameId,
  providerPackageId: pkg.providerPackageId || pkg.providerProductId,
  providerCode: pkg.providerCode || game.providerCode || game.slug,
  providerName: pkg.providerName || game.providerName || game.title,
  displayName: pkg.displayName || pkg.title,
  providerBasePriceMinor: pkg.providerBasePriceMinor ?? majorToMinor(pkg.costPrice || 0, 'USD'),
  sellingPriceMinor: pkg.sellingPriceMinor ?? majorToMinor(pkg.price || 0, 'USD'),
  providerCurrency: pkg.providerCurrency || 'USD',
  displayCurrency: pkg.displayCurrency || 'USD',
  pricingMode: pkg.pricingMode || 'fixed',
  fixedSellingPriceMinor: pkg.fixedSellingPriceMinor ?? majorToMinor(pkg.price || 0, 'USD'),
  providerStatus: pkg.providerStatus || providerStatusForLegacyStatus(pkg.status),
  isEnabled: pkg.isEnabled ?? pkg.status === 'active',
  isFeatured: pkg.isFeatured ?? /best seller|best value/i.test(pkg.badge || ''),
  bonusText: pkg.bonusText || '',
  ...(pkg.lastSyncedAt ? {} : { lastSyncedAt: new Date() })
});

export const backfillProviderCatalogue = async ({ dryRun = false }: { dryRun?: boolean } = {}): Promise<BackfillReport> => {
  const report: BackfillReport = { inserted: 0, updated: 0, skipped: 0, failed: 0, dryRun };
  const games = await Game.find().lean();
  const gameById = new Map(games.map((game) => [String(game._id), game]));

  for (const game of games) {
    try {
      const update = buildGameBackfill(game);
      const differs = Object.entries(update).some(([key, value]) => (game as any)[key] === undefined || (game as any)[key] === null || (game as any)[key] === '');
      if (!differs) { report.skipped += 1; continue; }
      if (!dryRun) await Game.updateOne({ _id: game._id }, { $set: update });
      report.updated += 1;
    } catch (error) {
      report.failed += 1;
      logger.warn(`Provider catalogue backfill skipped game ${game._id}: ${(error as Error).message}`);
    }
  }

  const packages = await Package.find().lean();
  const providerIds = new Set<string>();
  for (const pkg of packages) {
    try {
      const game = gameById.get(String(pkg.gameId));
      if (!game) { report.skipped += 1; continue; }
      const update = buildPackageBackfill(pkg, game);
      const identity = `${update.provider}:${update.providerPackageId}`;
      if (!update.provider || !update.providerPackageId || providerIds.has(identity)) {
        report.skipped += 1;
        continue;
      }
      providerIds.add(identity);
      const differs = Object.entries(update).some(([key]) => (pkg as any)[key] === undefined || (pkg as any)[key] === null || (pkg as any)[key] === '');
      if (!differs) { report.skipped += 1; continue; }
      if (!dryRun) await Package.updateOne({ _id: pkg._id }, { $set: update });
      report.updated += 1;
    } catch (error) {
      report.failed += 1;
      logger.warn(`Provider catalogue backfill skipped package ${pkg._id}: ${(error as Error).message}`);
    }
  }
  return report;
};

if (require.main === module) {
  const dryRun = process.argv.includes('--dry-run');
  connectDatabase()
    .then(() => backfillProviderCatalogue({ dryRun }))
    .then((report) => {
      logger.info(`Provider catalogue backfill: ${JSON.stringify(report)}`);
      return mongoose.disconnect();
    })
    .then(() => process.exit(0))
    .catch(async (error) => {
      logger.error(`Provider catalogue backfill failed: ${error.message}`);
      await mongoose.disconnect();
      process.exit(1);
    });
}
