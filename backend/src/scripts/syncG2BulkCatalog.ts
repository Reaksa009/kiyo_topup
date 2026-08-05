import axios from 'axios';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { connectDatabase } from '../config/database';
import { Game, Package, Category } from '../models/Game';
import { Order } from '../models/Order';
import { Settings } from '../models/System';
import { env } from '../config/env';
import { logger } from '../utils/logger';

export interface G2Product {
  id: number | string;
  title: string;
  category_id?: number | string;
  category_title: string;
  unit_price: number;
  selling_price?: number;
  supplier_id: string;
  stock: number;
  description?: string;
}

export interface GameCatalogMatchDefinition {
  slug: string;
  keywords: string[];
  categoryAliases?: string[];
}

export const GAME_IDENTITY_ALIASES: Record<string, string[]> = {
  'mobile-legends': ['mobile legends', 'mobile legends global', 'mlbb', 'mobilelegends', 'mobilelegend'],
  'pubg-mobile': ['pubg mobile', 'pubg', 'pubgmobile'],
  'free-fire': ['freefire global', 'freefire', 'free fire'],
  valorant: ['valorant'],
  'honor-of-kings': ['honor of kings', 'hok', 'honorofkings'],
  'cod-mobile': ['call of duty mobile', 'call of duty: mobile', 'cod mobile', 'codm', 'codmobile'],
  'blood-strike': ['blood strike', 'bloodstrike'],
  'delta-force': ['delta force', 'deltaforce']
};

const normalizeText = (value: unknown): string =>
  String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

export const normalizeG2Product = (raw: any): G2Product | null => {
  const id = raw?.id ?? raw?.product_id ?? raw?.productId ?? raw?.service_id ?? raw?.serviceId ?? raw?.service;
  const title = raw?.title ?? raw?.name ?? raw?.product_name ?? raw?.service_name;
  const category = raw?.category_title ?? raw?.category ?? raw?.category_name ?? raw?.game ?? '';
  const unitPrice = Number(raw?.unit_price ?? raw?.unitPrice ?? raw?.price ?? raw?.cost ?? raw?.wholesale_price ?? raw?.rate);
  const sellingPriceValue = raw?.selling_price ?? raw?.sellingPrice ?? raw?.retail_price ?? raw?.retailPrice;
  const sellingPrice = sellingPriceValue === undefined || sellingPriceValue === null ? undefined : Number(sellingPriceValue);
  const stockValue = Number(raw?.stock ?? raw?.quantity ?? -1);

  if (id === undefined || id === null || !String(title || '').trim() || !Number.isFinite(unitPrice) || unitPrice < 0) {
    return null;
  }

  return {
    id,
    title: String(title).trim(),
    category_id: raw?.category_id ?? raw?.categoryId,
    category_title: String(category?.title ?? category?.name ?? category).trim(),
    unit_price: unitPrice,
    selling_price: sellingPrice !== undefined && Number.isFinite(sellingPrice) && sellingPrice >= 0 ? sellingPrice : undefined,
    supplier_id: String(raw?.supplier_id ?? raw?.supplierId ?? raw?.provider_id ?? raw?.providerId ?? raw?.vendor_id ?? raw?.vendorId ?? 'G2BULK'),
    stock: Number.isFinite(stockValue) ? stockValue : -1,
    description: raw?.description ? String(raw.description) : raw?.type ? String(raw.type) : undefined
  };
};

export const normalizeG2Products = (payload: any): G2Product[] => {
  const source: any[] = Array.isArray(payload?.products)
    ? payload.products
    : Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload)
        ? payload
        : [];
  return source.map((item) => normalizeG2Product(item)).filter((product): product is G2Product => Boolean(product));
};

export const fetchLatestG2BulkServices = async (): Promise<G2Product[]> => {
  let catalogUrl: string;
  const rawApiUrl = (env.G2BULK_API_URL || 'https://api.g2bulk.com/v1').trim();
  try {
    catalogUrl = rawApiUrl.includes('/api/v2')
      ? rawApiUrl
      : new URL('/api/v2', rawApiUrl.replace(/\/v1\/?$/, '')).toString();
  } catch {
    throw new ValidationError('G2Bulk API URL is invalid.');
  }

  const body = new URLSearchParams({
    key: env.G2BULK_API_KEY,
    action: 'services'
  });
  const response = await axios.post(catalogUrl, body.toString(), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    timeout: 30000
  });

  if (!Array.isArray(response.data)) {
    const providerMessage = response.data?.error || response.data?.message;
    throw new ValidationError(
      providerMessage
        ? `G2Bulk services request failed: ${String(providerMessage)}`
        : 'G2Bulk services response is not a catalog array.'
    );
  }

  const products = normalizeG2Products(response.data);
  if (products.length === 0) {
    throw new ValidationError('Latest G2Bulk services catalog is empty.');
  }
  return products;
};

export const productMatchesGame = (product: G2Product, definition: GameCatalogMatchDefinition): boolean => {
  const title = normalizeText(product.title);
  const category = normalizeText(product.category_title);
  
  if (definition.slug === 'mobile-legends') {
    if (`${category} ${title}`.includes('mobile legends adventure')) {
      return false;
    }
    
    // Enforce exact matching for the main Mobile Legends/MLBB category only
    const isExactCategory = category === 'mobile legends' || category === 'mlbb' || category === 'mobile legends bang bang';
    if (!isExactCategory) {
      return false;
    }
  }

  const aliases = (definition.categoryAliases || definition.keywords).map(normalizeText).filter(Boolean);
  return aliases.some((alias) => category === alias || category.startsWith(`${alias} `) || title.includes(alias));
};

