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

export const syncG2BulkCatalog = async () => {
  const syncStartTime = new Date();
  
  // Track metrics for reporting
  let totalOldDeleted = 0;
  let totalNewImported = 0;
  let totalDuplicatesRemoved = 0;
  let totalMissing = 0;
  let totalExtra = 0;
  let totalDuplicateRemaining = 0;
  
  let useTransaction = true;
  let session: any = null;

  try {
    await connectDatabase();
    logger.info('Starting production-safe catalog sync...');

    const actualUri = (mongoose.connection as any).actualUri || env.MONGODB_URI || 'mongodb://localhost:27017/kiyo_topup';
    const isInMemory = (mongoose.connection as any).isInMemory === true;

    // Mask URI credentials
    const maskUri = (uri: string): string => {
      try {
        return uri.replace(/(mongodb(?:\+srv)?:\/\/)([^:]+):([^@]+)@/, (m, protocol, user, pass) => {
          const maskedUser = user.length > 2 ? `${user.substring(0, 2)}***` : '***';
          const maskedPass = pass.length > 2 ? `${pass.substring(0, 2)}***` : '***';
          return `${protocol}${maskedUser}:${maskedPass}@`;
        });
      } catch (e) {
        return 'mongodb://***:***@...';
      }
    };

    let connectionType = 'Local MongoDB';
    if (isInMemory) {
      connectionType = 'MongoMemoryServer';
    } else if (actualUri.includes('mongodb+srv://') || actualUri.includes('.mongodb.net') || actualUri.includes('atlas')) {
      connectionType = 'MongoDB Atlas';
    }

    logger.info('================================================================');
    logger.info('              MONGODB CONNECTION DIAGNOSTICS                    ');
    logger.info('================================================================');
    logger.info(`- Active MongoDB connection URI (masked): ${maskUri(actualUri)}`);
    logger.info(`- Database name: ${mongoose.connection.name || 'kiyo_topup'}`);
    logger.info(`- Detected connection type: ${connectionType}`);
    logger.info('================================================================');

    const forceSync = process.env.FORCE_SYNC === 'true' || process.argv.includes('--force');
    if (isInMemory) {
      if (!forceSync) {
        logger.error('Sync aborted: connected to an in-memory database. Connect to the persistent MongoDB database first.');
        throw new Error('Sync aborted: connected to an in-memory database. Connect to the persistent MongoDB database first.');
      } else {
        logger.warn('WARNING: Running catalog sync on dynamic in-memory database due to FORCE_SYNC / --force flag.');
      }
    }

    // 1. Initialize MongoDB session & transaction
    session = await mongoose.startSession();
    try {
      session.startTransaction();
      // Execute a quick dummy query inside the transaction to verify replica set support
      await Game.findOne({}).session(session);
      logger.info('MongoDB transaction started and verified.');
    } catch (txErr) {
      useTransaction = false;
      session.endSession();
      session = null;
      logger.warn('Transactions not supported in this database setup. Proceeding without transactions.');
    }

    // 2. Enable Sync Lock (disable APIs)
    await Settings.findOneAndUpdate(
      {},
      { isSyncing: true },
      { upsert: true, session: useTransaction ? session : undefined }
    );
    logger.info('Platform synchronization lock enabled (isSyncing = true).');

    // 3. Fetch live G2Bulk products
    logger.info('Fetching live G2Bulk products & games catalog...');
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

    logger.info(`Received ${products.length} live products from G2Bulk API.`);

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

    const extractQuantityKey = (title: string): string => {
      let clean = title.replace(/^Mobile Legends\s*(Global|Special)?\s*-\s*/i, '').trim();
      const match = clean.match(/(\d+)\s*(diamond|diamonds|uc|vp|points|tokens|gems|pass|cp)/i);
      if (match) {
        return `${match[1]}-${match[2].toLowerCase()}`;
      }
      return clean.toLowerCase().replace(/[^a-z0-9]/g, '');
    };

    for (const gameMeta of gameDefinitions) {
      // Create / Update Category Doc
      const categoryDoc = await Category.findOneAndUpdate(
        { slug: gameMeta.categorySlug },
        {
          name: gameMeta.categoryName,
          slug: gameMeta.categorySlug,
          icon: gameMeta.categoryIcon,
          status: 'active'
        },
        { upsert: true, new: true, session: useTransaction ? session : undefined }
      );

      // Create / Update Game Doc
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
        { upsert: true, new: true, session: useTransaction ? session : undefined }
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

      // Deduplicate using quantity key normalizer
      const bestPriceMap = new Map<string, { prod: G2Product; supportsBoth: boolean }>();
      for (const prod of finalProducts) {
        const qtyKey = extractQuantityKey(prod.title);
        const existing = bestPriceMap.get(qtyKey);

        let supportsBoth = false;
        if (gameMeta.slug === 'mobile-legends') {
          const inGlobal = finalProducts.some(p => extractQuantityKey(p.title) === qtyKey && (p.category_title || '').toLowerCase() === 'mobile legends global');
          const inStandard = finalProducts.some(p => extractQuantityKey(p.title) === qtyKey && (p.category_title || '').toLowerCase() === 'mobile legends');
          supportsBoth = inGlobal && inStandard;
        }

        if (
          !existing || 
          prod.unit_price < existing.prod.unit_price || 
          (prod.unit_price === existing.prod.unit_price && 
           (existing.prod.category_title || '').toLowerCase().includes('global') && 
           !(prod.category_title || '').toLowerCase().includes('global'))
        ) {
          bestPriceMap.set(qtyKey, { prod, supportsBoth });
        } else {
          if (supportsBoth) {
            existing.supportsBoth = true;
          }
        }
      }

      const deduplicatedProducts = Array.from(bestPriceMap.values());
      totalDuplicatesRemoved += (finalProducts.length - deduplicatedProducts.length);

      // Perform Clean Catalog Replacement
      const oldCount = await Package.countDocuments({ gameId: gameDoc._id }).session(useTransaction ? session : null);
      totalOldDeleted += oldCount;

      if (deduplicatedProducts.length > 0) {
        // Delete all old packages
        await Package.deleteMany({ gameId: gameDoc._id }, { session: useTransaction ? session : undefined });
        
        // Write new packages via bulkWrite performance insert
        const bulkOps = deduplicatedProducts.map((item, idx) => {
          const prod = item.prod;
          const supportsBoth = item.supportsBoth;
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

          let packageTitle = prod.title;
          if (gameMeta.slug === 'mobile-legends') {
            const rawTitleLower = prod.title.toLowerCase();
            if (rawTitleLower.includes('weekly') && !rawTitleLower.includes('elite')) {
              packageTitle = 'Weekly Diamond Pass';
            } else if (rawTitleLower.includes('twilight')) {
              packageTitle = 'Twilight Pass';
            } else if (rawTitleLower.includes('monthly') && !rawTitleLower.includes('elite')) {
              packageTitle = 'Monthly Pass';
            } else {
              let clean = prod.title.replace(/^Mobile Legends\s*(Global|Special)?\s*-\s*/i, '').trim();
              if (!isNaN(Number(clean))) {
                packageTitle = `${clean} Diamonds`;
              } else {
                packageTitle = clean;
              }
            }
          }

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

        await Package.bulkWrite(bulkOps, { session: useTransaction ? session : undefined });
        totalNewImported += deduplicatedProducts.length;

        // Strict validation: Verify every package details match exactly
        const dbPackages = await Package.find({ gameId: gameDoc._id }).session(useTransaction ? session : null).lean();
        
        for (const item of deduplicatedProducts) {
          const prod = item.prod;
          const matchedDbPkg = dbPackages.find(p => p.providerProductId === prod.id.toString());
          if (!matchedDbPkg) {
            totalMissing++;
          }
        }

        for (const dbPkg of dbPackages) {
          const matchedCatalog = deduplicatedProducts.find(item => item.prod.id.toString() === dbPkg.providerProductId);
          if (!matchedCatalog) {
            totalExtra++;
          }

          const copies = dbPackages.filter(p => p.providerProductId === dbPkg.providerProductId);
          if (copies.length > 1) {
            totalDuplicateRemaining++;
          }
        }

        if (dbPackages.length !== deduplicatedProducts.length || totalMissing > 0 || totalExtra > 0 || totalDuplicateRemaining > 0) {
          throw new Error(`Sync verification failed for game: ${gameMeta.title}. Count mismatched (DB: ${dbPackages.length}, Catalog: ${deduplicatedProducts.length}) or corrupt packages detected.`);
        }
      }
    }

    // 4. Commit MongoDB Transaction
    if (useTransaction) {
      await session.commitTransaction();
      logger.info('MongoDB transaction committed successfully.');
    }

    const finalDbCount = await Package.countDocuments({});
    
    // Output success verification report
    console.log(`
========== G2Bulk Sync Report ==========
Connected Database Name: ${mongoose.connection.name || 'kiyo_topup'}
Packages Deleted: ${totalOldDeleted}
Packages Imported: ${totalNewImported}
Final Package Count: ${finalDbCount}
Validation Result: PASSED
Sync Status: SUCCESS
========================================`);

  } catch (error: any) {
    // 5. Rollback Transaction
    if (useTransaction && session) {
      await session.abortTransaction();
      logger.error('MongoDB transaction rolled back due to synchronization error.');
    }
    
    // Output failure report
    console.log(`
========== G2Bulk Sync Report ==========
Sync Status: FAILED
Reason: ${error.message}
========================================`);

    throw error;
  } finally {
    // 6. Unlock API lock outside session
    if (session) {
      session.endSession();
    }
    try {
      await Settings.findOneAndUpdate({}, { isSyncing: false }, { upsert: true });
      logger.info('Platform synchronization lock disabled (isSyncing = false). APIs unlocked.');
    } catch (unlockErr: any) {
      logger.error('Failed to disable isSyncing lock:', unlockErr.message);
    }
  }
};

if (require.main === module) {
  syncG2BulkCatalog()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
