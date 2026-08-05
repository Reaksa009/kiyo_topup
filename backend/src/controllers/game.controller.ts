import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Game, Category, Package } from '../models/Game';
import { AuditService } from '../services/audit.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { ProviderFactory } from '../services/providers/ProviderFactory';
import { gameUpdateSchema } from '../validation/catalog.schemas';
import { toPublicGameDTO, toPublicPackageDTO } from '../utils/publicCatalog';

// Fallback Game Dataset for Instant Sub-5ms Responses
const fallbackGames = [
  {
    _id: '507f1f77bcf86cd799439011',
    title: 'Mobile Legends: Bang Bang',
    slug: 'mobile-legends',
    publisher: 'Moonton',
    thumbnail: '/images/mlbb-card.png',
    bannerUrl: '/images/mlbb-card.png',
    isPopular: true,
    isFlashSale: true,
    status: 'active',
    inputFields: [
      { name: 'playerId', label: 'Player ID', placeholder: 'e.g. 563087296', type: 'text', required: true, helpText: 'Found in your profile avatar header' },
      { name: 'serverId', label: 'Server ID', placeholder: 'e.g. 3484', type: 'text', required: true, helpText: '4-5 digit number inside brackets' }
    ],
    instructions: 'Enter your Player ID and Server ID located under your MLBB profile page.'
  },
  {
    _id: '507f1f77bcf86cd799439012',
    title: 'Free Fire Global',
    slug: 'free-fire',
    publisher: 'Garena',
    thumbnail: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=400&q=75',
    bannerUrl: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=800&q=75',
    isPopular: true,
    isFlashSale: false,
    status: 'active',
    inputFields: [
      { name: 'playerId', label: 'Player ID (UID)', placeholder: 'e.g. 987654321', type: 'text', required: true, helpText: 'Global-region numeric UID. No server ID is required.' }
    ],
    instructions: 'Copy your numeric Player ID from the top left profile card in Free Fire.'
  },
  {
    _id: '507f1f77bcf86cd799439013',
    title: 'PUBG Mobile',
    slug: 'pubg-mobile',
    publisher: 'Tencent Games',
    thumbnail: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=400&q=75',
    bannerUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=75',
    isPopular: true,
    isFlashSale: true,
    status: 'active',
    inputFields: [
      { name: 'playerId', label: 'Character ID', placeholder: 'e.g. 5123456789', type: 'text', required: true, helpText: 'Numeric PUBG Character ID' }
    ],
    instructions: 'Find your Character ID at top left in your PUBG Mobile game lobby.'
  },
  {
    _id: '507f1f77bcf86cd799439014',
    title: 'Valorant',
    slug: 'valorant',
    publisher: 'Riot Games',
    thumbnail: 'https://images.unsplash.com/photo-1560253023-3ec5d502959f?auto=format&fit=crop&w=400&q=75',
    bannerUrl: 'https://images.unsplash.com/photo-1560253023-3ec5d502959f?auto=format&fit=crop&w=800&q=75',
    isPopular: true,
    isFlashSale: false,
    status: 'active',
    inputFields: [
      { name: 'riotId', label: 'Riot ID', placeholder: 'e.g. PlayerName#TAG', type: 'text', required: true, helpText: 'Full Riot ID including tagline' }
    ],
    instructions: 'Provide your complete Riot ID tag (e.g. KiyoPro#SEA).'
  },
  {
    _id: '507f1f77bcf86cd799439015',
    title: 'Honor of Kings',
    slug: 'honor-of-kings',
    publisher: 'Level Infinite',
    thumbnail: 'https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?auto=format&fit=crop&w=400&q=75',
    bannerUrl: 'https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?auto=format&fit=crop&w=800&q=75',
    isPopular: true,
    isFlashSale: true,
    status: 'active',
    inputFields: [
      { name: 'uid', label: 'Game UID', placeholder: 'e.g. 1002345678', type: 'text', required: true, helpText: 'Found in HOK Game Settings -> Account' }
    ],
    instructions: 'Check your HOK in-game profile for your unique account UID.'
  },
  {
    _id: '507f1f77bcf86cd799439016',
    title: 'Call of Duty: Mobile',
    slug: 'cod-mobile',
    publisher: 'Activision',
    thumbnail: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=400&q=75',
    bannerUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=800&q=75',
    isPopular: false,
    isFlashSale: false,
    status: 'active',
    inputFields: [
      { name: 'openId', label: 'Open ID', placeholder: 'e.g. 678912345678', type: 'text', required: true, helpText: 'CODM Open ID in Settings' }
    ],
    instructions: 'Copy your Open ID from CODM Settings tab.'
  },
  {
    _id: '507f1f77bcf86cd799439017',
    title: 'Blood Strike',
    slug: 'blood-strike',
    publisher: 'NetEase Games',
    thumbnail: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=400&q=75',
    bannerUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=75',
    isPopular: false,
    isFlashSale: false,
    status: 'active',
    inputFields: [
      { name: 'userCode', label: 'User Code', placeholder: 'e.g. BS998877', type: 'text', required: true }
    ],
    instructions: 'Enter your Blood Strike User ID Code.'
  },
  {
    _id: '507f1f77bcf86cd799439018',
    title: 'Delta Force',
    slug: 'delta-force',
    publisher: 'Team Jade',
    thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=75',
    bannerUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=75',
    isPopular: false,
    isFlashSale: false,
    status: 'active',
    inputFields: [
      { name: 'playerTag', label: 'Player Tag', placeholder: 'e.g. DF-100293', type: 'text', required: true }
    ],
    instructions: 'Enter your Delta Force account Tag.'
  }
];

