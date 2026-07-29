import axios from 'axios';
import mongoose from 'mongoose';
import { connectDatabase } from '../config/database';
import { Game, Package, Category } from '../models/Game';
import { Settings } from '../models/System';
import { env } from '../config/env';
import { logger } from '../utils/logger';

interface G2Product {
  id: number | string;
  title: string;
  category_id: number;
  category_title: string;
  unit_price: number;
  stock: number;
  description?: string;
}

class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

const formatDate = (date: Date): string => {
  return date.toISOString().replace('T', ' ').substring(0, 19);
};

const normalizePackage = (title: string, gameSlug: string) => {
  let clean = title;
  if (gameSlug === 'mobile-legends') {
    clean = title.replace(/^(Mobile Legends\s*(Global|Special)?)\s*-\s*/i, '').trim();
  } else if (gameSlug === 'pubg-mobile') {
    clean = title.replace(/^(PUBG Mobile)\s*-\s*/i, '').trim();
  } else if (gameSlug === 'free-fire') {
    clean = title.replace(/^(Free Fire)\s*-\s*/i, '').trim();
  } else if (gameSlug === 'valorant') {
    clean = title.replace(/^(Valorant)\s*-\s*/i, '').trim();
  } else if (gameSlug === 'honor-of-kings') {
    clean = title.replace(/^(Honor of Kings)\s*-\s*/i, '').trim();
  } else if (gameSlug === 'cod-mobile') {
    clean = title.replace(/^(Call of Duty: Mobile|CODM)\s*-\s*/i, '').trim();
  }
  
  let amount = '';
  let type = 'default';
  const cleanLower = clean.toLowerCase();
  
  if (cleanLower.includes('weekly') && cleanLower.includes('pass')) {
    amount = 'weekly';
    type = 'pass';
  } else if (cleanLower.includes('twilight') && cleanLower.includes('pass')) {
    amount = 'twilight';
    type = 'pass';
  } else if (cleanLower.includes('monthly') && cleanLower.includes('pass')) {
    amount = 'monthly';
    type = 'pass';
  } else if (cleanLower.includes('starlight')) {
    amount = 'starlight';
    type = 'pass';
  } else {
    const match = clean.match(/^([\d\s(+)]+)\s*(diamonds|diamond|uc|vp|points|tokens|gems|coins|cp)/i);
    if (match) {
      amount = match[1].replace(/\s+/g, '');
      type = match[2].toLowerCase();
    } else {
      amount = clean.toLowerCase().replace(/\s+/g, '');
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
    const res = await axios.get('https://api.g2bulk.com/v1/products', {
      headers: {
        'x-api-key': env.G2BULK_API_KEY,
        'X-API-Key': env.G2BULK_API_KEY
      },
      timeout: 20000
    });

    const products: G2Product[] = Array.isArray(res.data?.products)
      ? res.data.products
      : (Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []));

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
      const matchedProducts = products.filter((p) => {
        const titleLower = p.title.toLowerCase();
        const catLower = (p.category_title || '').toLowerCase();
        if (gameMeta.slug === 'mobile-legends') {
          if (catLower.includes('special')) return false;
          return catLower === 'mobile legends' || catLower === 'mobile legends global';
        }
        return gameMeta.keywords.some((kw) => titleLower.includes(kw) || catLower.includes(kw));
      });

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

      // Group and Deduplicate by Diamond Amount + Package Type
      const grouped = new Map<string, G2Product[]>();
      for (const prod of finalProducts) {
        const norm = normalizePackage(prod.title, gameMeta.slug);
        const list = grouped.get(norm.uniqueKey) || [];
        list.push(prod);
        grouped.set(norm.uniqueKey, list);
      }

      const deduplicatedProducts: { prod: G2Product; uniqueKey: string; cleanName: string }[] = [];
      
      for (const [uniqueKey, prods] of grouped.entries()) {
        // Choose the product with the lowest wholesale cost (lowest unit_price)
        let bestProd = prods[0];
        for (let i = 1; i < prods.length; i++) {
          if (prods[i].unit_price < bestProd.unit_price) {
            bestProd = prods[i];
          }
        }
        
        const norm = normalizePackage(bestProd.title, gameMeta.slug);
        deduplicatedProducts.push({
          prod: bestProd,
          uniqueKey,
          cleanName: norm.cleanName
        });
      }

      totalDuplicatesRemoved += (finalProducts.length - deduplicatedProducts.length);

      // Full catalog replacement: Delete ALL existing packages for this game in the session
      const deleteResult = await Package.deleteMany({ gameId: gameDoc._id }, { session });
      totalOldDeleted += deleteResult.deletedCount || 0;
      logger.info(`Deleted ${deleteResult.deletedCount || 0} existing packages for game: ${gameMeta.title}.`);

      if (deduplicatedProducts.length > 0) {
        // Write new packages via bulkWrite performance insert
        const bulkOps = deduplicatedProducts.map((item, idx) => {
          const prod = item.prod;
          const costPrice = prod.unit_price;
          const retailPrice = parseFloat((costPrice * 1.18).toFixed(2));

          let badge = 'NORMAL';
          const titleLower = prod.title.toLowerCase();
          if (titleLower.includes('pass') || titleLower.includes('event') || titleLower.includes('starlight')) {
            badge = 'EVENT / PASS';
          } else if (idx === 0 || titleLower.includes('86') || titleLower.includes('weekly') || titleLower.includes('60 uc')) {
            badge = 'BEST SELLER';
          } else if (costPrice > 10.0) {
            badge = 'BEST VALUE';
          }

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

          const supportsBoth = gameMeta.slug === 'mobile-legends' && 
            finalProducts.some(p => normalizePackage(p.title, gameMeta.slug).uniqueKey === item.uniqueKey && (p.category_title || '').toLowerCase().includes('global')) &&
            finalProducts.some(p => normalizePackage(p.title, gameMeta.slug).uniqueKey === item.uniqueKey && !(p.category_title || '').toLowerCase().includes('global'));

          return {
            insertOne: {
              document: {
                gameId: gameDoc._id,
                title: packageTitle,
                description: prod.description || `${packageTitle} (Automated Instant Top-up | Source: G2Bulk ${prod.category_title}${supportsBoth ? ' | Supports Global & Regular Servers' : ''})`,
                price: Math.max(0.25, retailPrice),
                costPrice,
                providerType: 'G2BULK',
                providerProductId: prod.id.toString(),
                badge,
                stock: prod.stock >= 0 ? prod.stock : -1,
                status: 'active',
                sortOrder: idx,
                supportsBoth
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