export const isRegionalLocked = (product: G2Product, gameSlug: string): boolean => {
  if (gameSlug !== 'mobile-legends') return false;

  const title = product.title.toLowerCase();
  const category = product.category_title.toLowerCase();
  const combined = `${category} ${title}`;

  const regionalKeywords = [
    'brazil', 'brasil', 'turkey', 'turkia', 'russia', 'russian', 'latam', 'latin america', 
    'mena', 'europe', 'cambodia', 'indonesia', 'philippines', 'singapore', 'malaysia', 'sg/my', 'sgmy',
    ' br ', ' tr ', ' ru ', ' kh ', ' id ', ' ph ', ' my ', ' sg ', 'brz', 'rus', 'trki'
  ];

  return regionalKeywords.some(keyword => {
    if (keyword.startsWith(' ') || keyword.endsWith(' ')) {
      return combined.includes(keyword);
    }
    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
    return regex.test(combined);
  });
};

export interface SelectedCatalogProduct {
  prod: G2Product;
  uniqueKey: string;
  cleanName: string;
  amount: string;
  type: string;
  sellingPrice: number;
  supportsBoth: boolean;
}

export const calculateSellingPrice = (product: G2Product): number => {
  const price = product.selling_price ?? product.unit_price * 1.18;
  return Math.max(0.25, Number(price.toFixed(2)));
};

export const selectCheapestProducts = (products: G2Product[], gameSlug: string): SelectedCatalogProduct[] => {
  const grouped = new Map<string, G2Product[]>();
  for (const product of products) {
    const normalized = normalizePackage(product.title, gameSlug);
    const list = grouped.get(normalized.uniqueKey) || [];
    list.push(product);
    grouped.set(normalized.uniqueKey, list);
  }

  return Array.from(grouped.entries()).map(([uniqueKey, variants]) => {
    const best = [...variants].sort((a, b) =>
      a.unit_price - b.unit_price ||
      calculateSellingPrice(a) - calculateSellingPrice(b) ||
      a.supplier_id.localeCompare(b.supplier_id) ||
      String(a.id).localeCompare(String(b.id))
    )[0];
    const normalized = normalizePackage(best.title, gameSlug);
    const supportsBoth = gameSlug === 'mobile-legends' && variants.length > 0;
    return {
      prod: best,
      uniqueKey,
      cleanName: normalized.cleanName,
      amount: normalized.amount,
      type: normalized.type,
      sellingPrice: calculateSellingPrice(best),
      supportsBoth
    };
  }).sort((a, b) => a.sellingPrice - b.sellingPrice || a.uniqueKey.localeCompare(b.uniqueKey));
};

const EVENT_PATTERN = /weekly|monthly|twilight|starlight|membership|battle\s*pass|event|season|limited|royale|pass/i;

export const classifyPackage = (product: G2Product, index: number, gameSlug: string): string => {
  const title = normalizeText(product.title);
  if (EVENT_PATTERN.test(title)) return 'EVENT / PASS';

  const bestsellerAmounts: Record<string, string[]> = {
    'mobile-legends': ['86', '257', '706', '2195'],
    'pubg-mobile': ['60 uc', '325 uc'],
    'free-fire': ['110', '572'],
    valorant: ['1000 vp', '2050 vp']
  };
  const known = bestsellerAmounts[gameSlug] || [];
  if (known.some((amount) => title.includes(normalizeText(amount))) || /best\s*seller|popular|recommended/i.test(title)) {
    return 'BEST SELLER';
  }
  return index === 0 ? 'BEST SELLER' : 'NORMAL';
};

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

const formatDate = (date: Date): string => {
  return date.toISOString().replace('T', ' ').substring(0, 19);
};