const fallbackPackages: Record<string, any[]> = {
  'mobile-legends': [
    { _id: 'p1', title: 'Weekly Diamond Pass', price: 1.85, costPrice: 1.45, badge: 'EVENT / PASS', providerProductId: 'G2B-MLBB-WEEKLY-PASS' },
    { _id: 'p2', title: '86 Diamonds (78 + 8 Bonus)', price: 1.25, costPrice: 0.95, badge: 'BEST SELLER', providerProductId: 'G2B-MLBB-86D' },
    { _id: 'p3', title: '172 Diamonds (156 + 16 Bonus)', price: 2.45, costPrice: 1.88, badge: 'NORMAL', providerProductId: 'G2B-MLBB-172D' },
    { _id: 'p4', title: '257 Diamonds (234 + 23 Bonus)', price: 3.65, costPrice: 2.82, badge: 'BEST SELLER', providerProductId: 'G2B-MLBB-257D' },
    { _id: 'p5', title: '706 Diamonds (625 + 81 Bonus)', price: 9.80, costPrice: 7.75, badge: 'BEST SELLER', providerProductId: 'G2B-MLBB-706D' },
    { _id: 'p6', title: '2195 Diamonds (1860 + 335 Bonus)', price: 29.50, costPrice: 23.80, badge: 'BEST VALUE', providerProductId: 'G2B-MLBB-2195D' }
  ],
  'free-fire': [
    { _id: 'ff1', title: 'Weekly Lite', price: 0.46, costPrice: 0.39, badge: 'EVENT / PASS', providerProductId: '2068' },
    { _id: 'ff2', title: '110 Diamonds', price: 0.96, costPrice: 0.81, badge: 'BEST SELLER', providerProductId: '2055' },
    { _id: 'ff3', title: 'Weekly Membership', price: 1.89, costPrice: 1.60, badge: 'EVENT / PASS', providerProductId: '2067' },
    { _id: 'ff4', title: '341 Diamonds', price: 2.89, costPrice: 2.45, badge: 'NORMAL', providerProductId: '2056' },
    { _id: 'ff5', title: '572 Diamonds', price: 4.70, costPrice: 3.98, badge: 'BEST SELLER', providerProductId: '2057' },
    { _id: 'ff6', title: 'Monthly Membership', price: 6.77, costPrice: 5.74, badge: 'EVENT / PASS', providerProductId: '2065' },
    { _id: 'ff7', title: '1166 Diamonds', price: 9.42, costPrice: 7.98, badge: 'NORMAL', providerProductId: '2063' },
    { _id: 'ff8', title: '2398 Diamonds', price: 18.83, costPrice: 15.96, badge: 'NORMAL', providerProductId: '2050' },
    { _id: 'ff9', title: '6160 Diamonds', price: 47.72, costPrice: 40.44, badge: 'NORMAL', providerProductId: '2058' }
  ],
  'pubg-mobile': [
    { _id: 'pub1', title: '60 UC', price: 0.99, costPrice: 0.82, badge: 'BEST SELLER', providerProductId: 'G2B-PUBG-60UC' },
    { _id: 'pub2', title: '325 UC (300 + 25 Bonus)', price: 4.80, costPrice: 3.90, badge: 'BEST SELLER', providerProductId: 'G2B-PUBG-325UC' },
    { _id: 'pub3', title: '660 UC (600 + 60 Bonus)', price: 9.50, costPrice: 7.70, badge: 'NORMAL', providerProductId: 'G2B-PUBG-660UC' },
    { _id: 'pub4', title: '1800 UC (1500 + 300 Bonus)', price: 24.00, costPrice: 19.50, badge: 'BEST VALUE', providerProductId: 'G2B-PUBG-1800UC' }
  ],
  'valorant': [
    { _id: 'v1', title: '475 Valorant Points', price: 4.80, costPrice: 3.95, badge: 'NORMAL', providerProductId: 'G2B-VAL-475VP' },
    { _id: 'v2', title: '1000 Valorant Points', price: 9.80, costPrice: 7.90, badge: 'BEST SELLER', providerProductId: 'G2B-VAL-1000VP' },
    { _id: 'v3', title: '2050 Valorant Points', price: 19.50, costPrice: 15.80, badge: 'BEST SELLER', providerProductId: 'G2B-VAL-2050VP' }
  ]
};

