import { ProviderFactory } from '../src/services/providers/ProviderFactory';
import { G2BULK_GAME_CODE_MAP } from '../src/services/providers/G2BulkAdapter';

describe('Top-Up Provider Adapter Pattern & G2Bulk Integration', () => {
  it('should instantiate G2BulkAdapter via ProviderFactory', () => {
    const provider = ProviderFactory.getProvider('G2BULK');
    expect(provider).toBeDefined();
    expect(provider.providerName).toBe('G2BULK');
  });

  it('uses only the G2Bulk Global route for Free Fire player verification', () => {
    expect(G2BULK_GAME_CODE_MAP['free-fire']).toEqual(['freefire_global']);
  });

  it('should submit top-up order and return processing status', async () => {
    const provider = ProviderFactory.getProvider('G2BULK');
    const result = await provider.submitOrder({
      orderNumber: 'TEST-ORD-001',
      productId: 'MLBB-86D',
      playerFields: { playerId: '12345678', zoneId: '1234' }
    });

    expect(result.success).toBe(true);
    expect(result.externalOrderId).toBeDefined();
    expect(result.status).toBe('processing');
  });

  it('should check order status successfully', async () => {
    const provider = ProviderFactory.getProvider('G2BULK');
    const result = await provider.checkOrderStatus('G2B-MOCK-123');

    expect(result.success).toBe(true);
    expect(result.status).toBe('success');
  });

  it('should retrieve G2Bulk account balance', async () => {
    const provider = ProviderFactory.getProvider('G2BULK');
    const res = await provider.getBalance();

    expect(res.success).toBe(true);
    expect(res.balance).toBeGreaterThanOrEqual(0);
    expect(res.currency).toBe('USD');
  });

  it('should validate player ID via G2Bulk adapter', async () => {
    const provider = ProviderFactory.getProvider('G2BULK');
    const res = await provider.validatePlayer('mobile-legends', { userId: '12345678', zoneId: '1234' });

    expect(res.valid).toBe(true);
    expect(res.username).toContain('12345678');
  });
});
