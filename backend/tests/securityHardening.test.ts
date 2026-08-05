import { redactProviderLogData, redactSensitiveData } from '../src/utils/redaction';
import { toCustomerOrderDTO, toPublicGameDTO, toPublicPackageDTO } from '../src/utils/publicCatalog';
import { gameUpdateSchema, packageUpdateSchema } from '../src/validation/catalog.schemas';
import { checkIdempotency } from '../src/middleware/idempotency.middleware';
import { redisClient } from '../src/config/redis';

describe('Phase 2A security hardening', () => {
  test('redacts nested provider credentials, headers, arrays, and URL parameters', () => {
    const output = redactProviderLogData({
      apiKey: 'key', nested: { Authorization: 'Bearer secret', items: [{ client_secret: 'secret' }] },
      endpoint: 'https://provider.example/path?token=secret&visible=value'
    }) as any;
    expect(output.apiKey).toBe('[REDACTED]');
    expect(output.nested.Authorization).toBe('[REDACTED]');
    expect(output.nested.items[0].client_secret).toBe('[REDACTED]');
    expect(output.endpoint).toContain('token=%5BREDACTED%5D');
    expect(output.endpoint).toContain('visible=value');
    expect(redactProviderLogData('action=add&key=provider-secret')).toContain('key=%5BREDACTED%5D');
  });

  test('redacts secrets before audit data is persisted', () => {
    expect(redactSensitiveData({ password: 'nope', value: 'safe' })).toEqual({ password: '[REDACTED]', value: 'safe' });
  });

  test('strict update schemas reject protected fields but accept legacy admin fields', () => {
    expect(gameUpdateSchema.safeParse({ providerGameId: 'provider-id' }).success).toBe(false);
    expect(gameUpdateSchema.safeParse({ title: 'Updated game', status: 'active' }).success).toBe(true);
    expect(packageUpdateSchema.safeParse({ providerProductId: 'provider-id' }).success).toBe(false);
    expect(packageUpdateSchema.safeParse({ title: 'Updated package', price: 1.5, status: 'active' }).success).toBe(true);
  });

  test('public catalogue DTOs omit costs, provider identifiers, and raw provider data', () => {
    const game = toPublicGameDTO({ _id: 'game', title: 'Game', providerGameId: 'hidden', providerRawData: { hidden: true } });
    const pkg = toPublicPackageDTO({ _id: 'package', title: 'Package', price: 1, costPrice: 0.5, providerProductId: 'hidden', providerRawData: {} }, false);
    expect(game).not.toHaveProperty('providerGameId');
    expect(game).not.toHaveProperty('providerRawData');
    expect(pkg).not.toHaveProperty('costPrice');
    expect(pkg).not.toHaveProperty('providerProductId');
    expect(pkg.isPurchasable).toBe(false);
    const order = toCustomerOrderDTO({ orderNumber: 'ORD-1', amount: 1, costPrice: 0.5, profit: 0.5, providerProductId: 'hidden' });
    expect(order).not.toHaveProperty('costPrice');
    expect(order).not.toHaveProperty('providerProductId');
  });

  test('fails closed when idempotency storage is unavailable', async () => {
    jest.spyOn(redisClient, 'get').mockRejectedValueOnce(new Error('redis unavailable'));
    const req: any = { headers: {}, body: {} };
    const status = jest.fn().mockReturnThis();
    const res: any = { status, json: jest.fn() };
    const next = jest.fn();
    await checkIdempotency(req, res, next);
    expect(status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'IDEMPOTENCY_UNAVAILABLE' }));
    expect(next).not.toHaveBeenCalled();
  });
});
