import { Schema, model, Document } from 'mongoose';

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

// Performance compound index for storefront package loading
PackageSchema.index({ gameId: 1, status: 1, sortOrder: 1, price: 1 });

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
