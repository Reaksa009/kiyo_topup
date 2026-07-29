import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import { connectDatabase } from './config/database';
import { env } from './config/env';
import { Role, Admin } from './models/Admin';
import { Category, Game, Package } from './models/Game';
import { Banner, Coupon } from './models/CMS';
import { Settings } from './models/System';
import { logger } from './utils/logger';

export const seedDatabase = async () => {
  try {
    if (mongoose.connection.readyState === 0) {
      await connectDatabase();
    }
    logger.info('Starting Database Seeding...');

    // 1. Roles
    let superAdminRole = await Role.findOne({ name: 'Super Admin' });
    if (!superAdminRole) {
      superAdminRole = await Role.create({
        name: 'Super Admin',
        description: 'Full system access and privileges',
        permissions: ['*'],
        isSystem: true
      });
      logger.info('Created Super Admin Role');
    }

    // 2. Admin User
    const existingAdmin = await Admin.findOne({ email: env.SEED_ADMIN_EMAIL });
    if (!existingAdmin) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(env.SEED_ADMIN_PASSWORD, salt);
      await Admin.create({
        name: 'KIYO Super Admin',
        email: env.SEED_ADMIN_EMAIL,
        passwordHash,
        roleId: superAdminRole._id,
        status: 'active'
      });
      logger.info(`Created Super Admin user (${env.SEED_ADMIN_EMAIL})`);
    }

    // 3. Categories
    const categoriesData = [
      { name: 'MOBA', slug: 'moba', icon: 'Swords', sortOrder: 1 },
      { name: 'Battle Royale', slug: 'battle-royale', icon: 'Target', sortOrder: 2 },
      { name: 'Tactical Shooter', slug: 'tactical-shooter', icon: 'Crosshair', sortOrder: 3 },
      { name: 'Action RPG', slug: 'action-rpg', icon: 'Shield', sortOrder: 4 }
    ];

    const categoryMap = new Map<string, mongoose.Types.ObjectId>();

    for (const cat of categoriesData) {
      const created = await Category.findOneAndUpdate(
        { slug: cat.slug },
        cat,
        { upsert: true, new: true }
      );
      categoryMap.set(cat.slug, created._id as mongoose.Types.ObjectId);
    }
    logger.info('Seeded Game Categories');

    // 4. Supported Games & Dynamic Input Field Schemas with G2Bulk Package Offerings
    const gamesData = [
      {
        title: 'Mobile Legends: Bang Bang',
        slug: 'mobile-legends',
        publisher: 'Moonton',
        thumbnail: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80',
        bannerUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80',
        categorySlug: 'moba',
        isPopular: true,
        isFlashSale: true,
        inputFields: [
          { name: 'playerId', label: 'Player ID', placeholder: 'e.g. 12345678', type: 'text', required: true, regexPattern: '^[0-9]{5,12}$', helpText: 'Found in your profile avatar header' },
          { name: 'serverId', label: 'Server ID', placeholder: 'e.g. 1234', type: 'text', required: true, regexPattern: '^[0-9]{4,6}$', helpText: '4-5 digit number inside brackets' }
        ],
        instructions: 'Enter your Player ID and Server ID located under your MLBB profile page.',
        // Dynamic G2Bulk Packages (Cheapest Regional Variant Selected per Denomination)
        packages: [
          { title: 'Weekly Diamond Pass', price: 1.85, costPrice: 1.45, badge: 'EVENT / PASS', providerProductId: 'G2B-MLBB-WEEKLY-PASS', stock: -1 },
          { title: '86 Diamonds (78 + 8 Bonus)', price: 1.25, costPrice: 0.95, badge: 'BEST SELLER', providerProductId: 'G2B-MLBB-86D', stock: -1 },
          { title: '172 Diamonds (156 + 16 Bonus)', price: 2.45, costPrice: 1.88, badge: 'NORMAL', providerProductId: 'G2B-MLBB-172D', stock: -1 },
          { title: '257 Diamonds (234 + 23 Bonus)', price: 3.65, costPrice: 2.82, badge: 'BEST SELLER', providerProductId: 'G2B-MLBB-257D', stock: -1 },
          { title: '344 Diamonds (312 + 32 Bonus)', price: 4.85, costPrice: 3.75, badge: 'NORMAL', providerProductId: 'G2B-MLBB-344D', stock: -1 },
          { title: '429 Diamonds (390 + 39 Bonus)', price: 6.10, costPrice: 4.70, badge: 'NORMAL', providerProductId: 'G2B-MLBB-429D', stock: -1 },
          { title: '514 Diamonds (468 + 46 Bonus)', price: 7.30, costPrice: 5.65, badge: 'BEST VALUE', providerProductId: 'G2B-MLBB-514D', stock: -1 },
          { title: '706 Diamonds (625 + 81 Bonus)', price: 9.80, costPrice: 7.75, badge: 'BEST SELLER', providerProductId: 'G2B-MLBB-706D', stock: -1 },
          { title: '878 Diamonds (781 + 97 Bonus)', price: 12.20, costPrice: 9.60, badge: 'NORMAL', providerProductId: 'G2B-MLBB-878D', stock: -1 },
          { title: '963 Diamonds (859 + 104 Bonus)', price: 13.40, costPrice: 10.50, badge: 'NORMAL', providerProductId: 'G2B-MLBB-963D', stock: -1 },
          { title: '1412 Diamonds (1250 + 162 Bonus)', price: 19.50, costPrice: 15.20, badge: 'BEST VALUE', providerProductId: 'G2B-MLBB-1412D', stock: -1 },
          { title: '2195 Diamonds (1860 + 335 Bonus)', price: 29.50, costPrice: 23.80, badge: 'BEST SELLER', providerProductId: 'G2B-MLBB-2195D', stock: -1 },
          { title: '3688 Diamonds (3099 + 589 Bonus)', price: 49.00, costPrice: 39.50, badge: 'EVENT / FLASH SALE', providerProductId: 'G2B-MLBB-3688D', stock: -1 },
          { title: '5532 Diamonds (4649 + 883 Bonus)', price: 73.50, costPrice: 59.00, badge: 'MEGA DEAL', providerProductId: 'G2B-MLBB-5532D', stock: -1 },
          { title: '9288 Diamonds (7740 + 1548 Bonus)', price: 122.00, costPrice: 98.00, badge: 'EVENT / VIP', providerProductId: 'G2B-MLBB-9288D', stock: -1 }
        ]
      },
      {
        title: 'Free Fire',
        slug: 'free-fire',
        publisher: 'Garena',
        thumbnail: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=600&q=80',
        bannerUrl: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=1200&q=80',
        categorySlug: 'battle-royale',
        isPopular: true,
        isFlashSale: false,
        inputFields: [
          { name: 'playerId', label: 'Player ID (UID)', placeholder: 'e.g. 987654321', type: 'text', required: true, regexPattern: '^[0-9]{8,12}$', helpText: 'Your numeric Garena Free Fire account UID' }
        ],
        instructions: 'Copy your numeric Player ID from the top left profile card in Free Fire.',
        packages: [
          { title: 'Weekly Membership Pass', price: 2.10, costPrice: 1.65, badge: 'EVENT / PASS', providerProductId: 'G2B-FF-WEEKLY', stock: -1 },
          { title: 'Monthly Membership Pass', price: 8.50, costPrice: 6.90, badge: 'EVENT / PASS', providerProductId: 'G2B-FF-MONTHLY', stock: -1 },
          { title: '100 Diamonds (+10 Bonus)', price: 0.99, costPrice: 0.78, badge: 'BEST SELLER', providerProductId: 'G2B-FF-100D', stock: -1 },
          { title: '210 Diamonds (+21 Bonus)', price: 1.99, costPrice: 1.55, badge: 'NORMAL', providerProductId: 'G2B-FF-210D', stock: -1 },
          { title: '530 Diamonds (+53 Bonus)', price: 4.80, costPrice: 3.85, badge: 'BEST SELLER', providerProductId: 'G2B-FF-530D', stock: -1 },
          { title: '1080 Diamonds (+108 Bonus)', price: 9.50, costPrice: 7.60, badge: 'BEST VALUE', providerProductId: 'G2B-FF-1080D', stock: -1 },
          { title: '2200 Diamonds (+220 Bonus)', price: 19.00, costPrice: 15.20, badge: 'NORMAL', providerProductId: 'G2B-FF-2200D', stock: -1 },
          { title: '4450 Diamonds (+445 Bonus)', price: 38.00, costPrice: 30.50, badge: 'EVENT / FLASH SALE', providerProductId: 'G2B-FF-4450D', stock: -1 }
        ]
      },
      {
        title: 'PUBG Mobile',
        slug: 'pubg-mobile',
        publisher: 'Tencent Games',
        thumbnail: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=600&q=80',
        bannerUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1200&q=80',
        categorySlug: 'battle-royale',
        isPopular: true,
        isFlashSale: true,
        inputFields: [
          { name: 'playerId', label: 'Character ID', placeholder: 'e.g. 5123456789', type: 'text', required: true, regexPattern: '^[0-9]{8,12}$', helpText: 'Numeric PUBG Character ID' }
        ],
        instructions: 'Find your Character ID at top left in your PUBG Mobile game lobby.',
        packages: [
          { title: '60 UC', price: 0.99, costPrice: 0.82, badge: 'BEST SELLER', providerProductId: 'G2B-PUBG-60UC', stock: -1 },
          { title: '325 UC (300 + 25 Bonus)', price: 4.80, costPrice: 3.90, badge: 'BEST SELLER', providerProductId: 'G2B-PUBG-325UC', stock: -1 },
          { title: '660 UC (600 + 60 Bonus)', price: 9.50, costPrice: 7.70, badge: 'NORMAL', providerProductId: 'G2B-PUBG-660UC', stock: -1 },
          { title: '1800 UC (1500 + 300 Bonus)', price: 24.00, costPrice: 19.50, badge: 'BEST VALUE', providerProductId: 'G2B-PUBG-1800UC', stock: -1 },
          { title: '3850 UC (3000 + 850 Bonus)', price: 48.00, costPrice: 39.00, badge: 'EVENT / FLASH SALE', providerProductId: 'G2B-PUBG-3850UC', stock: -1 },
          { title: '8100 UC (6000 + 2100 Bonus)', price: 95.00, costPrice: 77.00, badge: 'MEGA DEAL', providerProductId: 'G2B-PUBG-8100UC', stock: -1 }
        ]
      },
      {
        title: 'Valorant',
        slug: 'valorant',
        publisher: 'Riot Games',
        thumbnail: 'https://images.unsplash.com/photo-1560253023-3ec5d502959f?auto=format&fit=crop&w=600&q=80',
        bannerUrl: 'https://images.unsplash.com/photo-1560253023-3ec5d502959f?auto=format&fit=crop&w=1200&q=80',
        categorySlug: 'tactical-shooter',
        isPopular: true,
        isFlashSale: false,
        inputFields: [
          { name: 'riotId', label: 'Riot ID', placeholder: 'e.g. PlayerName#TAG', type: 'text', required: true, helpText: 'Full Riot ID including tagline' }
        ],
        instructions: 'Provide your complete Riot ID tag (e.g. KiyoPro#SEA).',
        packages: [
          { title: '475 Valorant Points', price: 4.80, costPrice: 3.95, badge: 'NORMAL', providerProductId: 'G2B-VAL-475VP', stock: -1 },
          { title: '1000 Valorant Points', price: 9.80, costPrice: 7.90, badge: 'BEST SELLER', providerProductId: 'G2B-VAL-1000VP', stock: -1 },
          { title: '2050 Valorant Points', price: 19.50, costPrice: 15.80, badge: 'BEST SELLER', providerProductId: 'G2B-VAL-2050VP', stock: -1 },
          { title: '3650 Valorant Points', price: 34.00, costPrice: 27.50, badge: 'BEST VALUE', providerProductId: 'G2B-VAL-3650VP', stock: -1 },
          { title: '5350 Valorant Points', price: 49.00, costPrice: 39.80, badge: 'EVENT / FLASH SALE', providerProductId: 'G2B-VAL-5350VP', stock: -1 },
          { title: '11000 Valorant Points', price: 98.00, costPrice: 79.00, badge: 'MEGA DEAL', providerProductId: 'G2B-VAL-11000VP', stock: -1 }
        ]
      },
      {
        title: 'Honor of Kings',
        slug: 'honor-of-kings',
        publisher: 'Level Infinite',
        thumbnail: 'https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?auto=format&fit=crop&w=600&q=80',
        bannerUrl: 'https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?auto=format&fit=crop&w=1200&q=80',
        categorySlug: 'moba',
        isPopular: true,
        isFlashSale: true,
        inputFields: [
          { name: 'uid', label: 'Game UID', placeholder: 'e.g. 1002345678', type: 'text', required: true, helpText: 'Found in HOK Game Settings -> Account' }
        ],
        instructions: 'Check your HOK in-game profile for your unique account UID.',
        packages: [
          { title: 'Weekly Card Pass', price: 1.20, costPrice: 0.92, badge: 'EVENT / PASS', providerProductId: 'G2B-HOK-WEEKLY', stock: -1 },
          { title: '80 Tokens (+8 Bonus)', price: 1.15, costPrice: 0.88, badge: 'BEST SELLER', providerProductId: 'G2B-HOK-80T', stock: -1 },
          { title: '240 Tokens (+24 Bonus)', price: 3.40, costPrice: 2.65, badge: 'NORMAL', providerProductId: 'G2B-HOK-240T', stock: -1 },
          { title: '400 Tokens (+40 Bonus)', price: 5.60, costPrice: 4.40, badge: 'BEST SELLER', providerProductId: 'G2B-HOK-400T', stock: -1 },
          { title: '800 Tokens (+80 Bonus)', price: 11.20, costPrice: 8.80, badge: 'BEST VALUE', providerProductId: 'G2B-HOK-800T', stock: -1 },
          { title: '2400 Tokens (+240 Bonus)', price: 33.00, costPrice: 26.00, badge: 'EVENT / FLASH SALE', providerProductId: 'G2B-HOK-2400T', stock: -1 }
        ]
      },
      {
        title: 'Call of Duty: Mobile',
        slug: 'cod-mobile',
        publisher: 'Activision',
        thumbnail: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=600&q=80',
        bannerUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=1200&q=80',
        categorySlug: 'tactical-shooter',
        isPopular: false,
        isFlashSale: false,
        inputFields: [
          { name: 'openId', label: 'Open ID', placeholder: 'e.g. 678912345678', type: 'text', required: true, helpText: 'CODM Open ID in Settings -> Legal & Privacy' }
        ],
        instructions: 'Copy your Open ID from CODM Settings tab.',
        packages: [
          { title: '80 CP', price: 1.10, costPrice: 0.85, badge: 'NORMAL', providerProductId: 'G2B-CODM-80CP', stock: -1 },
          { title: '420 CP', price: 5.50, costPrice: 4.25, badge: 'BEST SELLER', providerProductId: 'G2B-CODM-420CP', stock: -1 },
          { title: '880 CP', price: 11.00, costPrice: 8.60, badge: 'BEST VALUE', providerProductId: 'G2B-CODM-880CP', stock: -1 },
          { title: '2400 CP', price: 28.00, costPrice: 22.00, badge: 'EVENT / FLASH SALE', providerProductId: 'G2B-CODM-2400CP', stock: -1 }
        ]
      },
      {
        title: 'Blood Strike',
        slug: 'blood-strike',
        publisher: 'NetEase Games',
        thumbnail: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80',
        bannerUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80',
        categorySlug: 'tactical-shooter',
        isPopular: false,
        isFlashSale: false,
        inputFields: [
          { name: 'userCode', label: 'User Code', placeholder: 'e.g. BS998877', type: 'text', required: true }
        ],
        instructions: 'Enter your Blood Strike User ID Code.',
        packages: [
          { title: '100 Gold', price: 1.10, costPrice: 0.85, badge: 'NORMAL', providerProductId: 'G2B-BS-100G', stock: -1 },
          { title: '500 Gold (+50 Bonus)', price: 5.20, costPrice: 4.10, badge: 'BEST SELLER', providerProductId: 'G2B-BS-500G', stock: -1 },
          { title: '1000 Gold (+120 Bonus)', price: 10.20, costPrice: 8.00, badge: 'BEST VALUE', providerProductId: 'G2B-BS-1000G', stock: -1 }
        ]
      },
      {
        title: 'Delta Force',
        slug: 'delta-force',
        publisher: 'Team Jade',
        thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
        bannerUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
        categorySlug: 'tactical-shooter',
        isPopular: false,
        isFlashSale: false,
        inputFields: [
          { name: 'playerTag', label: 'Player Tag', placeholder: 'e.g. DF-100293', type: 'text', required: true }
        ],
        instructions: 'Enter your Delta Force account Tag.',
        packages: [
          { title: '60 Delta Coins', price: 0.99, costPrice: 0.78, badge: 'NORMAL', providerProductId: 'G2B-DF-60C', stock: -1 },
          { title: '300 Delta Coins', price: 4.80, costPrice: 3.80, badge: 'BEST SELLER', providerProductId: 'G2B-DF-300C', stock: -1 },
          { title: '680 Delta Coins', price: 9.80, costPrice: 7.80, badge: 'BEST VALUE', providerProductId: 'G2B-DF-680C', stock: -1 }
        ]
      }
    ];

    // Load scraped MLBB packages dynamically if JSON file is available
    const jsonPath = 'C:\\Users\\ASUS\\.gemini\\antigravity-ide\\brain\\57bc3757-cde8-4cee-a608-3e66d7230189\\scratch\\mlbb_denominations.json';
    if (fs.existsSync(jsonPath)) {
      try {
        const rawData = fs.readFileSync(jsonPath, 'utf8');
        const { mobile_legends_global, mobile_legends } = JSON.parse(rawData);
        
        const cheapestMap = new Map();
        const processItem = (item: any, source: string) => {
          const key = item.diamonds.toString().toLowerCase().trim();
          const existing = cheapestMap.get(key);
          
          const inGlobal = mobile_legends_global.some((g: any) => g.diamonds.toString().toLowerCase().trim() === key);
          const inStandard = mobile_legends.some((s: any) => s.diamonds.toString().toLowerCase().trim() === key);
          const supportsBoth = inGlobal && inStandard;

          if (!existing || item.price < existing.price || (item.price === existing.price && source === 'Mobile Legends' && existing.source === 'Global')) {
            cheapestMap.set(key, { ...item, source, supportsBoth });
          } else {
            if (supportsBoth) {
              existing.supportsBoth = true;
            }
          }
        };
        mobile_legends_global.forEach((item: any) => processItem(item, 'Global'));
        mobile_legends.forEach((item: any) => processItem(item, 'Mobile Legends'));
        
        const deduplicatedList = Array.from(cheapestMap.values()).sort((a, b) => {
          const aIsNum = !isNaN(Number(a.diamonds));
          const bIsNum = !isNaN(Number(b.diamonds));
          if (!aIsNum && bIsNum) return -1;
          if (aIsNum && !bIsNum) return 1;
          if (!aIsNum && !bIsNum) return a.diamonds.toString().localeCompare(b.diamonds.toString());
          return Number(a.diamonds) - Number(b.diamonds);
        });

        const dynamicPackages = deduplicatedList.map((item) => {
          const costPrice = item.price;
          const retailPrice = parseFloat((costPrice * 1.18).toFixed(2));
          
          let title = '';
          let badge = 'NORMAL';
          const diamondsStr = item.diamonds.toString().toLowerCase();
          
          if (diamondsStr.includes('weekly') || diamondsStr.includes('monthly') || diamondsStr.includes('twilight') || diamondsStr.includes('pass') || diamondsStr.includes('pack')) {
            const rawTitle = item.diamonds.toString().trim();
            if (rawTitle.toLowerCase() === 'weekly') {
              title = 'Weekly Diamond Pass';
            } else if (rawTitle.toLowerCase() === 'twilight') {
              title = 'Twilight Pass';
            } else if (rawTitle.toLowerCase() === 'monthly') {
              title = 'Monthly Pass';
            } else {
              title = rawTitle;
            }
            badge = 'EVENT / PASS';
          } else {
            title = `${item.diamonds} Diamonds`;
            const count = Number(item.diamonds);
            if (count === 85 || count === 86 || count === 240 || count === 257 || count === 706 || count === 2195) {
              badge = 'BEST SELLER';
            } else if (costPrice > 10.0) {
              badge = 'BEST VALUE';
            }
          }

          return {
            title,
            price: Math.max(0.25, retailPrice),
            costPrice,
            badge,
            providerProductId: item.denomId,
            stock: -1,
            supportsBoth: item.supportsBoth,
            description: `${title} (Automated Instant Top-up | Source: G2Bulk ${item.source}${item.supportsBoth ? ' | Supports Global & Regular Servers' : ''})`
          };
        });

        gamesData[0].packages = dynamicPackages;
        (gamesData[0] as any).duplicatesRemoved = (mobile_legends_global.length + mobile_legends.length) - dynamicPackages.length;
        logger.info(`Loaded ${dynamicPackages.length} dynamic G2Bulk MLBB packages into seeder`);
      } catch (err: any) {
        logger.error('Failed to parse MLBB scraped JSON in seeder:', err.message);
      }
    }

    for (const g of gamesData) {
      const categoryId = categoryMap.get(g.categorySlug);
      const gameDoc = await Game.findOneAndUpdate(
        { slug: g.slug },
        {
          title: g.title,
          slug: g.slug,
          publisher: g.publisher,
          thumbnail: g.thumbnail,
          bannerUrl: g.bannerUrl,
          categoryId,
          inputFields: g.inputFields,
          instructions: g.instructions,
          isPopular: g.isPopular,
          isFlashSale: g.isFlashSale,
          status: 'active'
        },
        { upsert: true, new: true }
      );

      const oldCount = await Package.countDocuments({ gameId: gameDoc._id });

      // Seed / Update Packages for Game (Clean replacement - delete old packages first)
      await Package.deleteMany({ gameId: gameDoc._id });
      logger.info(`Cleaned all existing packages for ${gameDoc.title} before importing new ones.`);
      
      let sortIdx = 0;
      for (const p of g.packages) {
        await Package.create(
          {
            gameId: gameDoc._id,
            title: p.title,
            price: p.price,
            costPrice: p.costPrice,
            badge: p.badge,
            providerType: 'G2BULK',
            providerProductId: p.providerProductId,
            stock: p.stock,
            status: 'active',
            sortOrder: sortIdx++,
            supportsBoth: (p as any).supportsBoth,
            description: (p as any).description
          });
      }

      const finalCount = await Package.countDocuments({ gameId: gameDoc._id });
      if (g.slug === 'mobile-legends') {
        const matchesCatalog = finalCount === g.packages.length ? 'YES' : 'NO';
        
        logger.info('================================================================');
        logger.info('           MOBILE LEGENDS CATALOG REPLACEMENT REPORT            ');
        logger.info('================================================================');
        logger.info(`- Old packages deleted: ${oldCount}`);
        logger.info(`- New packages imported: ${g.packages.length}`);
        logger.info(`- Duplicate packages removed: ${(g as any).duplicatesRemoved || 0}`);
        logger.info(`- Final package count: ${finalCount}`);
        logger.info(`- Matches G2Bulk catalog: ${matchesCatalog}`);
        logger.info('================================================================');

        if (matchesCatalog === 'NO') {
          throw new Error(`Sync validation failed: Final package count (${finalCount}) does not match catalog count (${g.packages.length}).`);
        }
      }
    }
    logger.info('Seeded Games & Packages with G2Bulk cheapest pricing & badge tags');

    // 5. Seed Banners & Coupons
    await Banner.findOneAndUpdate(
      { title: 'Cyber Gaming Summer Top-Up Sale' },
      {
        title: 'Cyber Gaming Summer Top-Up Sale',
        imageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80',
        linkUrl: '/game/mobile-legends',
        position: 'hero',
        active: true
      },
      { upsert: true }
    );

    await Coupon.findOneAndUpdate(
      { code: 'KIYO2026' },
      {
        code: 'KIYO2026',
        discountType: 'percentage',
        discountValue: 10,
        maxUses: 500,
        minOrderAmount: 1.0,
        expiryDate: new Date('2027-12-31'),
        active: true
      },
      { upsert: true }
    );

    // 6. Settings
    let settings = await Settings.findOne();
    if (!settings) {
      await Settings.create({
        platformName: 'KIYO TOPUP',
        logoUrl: '/logo.png',
        maintenanceMode: false,
        contactEmail: 'support@kiyotopup.com',
        contactTelegram: '@VReaksa'
      });
    }

    logger.info('Database Seeding Complete Successfully!');
  } catch (error) {
    logger.error('Error seeding database:', error);
  }
};

if (require.main === module) {
  seedDatabase().then(() => process.exit(0));
}
