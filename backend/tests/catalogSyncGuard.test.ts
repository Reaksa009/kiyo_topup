jest.mock('../src/models/System', () => ({
  Settings: { exists: jest.fn() }
}));

import { Settings } from '../src/models/System';
import { CATALOG_SYNC_MESSAGE, catalogSyncGuard } from '../src/middleware/catalogSync.middleware';

describe('catalog synchronization API guard', () => {
  const existsMock = Settings.exists as jest.Mock;

  beforeEach(() => jest.clearAllMocks());

  test('returns the required 503 response while synchronization is active', async () => {
    existsMock.mockResolvedValue({ _id: 'settings' });
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    const next = jest.fn();

    await catalogSyncGuard({} as any, { status } as any, next);

    expect(status).toHaveBeenCalledWith(503);
    expect(json).toHaveBeenCalledWith({ success: false, message: CATALOG_SYNC_MESSAGE });
    expect(next).not.toHaveBeenCalled();
  });

  test('allows the request when no synchronization is active', async () => {
    existsMock.mockResolvedValue(null);
    const next = jest.fn();

    await catalogSyncGuard({} as any, {} as any, next);

    expect(next).toHaveBeenCalledTimes(1);
  });
});
