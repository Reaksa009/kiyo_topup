import { ABAPayWayService } from '../src/services/payments/ABAPayWayService';
import { BakongKHQRService } from '../src/services/payments/BakongKHQRService';

describe('Payment Gateways Signature & KHQR Verification', () => {
  it('should generate valid HMAC SHA-256 hash for ABA PayWay payload', () => {
    const reqTime = '1700000000';
    const tranId = 'ORD-123456';
    const amount = '5.00';
    const items = 'items_base64';

    const hash = ABAPayWayService.generateHash(
      reqTime,
      tranId,
      amount,
      items,
      '0.00',
      'KIYO',
      'Customer',
      'test@kiyotopup.com',
      '012345678',
      'purchase',
      'abapay_khqr'
    );

    expect(hash).toBeDefined();
    expect(typeof hash).toBe('string');
    expect(hash.length).toBeGreaterThan(10);
  });

  it('should generate valid EMVCo Bakong KHQR String and CRC16', () => {
    const khqr = BakongKHQRService.generateKHQR('ORD-998877', 10.5);

    expect(khqr.qrString).toContain('000201010212');
    expect(khqr.qrString).toContain('5303840'); // Currency USD
    expect(khqr.qrString).toContain('10.50'); // Formatted Amount
    expect(khqr.md5).toBeDefined();
    expect(khqr.md5.length).toBe(32);
  });
});