export const normalizePackage = (title: string, gameSlug: string) => {
  let clean = title.replace(/\s+/g, ' ').trim();
  if (gameSlug === 'mobile-legends') {
    clean = clean.replace(/^(?:Mobile Legends(?::\s*Bang Bang)?(?:\s+[A-Za-z]+)*|MLBB)\s*[-:|]\s*/i, '').trim();
  } else if (gameSlug === 'pubg-mobile') {
    clean = clean.replace(/^(PUBG Mobile|PUBG)\s*[-:|]\s*/i, '').trim();
  } else if (gameSlug === 'free-fire') {
    clean = clean.replace(/^(?:Free\s*Fire|Freefire)(?:\s+[A-Za-z]+)*\s*[-:|]\s*/i, '').trim();
  } else if (gameSlug === 'valorant') {
    clean = clean.replace(/^Valorant(?:\s+[A-Za-z]+)*\s*[-:|]\s*/i, '').trim();
  } else if (gameSlug === 'honor-of-kings') {
    clean = clean.replace(/^(?:Honor of Kings|HOK)(?:\s+[A-Za-z]+)*\s*[-:|]\s*/i, '').trim();
  } else if (gameSlug === 'cod-mobile') {
    clean = clean.replace(/^(?:Call of Duty(?::)?\s*Mobile(?:\s+[A-Za-z]+)*|CODM)\s*[-:|]\s*/i, '').trim();
  } else if (gameSlug === 'blood-strike') {
    clean = clean.replace(/^Blood\s*Strike(?:\s+[A-Za-z]+)*\s*[-:|]\s*/i, '').trim();
  } else if (gameSlug === 'delta-force') {
    clean = clean.replace(/^(?:Garena\s+)?Delta\s*Force(?:\s+[A-Za-z]+)*\s*[-:|]\s*/i, '').trim();
  }
  
  let amount = '';
  let type = 'default';
  const cleanLower = clean.toLowerCase();
  
  if (cleanLower.includes('weekly')) {
    amount = normalizeText(clean).replace(/\s+/g, '-');
    type = 'pass';
  } else if (cleanLower.includes('twilight')) {
    amount = normalizeText(clean).replace(/\s+/g, '-');
    type = 'pass';
  } else if (cleanLower.includes('monthly')) {
    amount = normalizeText(clean).replace(/\s+/g, '-');
    type = 'pass';
  } else if (cleanLower.includes('starlight')) {
    amount = normalizeText(clean).replace(/\s+/g, '-');
    type = 'pass';
  } else {
    const match = clean.match(/([\d][\d,]*(?:\s*\+\s*[\d,]+)*)\s*(?:\([^)]*\)\s*)?(?:delta\s+)?(diamonds?|uc|vp|points?|tokens?|gems?|gold|credits?|coins?|cp)\b/i);
    if (match) {
      amount = match[1].replace(/[\s,]/g, '');
      const rawType = match[2].toLowerCase();
      const canonicalTypes: Record<string, string> = {
        diamonds: 'diamond', diamond: 'diamond',
        points: 'point', point: 'point',
        tokens: 'token', token: 'token',
        gems: 'gem', gem: 'gem',
        credits: 'credit', credit: 'credit',
        coins: 'coin', coin: 'coin'
      };
      type = canonicalTypes[rawType] || rawType;
    } else if (/^[\d][\d,]*(?:\s*\+\s*[\d,]+)*$/.test(clean)) {
      amount = clean.replace(/[\s,]/g, '');
      const defaultTypes: Record<string, string> = {
        'mobile-legends': 'diamond',
        'pubg-mobile': 'uc',
        'free-fire': 'diamond',
        valorant: 'vp',
        'honor-of-kings': 'token',
        'cod-mobile': 'cp',
        'blood-strike': 'gold',
        'delta-force': 'coin'
      };
      type = defaultTypes[gameSlug] || 'item';
    } else {
      amount = normalizeText(clean).replace(/\s+/g, '-');
      type = 'item';
    }
  }
  
  return {
    cleanName: clean,
    amount,
    type,
    uniqueKey: `${amount}-${type}`
  };
};

export interface CatalogPackageSnapshot {
  title: string;
  catalogKey: string;
  packageAmount: string;
  packageType: string;
  price: number;
  costPrice: number;
  supplierId: string;
  providerType: string;
  providerProductId: string;
  status: string;
}

export interface CatalogValidationResult {
  missing: string[];
  extra: string[];
  duplicates: string[];
  mismatches: string[];
}

export const compareCatalogSnapshots = (
  expected: CatalogPackageSnapshot[],
  actual: CatalogPackageSnapshot[]
): CatalogValidationResult => {
  const result: CatalogValidationResult = { missing: [], extra: [], duplicates: [], mismatches: [] };
  const expectedByKey = new Map<string, CatalogPackageSnapshot>();
  const actualByKey = new Map<string, CatalogPackageSnapshot[]>();

  for (const pkg of expected) {
    if (expectedByKey.has(pkg.catalogKey)) result.duplicates.push(`expected:${pkg.catalogKey}`);
    expectedByKey.set(pkg.catalogKey, pkg);
  }
  for (const pkg of actual) {
    const list = actualByKey.get(pkg.catalogKey) || [];
    list.push(pkg);
    actualByKey.set(pkg.catalogKey, list);
  }

  for (const [catalogKey, expectedPkg] of expectedByKey) {
    const matches = actualByKey.get(catalogKey) || [];
    if (matches.length === 0) {
      result.missing.push(catalogKey);
      continue;
    }
    if (matches.length > 1) result.duplicates.push(`${catalogKey}:${matches.length}`);

    const actualPkg = matches[0];
    const mismatchedFields: string[] = [];
    const exactFields: Array<keyof CatalogPackageSnapshot> = [
      'title', 'packageAmount', 'packageType', 'supplierId',
      'providerType', 'providerProductId', 'status'
    ];
    for (const field of exactFields) {
      if (actualPkg[field] !== expectedPkg[field]) mismatchedFields.push(field);
    }
    if (Number(actualPkg.price.toFixed(2)) !== Number(expectedPkg.price.toFixed(2))) mismatchedFields.push('price');
    if (Number(actualPkg.costPrice.toFixed(6)) !== Number(expectedPkg.costPrice.toFixed(6))) mismatchedFields.push('costPrice');
    if (mismatchedFields.length > 0) result.mismatches.push(`${catalogKey}:${mismatchedFields.join(',')}`);
  }

  for (const catalogKey of actualByKey.keys()) {
    if (!expectedByKey.has(catalogKey)) result.extra.push(catalogKey);
  }
  return result;
};

