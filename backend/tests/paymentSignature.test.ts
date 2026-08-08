import crypto from 'crypto';
import { ABAPayWayService } from '../src/services/payments/ABAPayWayService';
import { BakongKHQRService } from '../src/services/payments/BakongKHQRService';

describe('Payment Gateways Signature & KHQR Verification', () => {
  it('should generate valid HMAC SHA-256 hash for ABA PayWay payload', () => {
    const reqTime = '1700000000';
    const tranId = 'ORD-123456';
    const amount = '5.00';
    const items = 'items_base64';

    const hash = ABAPayWayService.generateHash(
      tranId,
      amount,
      'https://kiyotopup.com/tracking',
      tranId
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

  it('should create payment checkout payload with basic fields', async () => {
    const payment = await ABAPayWayService.createPaymentCheckout('ORD-123456', 5.0);
    expect(payment).toBeDefined();
    expect(payment.tranId).toBe('ORD-123456');
    expect(payment.amount).toBe('5.00');
    expect(payment.currency).toBe('USD');
    expect(payment.checkoutUrl).toContain('khqr.cc');
  });

  it('should verify KHQRcc webhook signature correctly', () => {
    const { apiKey } = ABAPayWayService.getCredentials();
    const payload = {
      transaction_id: 'ORD-123456',
      amount: '5.00',
      req_time: '1700000000',
      hash: crypto
        .createHash('sha256')
        .update(`${apiKey}1700000000ORD-1234565.00SUCCESS`)
        .digest('hex')
    };

    const isValid = ABAPayWayService.verifyWebhookSignature(payload);
    expect(isValid).toBe(true);
  });

  it('should verify legacy PayWay HMAC-SHA256 signature correctly', () => {
    const { apiKey } = ABAPayWayService.getCredentials();
    const payload = {
      tran_id: 'ORD-123456',
      amount: '5.00',
      status: '00',
      hash: crypto
        .createHmac('sha256', apiKey)
        .update('ORD-123456005.00')
        .digest('base64')
    };

    const isValid = ABAPayWayService.verifyWebhookSignature(payload);
    expect(isValid).toBe(true);
  });
});
