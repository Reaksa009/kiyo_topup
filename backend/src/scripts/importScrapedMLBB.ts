import fs from 'fs';
import path from 'path';
import { connectDatabase } from '../config/database';
import { Game, Package, Category } from '../models/Game';
import { logger } from '../utils/logger';

interface DenomItem {
  denomId: string;
  diamonds: number | string;
  price: number;
}

export const importScrapedMLBB = async () => {
  try {
    await connectDatabase();
    logger.info('Connected to MongoDB for importing scraped MLBB denominations...');

    const jsonPath = 'C:\\Users\\ASUS\\.gemini\\antigravity-ide\\brain\\57bc3757-cde8-4cee-a608-3e66d7230189\\scratch\\mlbb_denominations.json';
    if (!fs.existsSync(jsonPath)) {
      throw new Error(`Scraped JSON not found at path: ${jsonPath}`);
    }

    const rawData = fs.readFileSync(jsonPath, 'utf8');
    const { mobile_legends_global, mobile_legends } = JSON.parse(rawData) as {
      mobile_legends_global: DenomItem[];
      mobile_legends: DenomItem[];
    };

    logger.info(`Loaded ${mobile_legends_global.length} Global and ${mobile_legends.length} Standard denominations.`);

    // Find or create Category for MOBA
    let categoryDoc = await Category.findOne({ slug: 'moba' });
    if (!categoryDoc) {
      categoryDoc = await Category.create({
        name: 'MOBA',
        slug: 'moba',
        icon: 'Swords',
        status: 'active'
      });
    }

    // Find or create Game for Mobile Legends
    let gameDoc = await Game.findOne({ slug: 'mobile-legends' });
    if (!gameDoc) {
      gameDoc = await Game.create({
        title: 'Mobile Legends: Bang Bang',
        slug: 'mobile-legends',
        publisher: 'Moonton',
        thumbnail: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80',
        bannerUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80',
        categoryId: categoryDoc._id,
        isPopular: true,
        isFlashSale: true,
        inputFields: [
          { name: 'playerId', label: 'Player ID', placeholder: 'e.g. 12345678', type: 'text', required: true, helpText: 'Found in profile avatar header' },
          { name: 'serverId', label: 'Server ID', placeholder: 'e.g. 1234', type: 'text', required: true, helpText: '4-5 digit number inside brackets' }
        ],
        instructions: 'Enter Player ID and Server ID.',
        status: 'active'
      });
    }

    // Map to group and de-duplicate by diamonds count / pass name
    // Storing the item with the CHEAPEST costPrice (G2Bulk price)
    const cheapestMap = new Map<string, { denomId: string; diamonds: number | string; price: number; source: string; supportsBoth: boolean }>();

    const processItem = (item: DenomItem, source: string) => {
      const key = item.diamonds.toString().toLowerCase().trim();
      const existing = cheapestMap.get(key);
      
      const inGlobal = mobile_legends_global.some(g => g.diamonds.toString().toLowerCase().trim() === key);
      const inStandard = mobile_legends.some(s => s.diamonds.toString().toLowerCase().trim() === key);
      const supportsBoth = inGlobal && inStandard;

      if (!existing || item.price < existing.price || (item.price === existing.price && source === 'Mobile Legends' && existing.source === 'Global')) {
        cheapestMap.set(key, { ...item, source, supportsBoth });
      } else {
        if (supportsBoth) {
          existing.supportsBoth = true;
        }
      }
    };

    mobile_legends_global.forEach(item => processItem(item, 'Global'));
    mobile_legends.forEach(item => processItem(item, 'Mobile Legends'));

    const deduplicatedList = Array.from(cheapestMap.values()).sort((a, b) => {
      // Sort: text passes first, then numeric counts ascending
      const aIsNum = !isNaN(Number(a.diamonds));
      const bIsNum = !isNaN(Number(b.diamonds));
      if (!aIsNum && bIsNum) return -1;
      if (aIsNum && !bIsNum) return 1;
      if (!aIsNum && !bIsNum) return a.diamonds.toString().localeCompare(b.diamonds.toString());
      return Number(a.diamonds) - Number(b.diamonds);
    });

    logger.info(`Deduplicated to ${deduplicatedList.length} unique cheapest MLBB packages. Storing to database...`);

    // Clean existing G2BULK packages for Mobile Legends to ensure no stale configuration remains
    await Package.deleteMany({ gameId: gameDoc._id, providerType: 'G2BULK' });
    logger.info('Cleaned old G2BULK packages for Mobile Legends.');

    for (let i = 0; i < deduplicatedList.length; i++) {
      const item = deduplicatedList[i];
      const costPrice = item.price;
      const retailPrice = parseFloat((costPrice * 1.18).toFixed(2)); // +18% Margin

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

      await Package.create({
        gameId: gameDoc._id,
        title,
        price: Math.max(0.25, retailPrice),
        costPrice,
        providerType: 'G2BULK',
        providerProductId: item.denomId,
        badge,
        stock: -1,
        status: 'active',
        sortOrder: i,
        supportsBoth: item.supportsBoth,
        description: `${title} (Automated Instant Top-up | Source: G2Bulk ${item.source}${item.supportsBoth ? ' | Supports Global & Regular Servers' : ''})`
      });
    }

    logger.info('================================================================');
    logger.info(`Successfully imported ${deduplicatedList.length} packages into Cloud DB.`);
    logger.info('================================================================');
  } catch (error) {
    logger.error('Error importing MLBB denominations:', error);
  }
};

if (require.main === module) {
  importScrapedMLBB().then(() => process.exit(0));
}
