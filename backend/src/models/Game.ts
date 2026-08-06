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
GameSchema.index({ status: 1, sortOrder: 1, createdAt: -1 });

export const Game = model<IGame>('Game', GameSchema);