export const hasCatalogValidationErrors = (result: CatalogValidationResult): boolean =>
  result.missing.length > 0 || result.extra.length > 0 || result.duplicates.length > 0 || result.mismatches.length > 0;

export interface CatalogSyncReport {
  syncStarted: string;
  syncFinished: string;
  status: 'SUCCESS' | 'FAILED';
  oldPackagesDeleted: number;
  newPackagesImported: number;
  duplicatePackagesRemoved: number;
  missingPackages: number;
  extraPackages: number;
  finalDatabaseCount: number;
  latestCatalogCount: number;
  validation: 'PASSED' | 'FAILED';
  transaction: 'COMMITTED' | 'ROLLED BACK';
  database?: 'UNCHANGED';
  reason?: string;
}

const buildPackageTitle = (item: SelectedCatalogProduct, gameSlug: string): string => {
  if (gameSlug === 'free-fire' && /^\d+(?:\+\d+)?$/.test(item.cleanName)) {
    return `${item.cleanName} Diamonds`;
  }
  if (gameSlug !== 'mobile-legends') return item.cleanName;
  const rawTitle = item.prod.title.toLowerCase();
  if (rawTitle.includes('weekly') && !rawTitle.includes('elite')) return 'Weekly Diamond Pass';
  if (rawTitle.includes('twilight')) return 'Twilight Pass';
  if (rawTitle.includes('monthly') && !rawTitle.includes('elite')) return 'Monthly Pass';
  if (/^\d+(?:\+\d+)?$/.test(item.cleanName)) return `${item.cleanName} Diamonds`;
  return item.cleanName;
};

export interface CatalogSyncOptions {
  gameSlugs?: string[];
}

