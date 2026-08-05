import { Schema, model, Document } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  slug: string;
  icon: string;
  description?: string;
  sortOrder: number;
  status: 'active' | 'inactive';
}

const CategorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    icon: { type: String, default: 'Gamepad2' },
    description: { type: String, default: '' },
    sortOrder: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' }
  },
  { timestamps: true }
);

export const Category = model<ICategory>('Category', CategorySchema);

export interface IGameField {
  name: string; // e.g. "playerId", "zoneId", "serverId"
  label: string; // e.g. "User ID", "Zone ID", "Server ID"
  placeholder: string;
  type: 'text' | 'number' | 'select';
  required: boolean;
  options?: string[]; // for select type
  regexPattern?: string;
  helpText?: string;
}

export interface IGame extends Document {
  title: string;
  slug: string;
  publisher: string;
  thumbnail: string;
  bannerUrl: string;
  categoryId: Schema.Types.ObjectId;
  inputFields: IGameField[];
  instructions: string;
  isPopular: boolean;
  isFlashSale: boolean;
  status: 'active' | 'maintenance' | 'inactive';
  sortOrder: number;
  seoTitle?: string;
  seoDescription?: string;
  provider?: string;
  providerGameId?: string;
  providerCode?: string;
  providerName?: string;
  displayName?: string;
  description?: string;
  logoUrl?: string;
  coverImageUrl?: string;
  detailBannerDesktop?: string;
  detailBannerMobile?: string;
  providerStatus?: 'available' | 'unavailable' | 'unknown';
  isEnabled?: boolean;
  isFeatured?: boolean;
  lastSyncedAt?: Date;
  providerRawData?: Record<string, unknown>;
}

const GameSchema = new Schema<IGame>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    publisher: { type: String, required: true, trim: true },
    thumbnail: { type: String, required: true },
    bannerUrl: { type: String, required: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    inputFields: [
      {
        name: { type: String, required: true },
        label: { type: String, required: true },
        placeholder: { type: String, default: '' },
        type: { type: String, enum: ['text', 'number', 'select'], default: 'text' },
        required: { type: Boolean, default: true },
        options: [{ type: String }],
        regexPattern: { type: String, default: '' },
        helpText: { type: String, default: '' }
      }
    ],
    instructions: { type: String, default: '' },
    isPopular: { type: Boolean, default: false },
    isFlashSale: { type: Boolean, default: false },
    status: { type: String, enum: ['active', 'maintenance', 'inactive'], default: 'active' },
    sortOrder: { type: Number, default: 0 },
    seoTitle: { type: String, default: '' },
    seoDescription: { type: String, default: '' },
    // Additive provider-catalogue fields. Legacy storefront fields above remain authoritative until a later migration.
    provider: { type: String, trim: true, lowercase: true },
    providerGameId: { type: String, trim: true },
    providerCode: { type: String, trim: true },
    providerName: { type: String, trim: true },
    displayName: { type: String, trim: true, maxlength: 160 },
    description: { type: String, maxlength: 4000 },
    logoUrl: { type: String, maxlength: 2048 },
    coverImageUrl: { type: String, maxlength: 2048 },
    detailBannerDesktop: { type: String, maxlength: 2048 },
    detailBannerMobile: { type: String, maxlength: 2048 },
    providerStatus: { type: String, enum: ['available', 'unavailable', 'unknown'], default: 'unknown' },
    isEnabled: { type: Boolean },
    isFeatured: { type: Boolean },
    lastSyncedAt: { type: Date },
    providerRawData: { type: Schema.Types.Mixed, select: false }
  },
  { timestamps: true }
);

GameSchema.index(
  { provider: 1, providerGameId: 1 },
  { unique: true, partialFilterExpression: { provider: { $type: 'string' }, providerGameId: { $type: 'string' } } }
);
GameSchema.index({ provider: 1, providerStatus: 1, isEnabled: 1, sortOrder: 1 });

export const Game = model<IGame>('Game', GameSchema);

