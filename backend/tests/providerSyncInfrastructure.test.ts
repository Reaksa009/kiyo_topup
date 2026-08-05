jest.mock('../src/models/ProviderSync', () => ({
  ProviderSyncLog: { create: jest.fn(), findOne: jest.fn(), find: jest.fn() },
  SyncLease: { findOneAndUpdate: jest.fn(), deleteOne: jest.fn() }
}));

import { ProviderSyncLog, SyncLease } from '../src/models/ProviderSync';
import { acquireSyncLease, G2BULK_DOCUMENTATION_REQUIRED, ProviderSyncService, releaseSyncLease } from '../src/services/providerSync.service';

describe('provider-neutral sync infrastructure', () => {
  beforeEach(() => jest.clearAllMocks());

  test('uses a MongoDB lease and declines a concurrent owner', async () => {
    (SyncLease.findOneAndUpdate as jest.Mock).mockReturnValue({ select: jest.fn().mockResolvedValue({ ownerToken: 'owner-a' }) });
    expect(await acquireSyncLease('owner-a')).toBe('owner-a');
    (SyncLease.findOneAndUpdate as jest.Mock).mockReturnValue({ select: jest.fn().mockResolvedValue({ ownerToken: 'owner-a' }) });
    expect(await acquireSyncLease('owner-b')).toBeNull();
    await releaseSyncLease('owner-a');
    expect(SyncLease.deleteOne).toHaveBeenCalledWith({ _id: 'provider-sync:g2bulk:full', ownerToken: 'owner-a' });
  });

  test('records documentation-required sync attempts without provider calls or secrets', async () => {
    (SyncLease.findOneAndUpdate as jest.Mock).mockImplementation((_filter: any, update: any) => ({
      select: jest.fn().mockResolvedValue({ ownerToken: update.$set.ownerToken })
    }));
    const save = jest.fn();
    (ProviderSyncLog.create as jest.Mock).mockResolvedValue({ _id: 'log-id', save, status: 'running' });
    const result = await ProviderSyncService.requestDocumentedSync('full', 'admin-id');
    expect(result).toMatchObject({ ok: false, code: G2BULK_DOCUMENTATION_REQUIRED, logId: 'log-id' });
    expect(save).toHaveBeenCalled();
    expect(SyncLease.deleteOne).toHaveBeenCalled();
  });

  test('returns duplicate prevention before creating another log', async () => {
    (SyncLease.findOneAndUpdate as jest.Mock).mockReturnValue({ select: jest.fn().mockResolvedValue({ ownerToken: 'another-owner' }) });
    const result = await ProviderSyncService.requestDocumentedSync('games');
    expect(result).toMatchObject({ ok: false, code: 'SYNC_ALREADY_RUNNING' });
    expect(ProviderSyncLog.create).not.toHaveBeenCalled();
  });
});
