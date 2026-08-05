import { Game, Package } from '../src/models/Game';
import { majorToMinor, minorToMajor, readProviderBasePriceMinor, readSellingPriceMinor } from '../src/utils/money';
import { providerPricingConfigurationSchema } from '../src/validation/catalog.schemas';
import { buildGameBackfill, buildPackageBackfill } from '../src/scripts/backfillProviderCatalogue';

describe('provider catalogue compatibility', () => {
  test('declares additive provider identity and catalogue query indexes', () => {
    const gameIndexes = Game.schema.indexes().map(([keys]) => keys);
    const packageIndexes = Package.schema.indexes().map(([keys]) => keys);
    expect(gameIndexes).toContainEqual({ provider: 1, providerGameId: 1 });
    expect(gameIndexes).toContainEqual({ provider: 1, providerStatus: 1, isEnabled: 1, sortOrder: 1 });
    expect(packageIndexes).toContainEqual({ provider: 1, providerPackageId: 1 });
    expect(packageIndexes).toContainEqual({ gameId: 1, providerStatus: 1, isEnabled: 1, sortOrder: 1 });
  });

  test('converts money exactly to minor units and prefers new authoritative values', () => {
    expect(majorToMinor(1.235, 'USD')).toBe(124);
    expect(minorToMajor(124, 'USD')).toBe(1.24);
    expect(majorToMinor(1250, 'KHR')).toBe(1250);
    expect(readSellingPriceMinor({ sellingPriceMinor: 155, price: 1.25 })).toBe(155);
    expect(readSellingPriceMinor({ price: 1.25 })).toBe(125);
    expect(readProviderBasePriceMinor({ providerBasePriceMinor: 95, costPrice: 0.8 })).toBe(95);
    expect(readProviderBasePriceMinor({ costPrice: 0.8 })).toBe(80);
  });

  test('rejects invalid pricing configuration', () => {
    expect(providerPricingConfigurationSchema.safeParse({ pricingMode: 'fixed', fixedSellingPriceMinor: -1 }).success).toBe(false);
    expect(providerPricingConfigurationSchema.safeParse({ pricingMode: 'fixed', fixedSellingPriceMinor: 150 }).success).toBe(true);
    expect(providerPricingConfigurationSchema.safeParse({ pricingMode: 'automatic', markupType: 'percentage' }).success).toBe(false);
    expect(providerPricingConfigurationSchema.safeParse({ pricingMode: 'automatic', markupType: 'fixed', markupValueMinor: 10 }).success).toBe(true);
  });

  test('backfill plans are deterministic and retain legacy values', () => {
    const game = { _id: 'game', slug: 'mobile-legends', title: 'Mobile Legends', instructions: 'Enter ID', thumbnail: 'logo', bannerUrl: 'cover', status: 'active', isPopular: true };
    const packageRecord = { _id: 'package', gameId: 'game', title: '86 Diamonds', providerType: 'G2BULK', providerProductId: 'sku-86', price: 1.25, costPrice: 0.95, status: 'active', badge: 'BEST SELLER' };
    const gameUpdate = buildGameBackfill(game);
    const first = buildPackageBackfill(packageRecord, { ...game, ...gameUpdate });
    const second = buildPackageBackfill({ ...packageRecord, ...first }, { ...game, ...gameUpdate });
    expect(first.providerPackageId).toBe('sku-86');
    expect(first.sellingPriceMinor).toBe(125);
    expect(first.providerBasePriceMinor).toBe(95);
    expect(second.sellingPriceMinor).toBe(first.sellingPriceMinor);
    expect(second.providerBasePriceMinor).toBe(first.providerBasePriceMinor);
  });
});
