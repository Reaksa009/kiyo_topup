import axios from 'axios';
import mongoose from 'mongoose';
import { connectDatabase } from '../config/database';
import { Game, Package, Category } from '../models/Game';
import { Settings } from '../models/System';
import { env } from '../config/env';
import { logger } from '../utils/logger';

export interface G2Product {
  id: number | string;
  title: string;
  category_id?: number | string;
  category_title: string;
  unit_price: number;
  stock: number;
  description?: string;
}

export interface GameCatalogMatchDefinition {
  slug: string;
  keywords: string[];
  categoryAliases?: string[];
}

const GAME_IDENTITY_ALIASES: Record<string, string[]> = {
  'mobile-legends': ['mobile legends', 'mobile legends global', 'mlbb'],
  'pubg-mobile': ['pubg mobile', 'pubg'],
  'free-fire': ['free fire', 'freefire', 'garena free fire'],
  valorant: ['valorant'],
  'honor-of-kings': ['honor of kings', 'hok'],
  'cod-mobile': ['call of duty mobile', 'call of duty: mobile', 'cod mobile', 'codm'],
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
  const id = raw?.id ?? raw?.product_id ?? raw?.productId ?? raw?.service_id ?? raw?.serviceId;
  const title = raw?.title ?? raw?.name ?? raw?.product_name ?? raw?.service_name;
  const category = raw?.category_title ?? raw?.category ?? raw?.category_name ?? raw?.game ?? '';
  const unitPrice = Number(raw?.unit_price ?? raw?.unitPrice ?? raw?.price ?? raw?.cost ?? raw?.wholesale_price);
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
    stock: Number.isFinite(stockValue) ? stockValue : -1,
    description: raw?.description ? String(raw.description) : undefined
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

export const productMatchesGame = (product: G2Product, definition: GameCatalogMatchDefinition): boolean => {
  const title = normalizeText(product.title);
  const category = normalizeText(product.category_title);
  const aliases = (definition.categoryAliases || definition.keywords).map(normalizeText).filter(Boolean);
  return aliases.some((alias) => category === alias || category.startsWith(`${alias} `) || title.includes(alias));
};

export interface SelectedCatalogProduct {
  prod: G2Product;
  uniqueKey: string;
  cleanName: string;
  supportsBoth: boolean;
}

export const selectCheapestProducts = (products: G2Product[], gameSlug: string): SelectedCatalogProduct[] => {
  const grouped = new Map<string, G2Product[]>();
  for (const product of products) {
    const normalized = normalizePackage(product.title, gameSlug);
    const list = grouped.get(normalized.uniqueKey) || [];
    list.push(product);
    grouped.set(normalized.uniqueKey, list);
  }

  return Array.from(grouped.entries()).map(([uniqueKey, variants]) => {
    const best = variants.reduce((current, candidate) =>
      candidate.unit_price < current.unit_price ? candidate : current
    );
    const supportsBoth = gameSlug === 'mobile-legends' && variants.length > 0;
    return {
      prod: best,
      uniqueKey,
      cleanName: normalizePackage(best.title, gameSlug).cleanName,
      supportsBoth
    };
  });
};

const EVENT_PATTERN = /weekly|monthly|twilight|starlight|membership|battle\s*pass|event|season|limited|royale|pass/i;

export const classifyPackage = (product: G2Product, index: number, gameSlug: string): string => {
  const title = normalizeText(product.title);
  if (EVENT_PATTERN.test(title)) return 'EVENT / PASS';

  const bestsellerAmounts: Record<string, string[]> = {
    'mobile-legends': ['86', '257', '706', '2195'],
    'pubg-mobile': ['60 uc', '325 uc'],
    'free-fire': ['100 diamonds', '530 diamonds'],
    valorant: ['1000 vp', '2050 vp']
  };
  const known = bestsellerAmounts[gameSlug] || [];
  if (known.some((amount) => title.includes(normalizeText(amount))) || /best\s*seller|popular|recommended/i.test(title)) {
    return 'BEST SELLER';
  }
  return index === 0 ? 'BEST SELLER' : 'NORMAL';
};

class ValidationError extends Error {
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
    clean = clean.replace(/^(Mobile Legends(?:\s+(?:Global|Special))?)\s*[-:|]\s*/i, '').trim();
  } else if (gameSlug === 'pubg-mobile') {
    clean = clean.replace(/^(PUBG Mobile|PUBG)\s*[-:|]\s*/i, '').trim();
  } else if (gameSlug === 'free-fire') {
    clean = clean.replace(/^(Free Fire|FreeFire)\s*[-:|]\s*/i, '').trim();
  } else if (gameSlug === 'valorant') {
    clean = clean.replace(/^Valorant\s*[-:|]\s*/i, '').trim();
  } else if (gameSlug === 'honor-of-kings') {
    clean = clean.replace(/^Honor of Kings\s*[-:|]\s*/i, '').trim();
  } else if (gameSlug === 'cod-mobile') {
    clean = clean.replace(/^(Call of Duty: Mobile|CODM)\s*[-:|]\s*/i, '').trim();
  } else if (gameSlug === 'blood-strike') {
    clean = clean.replace(/^Blood\s*Strike\s*[-:|]\s*/i, '').trim();
  } else if (gameSlug === 'delta-force') {
    clean = clean.replace(/^Delta\s*Force\s*[-:|]\s*/i, '').trim();
  }
  
  let amount = '';
  let type = 'default';
  const cleanLower = clean.toLowerCase();
  
  if (cleanLower.includes('weekly')) {
    amount = 'weekly';
    type = 'pass';
  } else if (cleanLower.includes('twilight')) {
    amount = 'twilight';
    type = 'pass';
  } else if (cleanLower.includes('monthly')) {
    amount = 'monthly';
    type = 'pass';
  } else if (cleanLower.includes('starlight')) {
    amount = 'starlight';
    type = 'pass';
  } else {
    const match = clean.match(/^(?:[^\d]*)([\d][\d\s,().+]*?)\s*(?:delta\s+)?(diamonds?|uc|vp|points?|tokens?|gems?|gold|credits?|coins?|cp)\b/i);
    if (match) {
      amount = match[1].replace(/[\s,().+]/g, '');
      type = match[2].toLowerCase();
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

export const syncG2BulkCatalog = async () => {
  const syncStartTime = new Date();
  logger.info(`G2Bulk Sync Started: ${formatDate(syncStartTime)}`);

  // Track metrics for report
  let totalOldDeleted = 0;
  let totalNewImported = 0;
  let totalDuplicatesRemoved = 0;
  let totalMissing = 0;
  let totalExtra = 0;

  let session: mongoose.ClientSession | null = null;

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

    // Start MongoDB session and transaction
    session = await mongoose.startSession();
    session.startTransaction();
    logger.info('MongoDB transaction started.');

    // Enable sync lock
    await Settings.findOneAndUpdate(
      {},
      { isSyncing: true },
      { upsert: true, session }
    );
    logger.info('Sync lock enabled (isSyncing = true). Package/checkout APIs disabled.');

    // Fetch live G2Bulk catalog
    logger.info('Fetching catalog from G2Bulk API...');
    const catalogUrl = `${env.G2BULK_API_URL.replace(/\/$/, '')}/products`;
    const res = await axios.get(catalogUrl, {
      headers: {
        'x-api-key': env.G2BULK_API_KEY,
        'X-API-Key': env.G2BULK_API_KEY
      },
      timeout: 20000
    });

    const products = normalizeG2Products(res.data);

    logger.info(`Fetched ${products.length} catalog items from G2Bulk API.`);

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
        title: 'Free Fire',
        publisher: 'Garena',
        categoryName: 'Battle Royale',
        categorySlug: 'battle-royale',
        categoryIcon: 'Target',
        thumbnail: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=400&q=75',
        bannerUrl: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=800&q=75',
        keywords: ['free fire', 'diamond', 'garena'],
        inputFields: [
          { name: 'playerId', label: 'Player ID (UID)', placeholder: 'e.g. 987654321', type: 'text', required: true, helpText: 'Numeric Character UID' }
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

    for (const gameMeta of gameDefinitions) {
      // Create/Update Category
      const categoryDoc = await Category.findOneAndUpdate(
        { slug: gameMeta.categorySlug },
        {
          name: gameMeta.categoryName,
          slug: gameMeta.categorySlug,
          icon: gameMeta.categoryIcon,
          status: 'active'
        },
        { upsert: true, new: true, session }
      );

      // Create/Update Game
      const gameDoc = await Game.findOneAndUpdate(
        { slug: gameMeta.slug },
        {
          title: gameMeta.title,
          slug: gameMeta.slug,
          publisher: gameMeta.publisher,
          thumbnail: gameMeta.thumbnail,
          bannerUrl: gameMeta.bannerUrl,
          categoryId: categoryDoc._id,
          inputFields: gameMeta.inputFields,
          status: 'active',
          isPopular: true
        },
        { upsert: true, new: true, session }
      );

      // Filter products for this game
      const matchedProducts = products.filter((product) => productMatchesGame(product, {
        slug: gameMeta.slug,
        keywords: gameMeta.keywords,
        categoryAliases: GAME_IDENTITY_ALIASES[gameMeta.slug] || gameMeta.keywords
      }));

      // Sandbox Fallback
      let finalProducts = matchedProducts;
      if (gameMeta.slug === 'mobile-legends' && matchedProducts.length === 0) {
        const jsonPath = 'C:\\Users\\ASUS\\.gemini\\antigravity-ide\\brain\\57bc3757-cde8-4cee-a608-3e66d7230189\\scratch\\mlbb_denominations.json';
        const fs = require('fs');
        if (fs.existsSync(jsonPath)) {
          const rawData = fs.readFileSync(jsonPath, 'utf8');
          const { mobile_legends_global, mobile_legends } = JSON.parse(rawData);
          const mappedStandard = mobile_legends.map((item: any) => ({
            id: item.denomId,
            title: `Mobile Legends - ${item.diamonds}`,
            category_title: 'Mobile Legends',
            unit_price: item.price,
            stock: -1
          }));
          const mappedGlobal = mobile_legends_global.map((item: any) => ({
            id: item.denomId,
            title: `Mobile Legends Global - ${item.diamonds}`,
            category_title: 'Mobile Legends Global',
            unit_price: item.price,
            stock: -1
          }));
          finalProducts = [...mappedStandard, ...mappedGlobal];
        }
      }

      if (finalProducts.length === 0) {
        logger.warn(`No G2Bulk products matched ${gameMeta.title}; existing packages were preserved.`);
        continue;
      }

      // Group by denomination/event and keep exactly one cheapest provider product.
      // For MLBB, one selected product is intentionally shared by regular and Global servers.
      const deduplicatedProducts = selectCheapestProducts(finalProducts, gameMeta.slug);

      totalDuplicatesRemoved += (finalProducts.length - deduplicatedProducts.length);

      // Full catalog replacement: Delete ALL existing packages for this game in the session
      const deleteResult = await Package.deleteMany({ gameId: gameDoc._id }, { session });
      totalOldDeleted += deleteResult.deletedCount || 0;
      logger.info(`Deleted ${deleteResult.deletedCount || 0} existing packages for game: ${gameMeta.title}.`);

      if (deduplicatedProducts.length > 0) {
        // Write new packages via bulkWrite performance insert
        const orderedProducts = [...deduplicatedProducts].sort((a, b) => a.prod.unit_price - b.prod.unit_price);
        const bulkOps = orderedProducts.map((item, idx) => {
          const prod = item.prod;
          const costPrice = prod.unit_price;
          const retailPrice = parseFloat((costPrice * 1.18).toFixed(2));

          const badge = classifyPackage(prod, idx, gameMeta.slug);

          let packageTitle = item.cleanName;
          if (gameMeta.slug === 'mobile-legends') {
            const rawTitleLower = prod.title.toLowerCase();
            if (rawTitleLower.includes('weekly') && !rawTitleLower.includes('elite')) {
              packageTitle = 'Weekly Diamond Pass';
            } else if (rawTitleLower.includes('twilight')) {
              packageTitle = 'Twilight Pass';
            } else if (rawTitleLower.includes('monthly') && !rawTitleLower.includes('elite')) {
              packageTitle = 'Monthly Pass';
            } else {
              if (!isNaN(Number(item.cleanName))) {
                packageTitle = `${item.cleanName} Diamonds`;
              }
            }
          }

          return {
            insertOne: {
              document: {
                gameId: gameDoc._id,
                title: packageTitle,
                description: prod.description || `${packageTitle} (Automated Instant Top-up | Source: G2Bulk ${prod.category_title}${item.supportsBoth ? ' | Supports Global & Regular Servers' : ''})`,
                price: Math.max(0.25, retailPrice),
                costPrice,
                providerType: 'G2BULK',
                providerProductId: prod.id.toString(),
                badge,
                stock: prod.stock >= 0 ? prod.stock : -1,
                status: 'active',
                sortOrder: idx,
                supportsBoth: item.supportsBoth
              }
            }
          };
        });

        await Package.bulkWrite(bulkOps, { session });
        totalNewImported += deduplicatedProducts.length;
        logger.info(`Imported ${deduplicatedProducts.length} packages for game: ${gameMeta.title}.`);

        // Strict verification: Verify every single package matches exactly
        const dbPackages = await Package.find({ gameId: gameDoc._id }).session(session).lean();
        
        let localMissing = 0;
        let localExtra = 0;
        let localDuplicates = 0;
        
        const missingList: string[] = [];
        const extraList: string[] = [];
        const duplicateList: string[] = [];

        for (const item of deduplicatedProducts) {
          const prod = item.prod;
          const expectedPrice = Math.max(0.25, parseFloat((prod.unit_price * 1.18).toFixed(2)));
          
          const matches = dbPackages.filter(p => p.providerProductId === prod.id.toString());
          if (matches.length === 0) {
            localMissing++;
            missingList.push(`${item.cleanName} (ID: ${prod.id})`);
          } else {
            if (matches.length > 1) {
              localDuplicates += (matches.length - 1);
              duplicateList.push(`${item.cleanName} (ID: ${prod.id})`);
            }
            
            const dbPkg = matches[0];
            const priceDiff = Math.abs(dbPkg.price - expectedPrice);
            const costDiff = Math.abs(dbPkg.costPrice - prod.unit_price);
            
            // Check Package Name, Diamond Amount, Selling Price, Supplier ID (providerType), Supplier Product ID
            if (priceDiff > 0.01 || costDiff > 0.01 || dbPkg.providerType !== 'G2BULK' || dbPkg.providerProductId !== prod.id.toString()) {
              throw new ValidationError(`Validation values mismatch for product ${item.cleanName} (ID: ${prod.id})`);
            }
          }
        }

        for (const dbPkg of dbPackages) {
          const matchedCatalog = deduplicatedProducts.find(item => item.prod.id.toString() === dbPkg.providerProductId);
          if (!matchedCatalog) {
            localExtra++;
            extraList.push(`${dbPkg.title} (ID: ${dbPkg.providerProductId})`);
          }
        }

        totalMissing += localMissing;
        totalExtra += localExtra;
        totalDuplicatesRemoved += localDuplicates;

        if (localMissing > 0 || localExtra > 0 || localDuplicates > 0) {
          throw new ValidationError(
            `Sync validation failed for game ${gameMeta.title}.\n` +
            `Missing: ${missingList.join(', ') || 'None'}\n` +
            `Extra: ${extraList.join(', ') || 'None'}\n` +
            `Duplicates: ${duplicateList.join(', ') || 'None'}`
          );
        }
        
        logger.info(`Validation PASSED for game: ${gameMeta.title}.`);
      }
    }

    // Commit Transaction
    const syncFinishedTime = new Date();
    const finalDbCount = await Package.countDocuments({}).session(session);

    await session.commitTransaction();
    session.endSession();
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
    console.log(report);

  } catch (error: any) {
    // Rollback Transaction
    if (session) {
      try {
        await session.abortTransaction();
        session.endSession();
      } catch (abortErr) {
        logger.error('Failed to abort transaction:', abortErr);
      }
      session = null;
      logger.error('MongoDB transaction rolled back due to synchronization error. Database UNCHANGED.');
    }

    const report = `
========== G2Bulk Sync Report ==========
Status:
FAILED

Reason:
${error.message}

Transaction:
ROLLED BACK

Database:
UNCHANGED
========================================`;
    console.log(report);
    throw error;
  } finally {
    // Unlock sync lock outside the transaction
    try {
      await Settings.findOneAndUpdate({}, { isSyncing: false }, { upsert: true });
      logger.info('Platform synchronization lock disabled (isSyncing = false). APIs unlocked.');
    } catch (unlockErr: any) {
      logger.error('Failed to disable isSyncing lock in finally block:', unlockErr.message);
    }
  }
};

if (require.main === module) {
  syncG2BulkCatalog()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
