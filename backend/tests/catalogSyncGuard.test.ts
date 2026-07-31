jest.mock('../src/models/System', () => ({
  Settings: { findOne: jest.fn() }
}));

import { Settings } from '../src/models/System';
import { CATALOG_SYNC_MESSAGE, catalogSyncGuard } from '../src/middleware/catalogSync.middleware';

describe('catalog synchronization API guard', () => {
  const findOneMock = Settings.findOne as jest.Mock;
  const mockSettings = (value: any) => {
    findOneMock.mockReturnValue({ lean: jest.fn().mockResolvedValue(value) });
  };

  beforeEach(() => jest.clearAllMocks());

  test('returns the required 503 response while synchronization is active', async () => {
    mockSettings({ _id: 'settings', isSyncing: true, updatedAt: new Date('2026-07-31T00:00:00Z') });
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    const next = jest.fn();

    await catalogSyncGuard({} as any, { status } as any, next);

    expect(status).toHaveBeenCalledWith(503);
    expect(json).toHaveBeenCalledWith({ success: false, message: CATALOG_SYNC_MESSAGE });
    expect(next).not.toHaveBeenCalled();
  });

  test('allows the request when no synchronization is active', async () => {
    const updatedAt = new Date('2026-07-31T00:00:00Z');
    mockSettings({ _id: 'settings', isSyncing: false, updatedAt });
    const next = jest.fn();
    const response = { locals: {} } as any;

    await catalogSyncGuard({} as any, response, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(response.locals.catalogVersion).toBe(updatedAt.getTime().toString());
  });
});
