import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  phone?: string;
  avatar?: string;
  walletBalance: number;
  savedPlayerIds: Array<{
    gameId: Schema.Types.ObjectId;
    gameSlug: string;
    playerId: string;
    zoneId?: string;
    serverId?: string;
    label?: string;
  }>;
  referralCode: string;
  referredBy?: Schema.Types.ObjectId;
  status: 'active' | 'blocked' | 'suspended';
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    phone: { type: String, default: '' },
    avatar: { type: String, default: '' },
    walletBalance: { type: Number, default: 0.0, min: 0 },
    savedPlayerIds: [
      {
        gameId: { type: Schema.Types.ObjectId, ref: 'Game' },
        gameSlug: { type: String },
        playerId: { type: String, required: true },
        zoneId: { type: String, default: '' },
        serverId: { type: String, default: '' },
        label: { type: String, default: 'Default Account' }
      }
    ],
    referralCode: { type: String, unique: true, required: true },
    referredBy: { type: Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['active', 'blocked', 'suspended'], default: 'active' }
  },
  { timestamps: true }
);

export const User = model<IUser>('User', UserSchema);
