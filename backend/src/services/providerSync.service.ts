import crypto from 'crypto';
import { ProviderSyncLog, ProviderSyncType, SyncLease } from '../models/ProviderSync';

export const G2BULK_DOCUMENTATION_REQUIRED = 'G2BULK_DOCUMENTATION_REQUIRED';
const LEASE_NAME = 'provider-sync:g2bulk:full';
const LEASE_MS = 5 * 60 * 1000;

export const acquireSyncLease = async (ownerToken: string = crypto.randomUUID(), now = new Date()): Promise<string | null> => {
  try {
    const lease = await SyncLease.findOneAndUpdate(
      { _id: LEASE_NAME, $or: [{ expiresAt: { $lte: now } }, { ownerToken }] },
      { $set: { ownerToken, expiresAt: new Date(now.getTime() + LEASE_MS) } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).select('+ownerToken');
    return lease?.ownerToken === ownerToken ? ownerToken : null;
  } catch (error: any) {
    // A duplicate key on concurrent upsert means another invocation owns the lease.
    if (error?.code === 11000) return null;
    throw error;
  }
};

export const releaseSyncLease = async (ownerToken: string): Promise<void> => {
  await SyncLease.deleteOne({ _id: LEASE_NAME, ownerToken });
};

const safeSummary = (message: string) => message.replace(/https?:\/\/\S+|(?:api[_-]?key|secret|token|authorization)=?\S*/gi, '[REDACTED]').slice(0, 500);

export class ProviderSyncService {
  static async requestDocumentedSync(syncType: ProviderSyncType, adminId?: string) {
    const ownerToken = await acquireSyncLease();
    if (!ownerToken) return { ok: false as const, code: 'SYNC_ALREADY_RUNNING', message: 'A catalogue synchronization is already running.' };

    const log = await ProviderSyncLog.create({ provider: 'g2bulk', syncType, status: 'running', triggeredByAdminId: adminId });
    try {
      // Provider endpoints, auth fields, response schema, currencies, and price units are undocumented here.
      log.status = 'failed';
      log.errorCode = G2BULK_DOCUMENTATION_REQUIRED;
      log.errorSummary = safeSummary('Official G2Bulk catalogue endpoint and redacted response documentation are required before synchronization can run.');
      log.completedAt = new Date();
      await log.save();
      return { ok: false as const, code: G2BULK_DOCUMENTATION_REQUIRED, message: 'G2Bulk catalogue documentation is required before synchronization can run.', logId: log._id.toString() };
    } finally {
      await releaseSyncLease(ownerToken);
    }
  }

  static async getStatus() {
    return ProviderSyncLog.findOne({ provider: 'g2bulk' }).sort({ startedAt: -1 }).lean();
  }

  static async getHistory(limit = 20) {
    return ProviderSyncLog.find({ provider: 'g2bulk' }).sort({ startedAt: -1 }).limit(Math.min(Math.max(limit, 1), 100)).lean();
  }
}