export const syncG2BulkCatalog = async (options: CatalogSyncOptions = {}): Promise<CatalogSyncReport> => {
  const syncStartTime = new Date();
  logger.info(`G2Bulk Sync Started: ${formatDate(syncStartTime)}`);

  // Track metrics for report
  let totalOldDeleted = 0;
  let totalNewImported = 0;
  let totalDuplicatesRemoved = 0;
  let totalMissing = 0;
  let totalExtra = 0;

  let session: mongoose.ClientSession | null = null;
  const syncToken = crypto.randomUUID();
  let lockAcquired = false;
  let finalReport: CatalogSyncReport | null = null;

  try {
    await connectDatabase();

    // Ensure all model indexes are built before starting the transaction
    logger.info('Ensuring database indexes are built...');
    await Promise.all([
      Category.ensureIndexes(),
      Game.ensureIndexes(),
      Package.ensureIndexes(),
      Settings.ensureIndexes()
    ]);

    // Acquire a visible lock outside the catalog transaction. A lock written
    // inside the transaction would be invisible to customer APIs until commit.
    session = await mongoose.startSession();
    const settingsDoc = await Settings.findOneAndUpdate(
      {},
      { $setOnInsert: { isSyncing: false } },
      { upsert: true, new: true }
    );
    if (!settingsDoc) throw new ValidationError('Unable to initialize catalog synchronization settings.');
    const acquiredLock = await Settings.findOneAndUpdate(
      { _id: settingsDoc._id, isSyncing: { $ne: true } },
      {
        $set: {
          isSyncing: true,
          catalogSyncToken: syncToken,
          catalogSyncStartedAt: syncStartTime,
          catalogSyncStatus: 'running'
        },
        $unset: { catalogSyncLastError: '' }
      },
      { new: true }
    );
    if (!acquiredLock) {
      throw new ValidationError('Another G2Bulk catalog synchronization is already running.');
    }
    lockAcquired = true;
    logger.info(`Sync lock enabled (token=${syncToken}). Package and checkout APIs are disabled.`);

    // The order adapter submits G2Bulk v2 service IDs, so synchronization must
    // use that same service catalog rather than the unrelated v1 gift-card feed.
    logger.info('Fetching latest service catalog from G2Bulk API v2...');
    const products = await fetchLatestG2BulkServices();
    logger.info(`Fetched ${products.length} service catalog items from G2Bulk API v2.`);

    const gameDefinitions = [
      {
        slug: 'mobile-legends',
        title: 'Mobile Legends: Bang Bang',
        publisher: 'Moonton',
        categoryName: 'MOBA',
        categorySlug: 'moba',
        categoryIcon: 'Swords',
        thumbnail: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=400&q=75',
        bannerUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=75',
        keywords: ['mobile legends', 'mlbb', 'diamond', 'starlight', 'weekly pass'],
        inputFields: [
          { name: 'playerId', label: 'Player ID', placeholder: 'e.g. 563087296', type: 'text', required: true, helpText: 'Found under avatar header' },
          { name: 'serverId', label: 'Server ID', placeholder: 'e.g. 3484', type: 'text', required: true, helpText: '4-5 digit number inside brackets' }
        ]
      },
      {
        slug: 'pubg-mobile',
        title: 'PUBG Mobile',
        publisher: 'Tencent Games',
        categoryName: 'Battle Royale',
        categorySlug: 'battle-royale',
        categoryIcon: 'Target',
        thumbnail: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=400&q=75',
        bannerUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=75',
        keywords: ['pubg mobile', 'pubg', 'uc'],
        inputFields: [
          { name: 'playerId', label: 'Character ID', placeholder: 'e.g. 5123456789', type: 'text', required: true, helpText: 'Numeric PUBG Character ID' }
        ]
      },
      {
        slug: 'free-fire',
        title: 'Free Fire Global',
        publisher: 'Garena',
        categoryName: 'Battle Royale',
        categorySlug: 'battle-royale',
        categoryIcon: 'Target',
        thumbnail: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=400&q=75',
        bannerUrl: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=800&q=75',
        keywords: ['free fire', 'diamond', 'garena'],
        inputFields: [
          { name: 'playerId', label: 'Player ID (UID)', placeholder: 'e.g. 987654321', type: 'text', required: true, helpText: 'Global-region numeric UID. No server ID is required.' }
        ]
      },
      {
        slug: 'valorant',
        title: 'Valorant',
        publisher: 'Riot Games',
        categoryName: 'Tactical Shooter',
        categorySlug: 'tactical-shooter',
        categoryIcon: 'Crosshair',
        thumbnail: 'https://images.unsplash.com/photo-1560253023-3ec5d502959f?auto=format&fit=crop&w=400&q=75',
        bannerUrl: 'https://images.unsplash.com/photo-1560253023-3ec5d502959f?auto=format&fit=crop&w=800&q=75',
        keywords: ['valorant', 'vp', 'riot'],
        inputFields: [
          { name: 'riotId', label: 'Riot ID', placeholder: 'e.g. Player#TAG', type: 'text', required: true }
        ]
      },
      {
        slug: 'honor-of-kings',
        title: 'Honor of Kings',
        publisher: 'Level Infinite',
        categoryName: 'MOBA',
        categorySlug: 'moba',
        categoryIcon: 'Swords',
        thumbnail: 'https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?auto=format&fit=crop&w=400&q=75',
        bannerUrl: 'https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?auto=format&fit=crop&w=800&q=75',
        keywords: ['honor of kings', 'hok', 'tokens'],
        inputFields: [
          { name: 'uid', label: 'Game UID', placeholder: 'e.g. 1002345678', type: 'text', required: true }
        ]
      },
      {
        slug: 'cod-mobile',
        title: 'Call of Duty: Mobile',
        publisher: 'Activision',
        categoryName: 'Tactical Shooter',
        categorySlug: 'tactical-shooter',
        categoryIcon: 'Crosshair',
        thumbnail: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=400&q=75',
        bannerUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=800&q=75',
        keywords: ['cod', 'call of duty', 'cp'],
        inputFields: [
          { name: 'openId', label: 'Open ID', placeholder: 'e.g. 678912345678', type: 'text', required: true }
        ]
      },
      {
        slug: 'blood-strike',
        title: 'Blood Strike',
        publisher: 'NetEase Games',
        categoryName: 'Tactical Shooter',
        categorySlug: 'tactical-shooter',
        categoryIcon: 'Crosshair',
        thumbnail: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=400&q=75',
        bannerUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=75',
        keywords: ['blood strike', 'bloodstrike', 'gold'],
        inputFields: [
          { name: 'userCode', label: 'User Code', placeholder: 'e.g. BS998877', type: 'text', required: true, helpText: 'Your Blood Strike user code' }
        ]
      },
      {
        slug: 'delta-force',
        title: 'Delta Force',
        publisher: 'Team Jade',
        categoryName: 'Tactical Shooter',
        categorySlug: 'tactical-shooter',
        categoryIcon: 'Crosshair',
        thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=75',
        bannerUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=75',
        keywords: ['delta force', 'deltaforce', 'delta coins'],
        inputFields: [
          { name: 'playerTag', label: 'Player Tag', placeholder: 'e.g. DF-100293', type: 'text', required: true, helpText: 'Your Delta Force account tag' }
        ]
      }
    ];

    const requestedGameSlugs = [...new Set((options.gameSlugs || []).map((slug) => slug.trim().toLowerCase()).filter(Boolean))];
    const selectedGameDefinitions = requestedGameSlugs.length > 0
      ? gameDefinitions.filter((definition) => requestedGameSlugs.includes(definition.slug))
      : gameDefinitions;
    const unknownGameSlugs = requestedGameSlugs.filter(
      (slug) => !gameDefinitions.some((definition) => definition.slug === slug)
    );
    if (unknownGameSlugs.length > 0) {
      throw new ValidationError(`Unknown catalog sync game slug(s): ${unknownGameSlugs.join(', ')}.`);
    }
    if (selectedGameDefinitions.length === 0) {
      throw new ValidationError('Catalog synchronization scope contains no games.');
    }
    logger.info(`Catalog synchronization scope: ${selectedGameDefinitions.map((definition) => definition.slug).join(', ')}.`);

    // Preflight the entire provider response before opening the transaction.
    // A missing game catalog is a hard failure: old data is never preserved or
    // merged as a fallback.
    const preparedCatalogs = new Map<string, SelectedCatalogProduct[]>();
    for (const gameMeta of selectedGameDefinitions) {
      const matchedProducts = products.filter((product) => {
        const matches = productMatchesGame(product, {
          slug: gameMeta.slug,
          keywords: gameMeta.keywords,
          categoryAliases: GAME_IDENTITY_ALIASES[gameMeta.slug] || gameMeta.keywords
        });
        if (!matches) return false;

        // Exclude regional locked products for mobile-legends
        if (gameMeta.slug === 'mobile-legends' && isRegionalLocked(product, 'mobile-legends')) {
          return false;
        }
        return true;
      });
      if (matchedProducts.length === 0) {
        throw new ValidationError(`Latest G2Bulk catalog contains no products for ${gameMeta.title}.`);
      }
      const selectedProducts = selectCheapestProducts(matchedProducts, gameMeta.slug);
      if (selectedProducts.length === 0) {
        throw new ValidationError(`Latest G2Bulk catalog produced no valid packages for ${gameMeta.title}.`);
      }
      preparedCatalogs.set(gameMeta.slug, selectedProducts);
      totalDuplicatesRemoved += matchedProducts.length - selectedProducts.length;
      logger.info(`Prepared ${selectedProducts.length} latest packages for ${gameMeta.title}; removed ${matchedProducts.length - selectedProducts.length} supplier duplicates.`);
    }

    session.startTransaction({
      readConcern: { level: 'snapshot' },
      writeConcern: { w: 'majority' },
      readPreference: 'primary'
    });
    logger.info('MongoDB replacement transaction started.');

    const bulkBatchSize = 500;
    const categoryDefinitions = Array.from(
      new Map(selectedGameDefinitions.map((definition) => [definition.categorySlug, definition])).values()
    );
    await Category.bulkWrite(
      categoryDefinitions.map((definition) => ({
        updateOne: {
          filter: { slug: definition.categorySlug },
          update: {
            $set: {
              name: definition.categoryName,
              slug: definition.categorySlug,
              icon: definition.categoryIcon,
              status: 'active'
            }
          },
          upsert: true
        }
      })),
      { session, ordered: true }
    );
    const categoryDocs = await Category.find({
      slug: { $in: categoryDefinitions.map((definition) => definition.categorySlug) }
    }).session(session).lean();
    const categoryBySlug = new Map(categoryDocs.map((category) => [category.slug, category]));
    if (categoryBySlug.size !== categoryDefinitions.length) {
      throw new ValidationError('Category upsert verification failed during catalog synchronization.');
    }

    await Game.bulkWrite(
      selectedGameDefinitions.map((definition) => ({
        updateOne: {
          filter: { slug: definition.slug },
          update: {
            $set: {
              title: definition.title,
              slug: definition.slug,
              publisher: definition.publisher,
              thumbnail: definition.thumbnail,
              bannerUrl: definition.bannerUrl,
              categoryId: categoryBySlug.get(definition.categorySlug)!._id as any,
              inputFields: definition.inputFields,
              status: 'active',
              isPopular: true
            }
          },
          upsert: true
        }
      })) as any,
      { session, ordered: true }
    );
    const gameDocs = await Game.find({
      slug: { $in: selectedGameDefinitions.map((definition) => definition.slug) }
    }).session(session).lean();
    const gameBySlug = new Map(gameDocs.map((game) => [game.slug, game]));
    if (gameBySlug.size !== selectedGameDefinitions.length) {
      throw new ValidationError('Game upsert verification failed during catalog synchronization.');
    }

    const legacyGlobalGameIds: mongoose.Types.ObjectId[] = [];
    if (selectedGameDefinitions.some((definition) => definition.slug === 'mobile-legends')) {
      const legacyGlobalGames = await Game.find({
        $or: [
          { slug: { $in: ['mobile-legends-global', 'mobile_legends_global', 'mlbb-global'] } },
          { title: /^Mobile Legends Global/i }
        ]
      }).session(session).select('_id').lean();
      legacyGlobalGameIds.push(...legacyGlobalGames.map((game) => game._id as mongoose.Types.ObjectId));
    }

    const syncPlans = selectedGameDefinitions.map((gameMeta) => {
      const gameDoc = gameBySlug.get(gameMeta.slug)!;
      const deduplicatedProducts = preparedCatalogs.get(gameMeta.slug)!;
      const replacementGameIds: mongoose.Types.ObjectId[] = [gameDoc._id as mongoose.Types.ObjectId];
      if (gameMeta.slug === 'mobile-legends') replacementGameIds.push(...legacyGlobalGameIds);
      const expectedDocuments = deduplicatedProducts.map((item, idx) => {
        const prod = item.prod;
        const packageTitle = buildPackageTitle(item, gameMeta.slug);
        return {
          gameId: gameDoc._id,
          title: packageTitle,
          description: prod.description || `${packageTitle} (Automated Instant Top-up | Source: G2Bulk ${prod.category_title}${item.supportsBoth ? ' | Supports Global & Regular Servers' : ''})`,
          price: item.sellingPrice,
          costPrice: prod.unit_price,
          providerType: 'G2BULK' as const,
          providerProductId: prod.id.toString(),
          supplierId: prod.supplier_id || 'G2BULK',
          catalogKey: item.uniqueKey,
          packageAmount: item.amount,
          packageType: item.type,
          badge: classifyPackage(prod, idx, gameMeta.slug),
          stock: prod.stock >= 0 ? prod.stock : -1,
          status: 'active' as const,
          sortOrder: idx,
          supportsBoth: item.supportsBoth
        };
      });
      return { gameMeta, gameDoc, replacementGameIds, expectedDocuments };
    });
    const affectedGameIds = syncPlans.flatMap((plan) => plan.replacementGameIds);

    // Preserve provider data on every historical or in-flight order in one
    // batched phase before retiring any package document.
    const existingPackages = await Package.find({ gameId: { $in: affectedGameIds } })
      .session(session)
      .select('_id gameId providerType providerProductId supplierId')
      .lean();
    const referencedPackageIds = await Order.distinct('packageId', {
      packageId: { $in: existingPackages.map((pkg) => pkg._id) },
      $or: [
        { providerProductId: { $exists: false } },
        { providerProductId: '' },
        { providerProductId: null }
      ]
    }).session(session);
    const referencedPackageIdSet = new Set(referencedPackageIds.map((id) => String(id)));
    const orderSnapshotOps = existingPackages
      .filter((existingPackage) => referencedPackageIdSet.has(String(existingPackage._id)))
      .map((existingPackage) => ({
        updateMany: {
          filter: {
            packageId: existingPackage._id,
            $or: [
              { providerProductId: { $exists: false } },
              { providerProductId: '' },
              { providerProductId: null }
            ]
          },
          update: {
            $set: {
              providerType: existingPackage.providerType,
              providerProductId: existingPackage.providerProductId,
              supplierId: existingPackage.supplierId || 'G2BULK'
            }
          }
        }
      }));
    for (let start = 0; start < orderSnapshotOps.length; start += bulkBatchSize) {
      await Order.bulkWrite(orderSnapshotOps.slice(start, start + bulkBatchSize), { session, ordered: true });
    }
    logger.info(`Snapshotted provider data for orders referencing ${orderSnapshotOps.length} retiring packages.`);

    const deleteResult = await Package.deleteMany({ gameId: { $in: affectedGameIds } }, { session });
    totalOldDeleted = deleteResult.deletedCount || 0;
    logger.info(`Deleted ${totalOldDeleted} existing packages across ${syncPlans.length} game(s).`);

    const allExpectedDocuments = syncPlans.flatMap((plan) => plan.expectedDocuments);
    const packageInsertOps = allExpectedDocuments.map((document) => ({ insertOne: { document } }));
    for (let start = 0; start < packageInsertOps.length; start += bulkBatchSize) {
      const batch = packageInsertOps.slice(start, start + bulkBatchSize);
      await Package.bulkWrite(batch, { session, ordered: true });
      logger.info(`Imported catalog batch ${Math.floor(start / bulkBatchSize) + 1}: ${batch.length} packages.`);
    }
    totalNewImported = allExpectedDocuments.length;

    const dbPackages = await Package.find({ gameId: { $in: affectedGameIds } })
      .session(session)
      .select('gameId title catalogKey packageAmount packageType price costPrice supplierId providerType providerProductId status')
      .lean();
    for (const plan of syncPlans) {
      const expectedSnapshot: CatalogPackageSnapshot[] = plan.expectedDocuments.map((pkg) => ({
        title: pkg.title,
        catalogKey: pkg.catalogKey,
        packageAmount: pkg.packageAmount,
        packageType: pkg.packageType,
        price: pkg.price,
        costPrice: pkg.costPrice,
        supplierId: pkg.supplierId,
        providerType: pkg.providerType,
        providerProductId: pkg.providerProductId,
        status: pkg.status
      }));
      const actualSnapshot: CatalogPackageSnapshot[] = dbPackages
        .filter((pkg) => String(pkg.gameId) === String(plan.gameDoc._id))
        .map((pkg) => ({
          title: pkg.title,
          catalogKey: pkg.catalogKey || '',
          packageAmount: pkg.packageAmount || '',
          packageType: pkg.packageType || '',
          price: pkg.price,
          costPrice: pkg.costPrice,
          supplierId: pkg.supplierId || '',
          providerType: pkg.providerType,
          providerProductId: pkg.providerProductId,
          status: pkg.status
        }));
      const validation = compareCatalogSnapshots(expectedSnapshot, actualSnapshot);
      totalMissing += validation.missing.length;
      totalExtra += validation.extra.length;
      if (hasCatalogValidationErrors(validation)) {
        throw new ValidationError(
          `Sync validation failed for ${plan.gameMeta.title}.\n` +
          `Missing Packages: ${validation.missing.join(', ') || 'None'}\n` +
          `Extra Packages: ${validation.extra.join(', ') || 'None'}\n` +
          `Duplicate Packages: ${validation.duplicates.join(', ') || 'None'}\n` +
          `Mismatched Packages: ${validation.mismatches.join(', ') || 'None'}`
        );
      }
      logger.info(`Exact package validation PASSED for game: ${plan.gameMeta.title}.`);
    }

    // Commit Transaction
    const syncFinishedTime = new Date();
    const finalDbCount = await Package.countDocuments({ gameId: { $in: affectedGameIds } }).session(session);
    if (finalDbCount !== totalNewImported) {
      throw new ValidationError(`Final database count (${finalDbCount}) does not match latest catalog count (${totalNewImported}).`);
    }

    await session.commitTransaction();
    await session.endSession();
    session = null;
    logger.info('MongoDB transaction committed successfully.');

    // Generate Sync Report
    const report = `
========== G2Bulk Sync Report ==========
Sync Started: ${formatDate(syncStartTime)}
Sync Finished: ${formatDate(syncFinishedTime)}

Old Packages Deleted:
${totalOldDeleted}

New Packages Imported:
${totalNewImported}

Duplicate Packages Removed:
${totalDuplicatesRemoved}

Missing Packages:
${totalMissing}

Extra Packages:
${totalExtra}

Final Database Count:
${finalDbCount}

Latest Catalog Count:
${totalNewImported}

Validation:
PASSED

Transaction:
COMMITTED

Status:
SUCCESS
========================================`;
    logger.info(report);
    console.log(report);

    const reportData: CatalogSyncReport = {
      syncStarted: syncStartTime.toISOString(),
      syncFinished: syncFinishedTime.toISOString(),
      status: 'SUCCESS',
      oldPackagesDeleted: totalOldDeleted,
      newPackagesImported: totalNewImported,
      duplicatePackagesRemoved: totalDuplicatesRemoved,
      missingPackages: totalMissing,
      extraPackages: totalExtra,
      finalDatabaseCount: finalDbCount,
      latestCatalogCount: totalNewImported,
      validation: 'PASSED',
      transaction: 'COMMITTED'
    };
    finalReport = reportData;

    // The catalog is already safely committed at this point. Persisting the
    // operator-facing report is best effort and must never turn a successful
    // catalog transaction into a reported rollback.
    try {
      await Settings.updateOne(
        { isSyncing: true, catalogSyncToken: syncToken },
        {
          $set: {
            catalogSyncStatus: 'success',
            catalogSyncFinishedAt: syncFinishedTime,
            catalogSyncLastReport: reportData,
            catalogSyncLastError: ''
          }
        }
      );
    } catch (reportError: any) {
      logger.error(`Catalog committed, but the sync report could not be persisted: ${reportError.message}`);
    }

    return reportData;

  } catch (error: any) {
    // Rollback Transaction
    if (session) {
      try {
        if (session.inTransaction()) await session.abortTransaction();
        await session.endSession();
      } catch (abortErr) {
        logger.error('Failed to abort transaction:', abortErr);
      }
      session = null;
      logger.error('MongoDB transaction rolled back due to synchronization error. Database UNCHANGED.');
    }

    const syncFinishedTime = new Date();
    const report = `
========== G2Bulk Sync Report ==========
Sync Started: ${formatDate(syncStartTime)}
Sync Finished: ${formatDate(syncFinishedTime)}

Status:
FAILED

Reason:
${error.message}

Transaction:
ROLLED BACK

Database:
UNCHANGED
========================================`;
    logger.error(report);
    console.log(report);

    if (lockAcquired) {
      const reportData: CatalogSyncReport = {
        syncStarted: syncStartTime.toISOString(),
        syncFinished: syncFinishedTime.toISOString(),
        status: 'FAILED',
        oldPackagesDeleted: totalOldDeleted,
        newPackagesImported: totalNewImported,
        duplicatePackagesRemoved: totalDuplicatesRemoved,
        missingPackages: totalMissing,
        extraPackages: totalExtra,
        finalDatabaseCount: 0,
        latestCatalogCount: totalNewImported,
        validation: 'FAILED',
        transaction: 'ROLLED BACK',
        database: 'UNCHANGED',
        reason: error.message
      };
      finalReport = reportData;
      try {
        await Settings.updateOne(
          { isSyncing: true, catalogSyncToken: syncToken },
          {
            $set: {
              catalogSyncStatus: 'failed',
              catalogSyncFinishedAt: syncFinishedTime,
              catalogSyncLastReport: reportData,
              catalogSyncLastError: error.message
            }
          }
        );
      } catch (reportError: any) {
        logger.error(`Failed to persist the rolled-back sync report: ${reportError.message}`);
      }
    }
    throw error;
  } finally {
    // Only the process that owns the lock may release it. Retry transient
    // failures so the storefront is not left locked after commit or rollback.
    if (lockAcquired) {
      let unlocked = false;
      for (let attempt = 1; attempt <= 3 && !unlocked; attempt++) {
        try {
          const completionUpdate: Record<string, any> = { isSyncing: false };
          if (finalReport) {
            completionUpdate.catalogSyncStatus = finalReport.status === 'SUCCESS' ? 'success' : 'failed';
            completionUpdate.catalogSyncFinishedAt = new Date(finalReport.syncFinished);
            completionUpdate.catalogSyncLastReport = finalReport;
            completionUpdate.catalogSyncLastError = finalReport.reason || '';
          }
          const result = await Settings.findOneAndUpdate(
            { isSyncing: true, catalogSyncToken: syncToken },
            {
              $set: completionUpdate,
              $unset: { catalogSyncToken: '', catalogSyncStartedAt: '' }
            },
            { new: true }
          );
          unlocked = Boolean(result);
          if (!unlocked) logger.error(`Catalog lock release attempt ${attempt} did not match the owning token.`);
        } catch (unlockErr: any) {
          logger.error(`Catalog lock release attempt ${attempt} failed: ${unlockErr.message}`);
        }
        if (!unlocked && attempt < 3) await new Promise((resolve) => setTimeout(resolve, attempt * 250));
      }
      if (unlocked) {
        logger.info('Platform synchronization lock disabled (isSyncing = false). APIs unlocked.');
      } else {
        logger.error(`CRITICAL: Catalog lock owned by token ${syncToken} could not be released automatically.`);
      }
    }
    logger.info(`G2Bulk Sync Finished: ${formatDate(new Date())}`);
  }
};

if (require.main === module) {
  const gameSlugs = process.argv
    .slice(2)
    .filter((argument) => argument.startsWith('--game='))
    .map((argument) => argument.slice('--game='.length));
  syncG2BulkCatalog({ gameSlugs })
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
