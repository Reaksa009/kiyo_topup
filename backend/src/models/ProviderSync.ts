import { Document, Schema, model } from 'mongoose';

export type ProviderSyncType = 'games' | 'packages' | 'full';
export type ProviderSyncStatus = 'running' | 'success' | 'partial' | 'failed';

export interface IProviderSyncLog extends Document {
  provider: string;
  syncType: ProviderSyncType;
  status: ProviderSyncStatus;
  gamesReceived: number;
  gamesInserted: number;
  gamesUpdated: number;
  gamesUnavailable: number;
  packagesReceived: number;
  packagesInserted: number;
  packagesUpdated: number;
  packagesUnavailable: number;
  errorCode?: string;
  errorSummary?: string;
  triggeredByAdminId?: Schema.Types.ObjectId;
  startedAt: Date;
  completedAt?: Date;
}

const ProviderSyncLogSchema = new Schema<IProviderSyncLog>({
  provider: { type: String, required: true, trim: true, lowercase: true },
  syncType: { type: String, enum: ['games', 'packages', 'full'], required: true },
  status: { type: String, enum: ['running', 'success', 'partial', 'failed'], required: true },
  gamesReceived: { type: Number, default: 0, min: 0 }, gamesInserted: { type: Number, default: 0, min: 0 },
  gamesUpdated: { type: Number, default: 0, min: 0 }, gamesUnavailable: { type: Number, default: 0, min: 0 },
  packagesReceived: { type: Number, default: 0, min: 0 }, packagesInserted: { type: Number, default: 0, min: 0 },
  packagesUpdated: { type: Number, default: 0, min: 0 }, packagesUnavailable: { type: Number, default: 0, min: 0 },
  errorCode: { type: String, maxlength: 120 }, errorSummary: { type: String, maxlength: 500 },
  triggeredByAdminId: { type: Schema.Types.ObjectId, ref: 'Admin' },
  startedAt: { type: Date, required: true, default: Date.now }, completedAt: { type: Date }
}, { timestamps: true });

ProviderSyncLogSchema.index({ provider: 1, startedAt: -1 });
ProviderSyncLogSchema.index({ provider: 1, status: 1, startedAt: -1 });

export const ProviderSyncLog = model<IProviderSyncLog>('ProviderSyncLog', ProviderSyncLogSchema);

export interface ISyncLease extends Document<string> {
  _id: string;
  ownerToken: string;
  expiresAt: Date;
}

const SyncLeaseSchema = new Schema<ISyncLease>({
  _id: { type: String, required: true },
  ownerToken: { type: String, required: true, select: false },
  expiresAt: { type: Date, required: true }
}, { timestamps: true });

SyncLeaseSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const SyncLease = model<ISyncLease>('SyncLease', SyncLeaseSchema);
