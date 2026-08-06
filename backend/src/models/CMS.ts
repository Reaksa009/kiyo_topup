import { Schema, model, Document } from 'mongoose';

export interface IPromotion extends Document {
  title: string;
  bannerUrl: string;
  targetGameIds: Schema.Types.ObjectId[];
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  startDate: Date;
  endDate: Date;
  active: boolean;
}

const PromotionSchema = new Schema<IPromotion>(
  {
    title: { type: String, required: true },
    bannerUrl: { type: String, required: true },
    targetGameIds: [{ type: Schema.Types.ObjectId, ref: 'Game' }],
    discountType: { type: String, enum: ['percentage', 'fixed'], required: true },
    discountValue: { type: Number, required: true, min: 0.01 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

PromotionSchema.index({ active: 1, startDate: 1, endDate: 1 });

export const Promotion = model<IPromotion>('Promotion', PromotionSchema);

export interface ICoupon extends Document {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  maxUses: number;
  minOrderAmount: number;
  usedCount: number;
  expiryDate: Date;
  active: boolean;
}

const CouponSchema = new Schema<ICoupon>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    discountType: { type: String, enum: ['percentage', 'fixed'], required: true },
    discountValue: { type: Number, required: true, min: 0.01 },
    maxUses: { type: Number, default: 100, min: 1 },
    minOrderAmount: { type: Number, default: 0, min: 0 },
    usedCount: { type: Number, default: 0, min: 0 },
    expiryDate: { type: Date, required: true },
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

CouponSchema.index({ active: 1, expiryDate: 1 });

export const Coupon = model<ICoupon>('Coupon', CouponSchema);

export interface IBanner extends Document {
  title: string;
  imageUrl: string;
  desktopImageUrl?: string;
  mobileImageUrl?: string;
  subtitle?: string;
  buttonText?: string;
  buttonUrl?: string;
  placement?: 'home' | 'game-detail';
  gameId?: Schema.Types.ObjectId;
  enabled?: boolean;
  startDate?: Date;
  endDate?: Date;
  linkUrl: string;
  position: 'hero' | 'promo' | 'popup';
  active: boolean;
  sortOrder: number;
}

const BannerSchema = new Schema<IBanner>(
  {
    title: { type: String, required: true },
    // imageUrl remains the legacy-compatible final image fallback.
    imageUrl: { type: String, default: '' },
    desktopImageUrl: { type: String, maxlength: 2048, default: '' },
    mobileImageUrl: { type: String, maxlength: 2048, default: '' },
    subtitle: { type: String, maxlength: 500, default: '' },
    buttonText: { type: String, maxlength: 120, default: '' },
    buttonUrl: { type: String, maxlength: 2048, default: '' },
    placement: { type: String, enum: ['home', 'game-detail'], default: 'home' },
    gameId: { type: Schema.Types.ObjectId, ref: 'Game' },
    enabled: { type: Boolean, default: true },
    startDate: { type: Date },
    endDate: { type: Date },
    linkUrl: { type: String, default: '' },
    position: { type: String, enum: ['hero', 'promo', 'popup'], default: 'hero' },
    active: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 }
  },
  { timestamps: true }
);

BannerSchema.index({ active: 1, enabled: 1, placement: 1, gameId: 1, startDate: 1, endDate: 1, sortOrder: 1 });

export const Banner = model<IBanner>('Banner', BannerSchema);

export interface IBlog extends Document {
  title: string;
  slug: string;
  thumbnail: string;
  content: string;
  author: string;
  tags: string[];
  seoTitle?: string;
  seoDescription?: string;
  status: 'draft' | 'published';
}

const BlogSchema = new Schema<IBlog>(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    thumbnail: { type: String, required: true },
    content: { type: String, required: true },
    author: { type: String, default: 'KIYO Team' },
    tags: [{ type: String }],
    seoTitle: { type: String, default: '' },
    seoDescription: { type: String, default: '' },
    status: { type: String, enum: ['draft', 'published'], default: 'published' }
  },
  { timestamps: true }
);

BlogSchema.index({ status: 1, createdAt: -1 });

export const Blog = model<IBlog>('Blog', BlogSchema);