export interface IPackage extends Document {
  gameId: Schema.Types.ObjectId;
  title: string;
  description?: string;
  icon?: string;
  price: number; // Customer price in USD
  costPrice: number; // Provider cost in USD
  providerType: 'G2BULK' | 'SMILEONE' | 'CODASHOP' | 'MOOGOLD' | 'CUSTOM';
  providerProductId: string; // e.g. G2Bulk product ID
  supplierId: string;
  catalogKey?: string;
  packageAmount?: string;
  packageType?: string;
  discountPercent: number;
  badge?: string; // e.g. "POPULAR", "BEST VALUE", "+10% EXTRA"
  stock: number; // -1 for unlimited
  status: 'active' | 'out_of_stock' | 'inactive';
  sortOrder: number;
  supportsBoth?: boolean;
  provider?: string;
  providerGameId?: string;
  providerPackageId?: string;
  providerCode?: string;
  providerName?: string;
  displayName?: string;
  bonusAmount?: number;
  bonusText?: string;
  providerBasePriceMinor?: number;
  sellingPriceMinor?: number;
  fixedSellingPriceMinor?: number;
  markupValueMinor?: number;
  markupPercentBasisPoints?: number;
  providerCurrency?: 'USD' | 'KHR';
  displayCurrency?: 'USD' | 'KHR';
  pricingMode?: 'automatic' | 'fixed';
  markupType?: 'percentage' | 'fixed';
  providerStatus?: 'available' | 'unavailable' | 'unknown';
  isEnabled?: boolean;
  isFeatured?: boolean;
  providerRawData?: Record<string, unknown>;
  lastSyncedAt?: Date;
}

const PackageSchema = new Schema<IPackage>(
  {
    gameId: { type: Schema.Types.ObjectId, ref: 'Game', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    icon: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    costPrice: { type: Number, required: true, min: 0 },
    providerType: {
      type: String,
      enum: ['G2BULK', 'SMILEONE', 'CODASHOP', 'MOOGOLD', 'CUSTOM'],
      default: 'G2BULK'
    },
    providerProductId: { type: String, required: true },
    supplierId: { type: String, default: 'G2BULK' },
    catalogKey: { type: String, trim: true },
    packageAmount: { type: String, trim: true },
    packageType: { type: String, trim: true },
    discountPercent: { type: Number, default: 0 },
    badge: { type: String, default: '' },
    stock: { type: Number, default: -1 },
    status: { type: String, enum: ['active', 'out_of_stock', 'inactive'], default: 'active' },
    sortOrder: { type: Number, default: 0 },
    supportsBoth: { type: Boolean, default: false },
    provider: { type: String, trim: true, lowercase: true },
    providerGameId: { type: String, trim: true },
    providerPackageId: { type: String, trim: true },
    providerCode: { type: String, trim: true },
    providerName: { type: String, trim: true },
    displayName: { type: String, trim: true, maxlength: 160 },
    bonusAmount: { type: Number, min: 0 },
    bonusText: { type: String, maxlength: 500 },
    providerBasePriceMinor: { type: Number, min: 0 },
    sellingPriceMinor: { type: Number, min: 0 },
    fixedSellingPriceMinor: { type: Number, min: 0 },
    markupValueMinor: { type: Number, min: 0 },
    markupPercentBasisPoints: { type: Number, min: 0, max: 1000000 },
    providerCurrency: { type: String, enum: ['USD', 'KHR'] },
    displayCurrency: { type: String, enum: ['USD', 'KHR'] },
    pricingMode: { type: String, enum: ['automatic', 'fixed'] },
    markupType: { type: String, enum: ['percentage', 'fixed'] },
    providerStatus: { type: String, enum: ['available', 'unavailable', 'unknown'], default: 'unknown' },
    isEnabled: { type: Boolean },
    isFeatured: { type: Boolean },
    providerRawData: { type: Schema.Types.Mixed, select: false },
    lastSyncedAt: { type: Date }
  },
  { timestamps: true }
);

PackageSchema.index({ gameId: 1, status: 1 });
PackageSchema.index({ providerProductId: 1 });
PackageSchema.index(
  { provider: 1, providerPackageId: 1 },
  { unique: true, partialFilterExpression: { provider: { $type: 'string' }, providerPackageId: { $type: 'string' } } }
);
PackageSchema.index({ gameId: 1, providerStatus: 1, isEnabled: 1, sortOrder: 1 });
PackageSchema.index({ providerType: 1, supplierId: 1, providerProductId: 1 });
PackageSchema.index(
  { gameId: 1, catalogKey: 1 },
  { unique: true, partialFilterExpression: { catalogKey: { $type: 'string' } } }
);

PackageSchema.pre('validate', function (next) {
  if (this.pricingMode === 'fixed' && this.fixedSellingPriceMinor === undefined) {
    this.invalidate('fixedSellingPriceMinor', 'fixedSellingPriceMinor is required when pricingMode is fixed');
  }
  if (this.markupType === 'percentage' && this.markupPercentBasisPoints === undefined && this.pricingMode === 'automatic') {
    this.invalidate('markupPercentBasisPoints', 'markupPercentBasisPoints is required for percentage automatic pricing');
  }
  if (this.markupType === 'fixed' && this.markupValueMinor === undefined && this.pricingMode === 'automatic') {
    this.invalidate('markupValueMinor', 'markupValueMinor is required for fixed automatic pricing');
  }
  next();
});

export const Package = model<IPackage>('Package', PackageSchema);