const PUBLIC_CATALOG_CACHE_TTL_MS = 30000;
const publicCatalogCache = new Map<string, { version: string; expiresAt: number; data: any }>();

const getPublicCatalogCache = (key: string, version: string) => {
  const cached = publicCatalogCache.get(key);
  if (!cached || cached.version !== version || cached.expiresAt <= Date.now()) {
    if (cached) publicCatalogCache.delete(key);
    return null;
  }
  return cached.data;
};

const setPublicCatalogCache = (key: string, version: string, data: any) => {
  publicCatalogCache.set(key, {
    version,
    expiresAt: Date.now() + PUBLIC_CATALOG_CACHE_TTL_MS,
    data
  });
};

export class GameController {
  static async getGames(req: Request, res: Response) {
    // Instant fast return if MongoDB is not connected
    if (mongoose.connection.readyState !== 1) {
      return res.json({ success: true, count: fallbackGames.length, data: fallbackGames.map((game) => toPublicGameDTO({ ...game, isPurchasable: false })) });
    }

    try {
      const catalogVersion = String(res.locals.catalogVersion || 'unknown');
      const cacheKey = Object.keys(req.query).length === 0 ? 'games:all' : '';
      const cachedGames = cacheKey ? getPublicCatalogCache(cacheKey, catalogVersion) : null;
      if (cachedGames) {
        return res.json({ success: true, count: cachedGames.length, data: cachedGames });
      }

      const { category, search, popular, flashSale } = req.query;
      const query: any = { status: 'active' };

      if (category) {
        const cat = await Category.findOne({ slug: category as string });
        if (cat) query.categoryId = cat._id;
      }

      if (search) {
        query.title = { $regex: search as string, $options: 'i' };
      }

      if (popular === 'true') {
        query.isPopular = true;
      }

      if (flashSale === 'true') {
        query.isFlashSale = true;
      }

      let games = await Game.find(query).sort({ sortOrder: 1, createdAt: -1 }).populate('categoryId', 'name slug icon').lean();
      
      if (!games || games.length === 0) {
        games = fallbackGames as any[];
      }

      const publicGames = games.map((game) => toPublicGameDTO(game));
      if (cacheKey) setPublicCatalogCache(cacheKey, catalogVersion, publicGames);

      res.json({ success: true, count: publicGames.length, data: publicGames });
    } catch (error: any) {
      res.json({ success: true, count: fallbackGames.length, data: fallbackGames.map((game) => toPublicGameDTO({ ...game, isPurchasable: false })) });
    }
  }

