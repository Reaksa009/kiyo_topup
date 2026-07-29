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
    seoDescription: { type: String, default: '' }
  },
  { timestamps: true }
);

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
  discountPercent: number;
  badge?: string; // e.g. "POPULAR", "BEST VALUE", "+10% EXTRA"
  stock: number; // -1 for unlimited
  status: 'active' | 'out_of_stock' | 'inactive';
  sortOrder: number;
  supportsBoth?: boolean;
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
    discountPercent: { type: Number, default: 0 },
    badge: { type: String, default: '' },
    stock: { type: Number, default: -1 },
    status: { type: String, enum: ['active', 'out_of_stock', 'inactive'], default: 'active' },
    sortOrder: { type: Number, default: 0 },
    supportsBoth: { type: Boolean, default: false }
  },
  { timestamps: true }
);

PackageSchema.index({ gameId: 1, status: 1 });
PackageSchema.index({ providerProductId: 1 });

export const Package = model<IPackage>('Package', PackageSchema);
