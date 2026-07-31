import {
  classifyPackage,
  compareCatalogSnapshots,
  hasCatalogValidationErrors,
  normalizeG2Products,
  normalizePackage,
  productMatchesGame,
  selectCheapestProducts,
  G2Product
} from '../src/scripts/syncG2BulkCatalog';

describe('G2Bulk catalog normalization and selection', () => {
  test('normalizes common G2Bulk product response shapes', () => {
    const products = normalizeG2Products({
      products: [{
        product_id: 'ff-100',
        name: 'Free Fire - 100 Diamonds',
        category: { name: 'Free Fire' },
        price: '0.78',
        quantity: 20
      }]
    });

    expect(products).toHaveLength(1);
    expect(products[0]).toMatchObject({
      id: 'ff-100',
      title: 'Free Fire - 100 Diamonds',
      category_title: 'Free Fire',
      unit_price: 0.78,
      supplier_id: 'G2BULK',
      stock: 20
    });
  });

  test('matches by game identity and never by generic currency alone', () => {
    const freeFire: G2Product = {
      id: 'ff-100', title: '100 Diamonds', category_title: 'Free Fire', unit_price: 0.78, supplier_id: 'ff-supplier', stock: -1
    };
    const mobileLegends: G2Product = {
      id: 'ml-100', title: '100 Diamonds', category_title: 'Mobile Legends', unit_price: 0.78, supplier_id: 'ml-supplier', stock: -1
    };

    expect(productMatchesGame(freeFire, { slug: 'free-fire', keywords: ['free fire'], categoryAliases: ['free fire'] })).toBe(true);
    expect(productMatchesGame(mobileLegends, { slug: 'free-fire', keywords: ['free fire'], categoryAliases: ['free fire'] })).toBe(false);
  });

  test('selects the cheapest MLBB regular/global product and shares it across both regions', () => {
    const selected = selectCheapestProducts([
      { id: 'global-86', title: 'Mobile Legends Global - 86 Diamonds', category_title: 'Mobile Legends Global', unit_price: 1.1, supplier_id: 'global', stock: -1 },
      { id: 'regular-86', title: 'Mobile Legends - 86 Diamonds', category_title: 'Mobile Legends', unit_price: 0.95, supplier_id: 'regular', stock: -1 },
      { id: 'regular-172', title: 'Mobile Legends - 172 Diamonds', category_title: 'Mobile Legends', unit_price: 1.8, supplier_id: 'regular', stock: -1 }
    ], 'mobile-legends');

    expect(selected).toHaveLength(2);
    expect(selected.find((item) => item.cleanName.includes('86'))?.prod.id).toBe('regular-86');
    expect(selected.every((item) => item.supportsBoth)).toBe(true);
  });

  test('keeps event packages and separates bestseller from normal packages', () => {
    const event: G2Product = {
      id: 'ff-weekly', title: 'Free Fire Weekly Membership', category_title: 'Free Fire', unit_price: 1.2, supplier_id: 'g2', stock: -1
    };
    const bestseller: G2Product = {
      id: 'ff-100', title: 'Free Fire - 100 Diamonds', category_title: 'Free Fire', unit_price: 0.78, supplier_id: 'g2', stock: -1
    };
    const normal: G2Product = {
      id: 'ff-210', title: 'Free Fire - 210 Diamonds', category_title: 'Free Fire', unit_price: 1.5, supplier_id: 'g2', stock: -1
    };

    expect(classifyPackage(event, 0, 'free-fire')).toBe('EVENT / PASS');
    expect(classifyPackage(bestseller, 1, 'free-fire')).toBe('BEST SELLER');
    expect(classifyPackage(normal, 2, 'free-fire')).toBe('NORMAL');
    expect(normalizePackage('PUBG Mobile - 325 UC (300 + 25 Bonus)', 'pubg-mobile').uniqueKey).toBe('325-uc');
  });

  test('normalizes MLBB regional prefixes to diamond amount and package type only', () => {
    const regular = normalizePackage('Mobile Legends - 86 (78 + 8 Bonus) Diamonds', 'mobile-legends');
    const global = normalizePackage('Mobile Legends Global - 86 (78 + 8 Bonus) Diamonds', 'mobile-legends');

    expect(regular.uniqueKey).toBe('86-diamond');
    expect(global.uniqueKey).toBe(regular.uniqueKey);
  });

  test('keeps one supplier per package key and selects the lowest wholesale cost', () => {
    const selected = selectCheapestProducts([
      { id: 'supplier-a-86', title: 'Mobile Legends - 86 Diamonds', category_title: 'Mobile Legends', unit_price: 1.05, selling_price: 1.25, supplier_id: 'supplier-a', stock: -1 },
      { id: 'supplier-b-86', title: 'Mobile Legends Global - 86 Diamonds', category_title: 'Mobile Legends Global', unit_price: 0.92, selling_price: 1.25, supplier_id: 'supplier-b', stock: -1 }
    ], 'mobile-legends');

    expect(selected).toHaveLength(1);
    expect(selected[0].prod.id).toBe('supplier-b-86');
    expect(selected[0].uniqueKey).toBe('86-diamond');
  });

  test('reports missing, extra, duplicate, and exact field mismatches', () => {
    const base = {
      title: '86 Diamonds', catalogKey: '86-diamond', packageAmount: '86', packageType: 'diamond',
      price: 1.25, costPrice: 0.92, supplierId: 'supplier-b', providerType: 'G2BULK',
      providerProductId: 'supplier-b-86', status: 'active'
    };
    const result = compareCatalogSnapshots(
      [base, { ...base, title: '172 Diamonds', catalogKey: '172-diamond', packageAmount: '172', providerProductId: 'supplier-b-172' }],
      [{ ...base, supplierId: 'wrong-supplier' }, { ...base }, { ...base, title: '257 Diamonds', catalogKey: '257-diamond', packageAmount: '257', providerProductId: 'supplier-c-257' }]
    );

    expect(result.missing).toEqual(['172-diamond']);
    expect(result.extra).toEqual(['257-diamond']);
    expect(result.duplicates).toEqual(['86-diamond:2']);
    expect(result.mismatches).toEqual(['86-diamond:supplierId']);
    expect(hasCatalogValidationErrors(result)).toBe(true);
  });
});