  static async getGameBySlug(req: Request, res: Response) {
    const targetSlug = (req.params.slug as string) || 'mobile-legends';

    // Instant fast return if MongoDB is not connected
    if (mongoose.connection.readyState !== 1) {
      const foundFallback = fallbackGames.find((g) => g.slug === targetSlug) || fallbackGames[0];
      const rawPackages = fallbackPackages[targetSlug] || fallbackPackages['mobile-legends'];
      const packages = [...rawPackages].sort((a, b) => a.price - b.price).map((pkg) => toPublicPackageDTO(pkg, false));
      return res.json({
        success: true,
        data: {
          game: toPublicGameDTO({ ...foundFallback, isPurchasable: false }),
          packages
        }
      });
    }

    try {
      const catalogVersion = String(res.locals.catalogVersion || 'unknown');
      const cacheKey = `game:${targetSlug}`;
      const cachedDetail = getPublicCatalogCache(cacheKey, catalogVersion);
      if (cachedDetail) {
        return res.json({ success: true, data: cachedDetail });
      }

      let game = await Game.findOne({ slug: targetSlug }).populate('categoryId').lean();
      let packages: any[] = [];

      if (game) {
        packages = await Package.find({ gameId: game._id, status: 'active' })
          .select('_id gameId title description icon price packageAmount packageType discountPercent badge stock status sortOrder supportsBoth')
          .sort({ price: 1 })
          .lean();
      }

      if (!game) {
        const foundFallback = fallbackGames.find((g) => g.slug === targetSlug);
        if (foundFallback) {
          game = { ...foundFallback, isPurchasable: false } as any;
          const rawPackages = fallbackPackages[targetSlug] || fallbackPackages['mobile-legends'];
          packages = [...rawPackages].sort((a, b) => a.price - b.price).map((pkg) => toPublicPackageDTO(pkg, false));
        }
      }

      if (!game) {
        return res.status(404).json({ success: false, message: 'Game not found.' });
      }

      const detail = { game: toPublicGameDTO(game), packages: packages.map((pkg) => toPublicPackageDTO(pkg, (game as any).isPurchasable !== false)) };
      setPublicCatalogCache(cacheKey, catalogVersion, detail);

      res.json({
        success: true,
        data: detail
      });
    } catch (error: any) {
      const foundFallback = fallbackGames.find((g) => g.slug === targetSlug) || fallbackGames[0];
      const rawPackages = fallbackPackages[targetSlug] || fallbackPackages['mobile-legends'];
      const packages = [...rawPackages].sort((a, b) => a.price - b.price).map((pkg) => toPublicPackageDTO(pkg, false));

      res.json({
        success: true,
        data: {
          game: toPublicGameDTO({ ...foundFallback, isPurchasable: false }),
          packages
        }
      });
    }
  }

  static async getCategories(req: Request, res: Response) {
    if (mongoose.connection.readyState !== 1) {
      return res.json({
        success: true,
        data: [
          { name: 'MOBA', slug: 'moba', icon: 'Swords' },
          { name: 'Battle Royale', slug: 'battle-royale', icon: 'Target' },
          { name: 'Tactical Shooter', slug: 'tactical-shooter', icon: 'Crosshair' }
        ]
      });
    }

    try {
      let categories = await Category.find({ status: 'active' }).sort({ sortOrder: 1 }).lean();
      if (!categories || categories.length === 0) {
        categories = [
          { name: 'MOBA', slug: 'moba', icon: 'Swords' },
          { name: 'Battle Royale', slug: 'battle-royale', icon: 'Target' },
          { name: 'Tactical Shooter', slug: 'tactical-shooter', icon: 'Crosshair' }
        ] as any[];
      }
      res.json({ success: true, data: categories });
    } catch (error: any) {
      res.json({
        success: true,
        data: [
          { name: 'MOBA', slug: 'moba', icon: 'Swords' },
          { name: 'Battle Royale', slug: 'battle-royale', icon: 'Target' },
          { name: 'Tactical Shooter', slug: 'tactical-shooter', icon: 'Crosshair' }
        ]
      });
    }
  }

  // Admin Management Endpoints
  static async createGame(req: AuthenticatedRequest, res: Response) {
    try {
      const game = await Game.create(req.body);
      await AuditService.log('GAME_CREATED', 'admin', req.user?.id, req.ip, req.headers['user-agent'], { gameId: game._id });
      res.status(201).json({ success: true, message: 'Game created successfully', data: game });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async updateGame(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const parsed = gameUpdateSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ success: false, message: 'Validation failed for request payload', errors: parsed.error.errors.map((error) => ({ field: error.path.join('.'), message: error.message })) });
      const game = await Game.findById(id);
      if (!game) return res.status(404).json({ success: false, message: 'Game not found' });
      Object.assign(game, parsed.data);
      await game.save();
      await AuditService.log('GAME_UPDATED', 'admin', req.user?.id, req.ip, req.headers['user-agent'], { gameId: game._id });
      res.json({ success: true, message: 'Game updated successfully', data: game });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async deleteGame(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      await Game.findByIdAndDelete(id);
      await Package.deleteMany({ gameId: id });
      await AuditService.log('GAME_DELETED', 'admin', req.user?.id, req.ip, req.headers['user-agent'], { gameId: id });
      res.json({ success: true, message: 'Game deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async verifyPlayer(req: Request, res: Response) {
    try {
      const { slug, fields } = req.body;
      if (!slug || !fields) {
        return res.status(400).json({ success: false, message: 'slug and player fields are required' });
      }

      const provider = ProviderFactory.getProvider('G2BULK');
      const validationResult = await provider.validatePlayer(slug, fields);

      res.json({
        success: validationResult.valid,
        data: validationResult
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
