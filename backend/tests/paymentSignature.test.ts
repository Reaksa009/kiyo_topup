import crypto from 'crypto';
import axios from 'axios';
import { ABAPayWayService } from '../src/services/payments/ABAPayWayService';
import { BakongKHQRService } from '../src/services/payments/BakongKHQRService';

describe('Payment Gateways Signature & KHQR Verification', () => {
  it('should generate the documented SHA-1 KHQRcc checkout hash', () => {
    const tranId = 'ORD-123456';
    const amount = '5.00';
    const hash = ABAPayWayService.generateHash(
      tranId,
      amount,
      'https://kiyotopup.com/tracking',
      tranId
    );

    expect(hash).toBeDefined();
    expect(typeof hash).toBe('string');
    expect(hash).toBe(
      crypto
        .createHash('sha1')
        .update(`${ABAPayWayService.getCredentials().apiKey}${tranId}${amount}https://kiyotopup.com/tracking${tranId}`)
        .digest('hex')
    );
  });

  it('should generate valid EMVCo Bakong KHQR String and CRC16', () => {
    const khqr = BakongKHQRService.generateKHQR('ORD-998877', 10.5);

    expect(khqr.qrString).toContain('000201010212');
    expect(khqr.qrString).toContain('5303840'); // Currency USD
    expect(khqr.qrString).toContain('10.50'); // Formatted Amount
    expect(khqr.md5).toBeDefined();
    expect(khqr.md5.length).toBe(32);
  });

  it('should create the documented managed-checkout redirect URL', async () => {
    const checkoutRequest = jest.spyOn(axios, 'get').mockResolvedValueOnce({
      status: 200,
      headers: {},
      data: ''
    } as any);
    const payment = await ABAPayWayService.createPaymentCheckout('ORD-123456', 5.0);
    expect(payment).toBeDefined();
    expect(payment.tranId).toBe('ORD-123456');
    expect(payment.amount).toBe('5.00');
    expect(payment.currency).toBe('USD');
    const checkoutUrl = new URL(payment.checkoutUrl);
    expect(`${checkoutUrl.origin}${checkoutUrl.pathname}`).toBe(
      `https://khqr.cc/api/payment/requestv2/${ABAPayWayService.getCredentials().merchantId}`
    );
    expect(checkoutUrl.searchParams.get('transaction_id')).toBe('ORD-123456');
    expect(checkoutUrl.searchParams.get('amount')).toBe('5.00');
    expect(checkoutUrl.searchParams.get('success_url')).toContain('/tracking?orderNumber=ORD-123456');
    expect(checkoutUrl.searchParams.get('remark')).toBe('ORD-123456');
    expect(checkoutUrl.searchParams.get('hash')).toBe(payment.hash);
    checkoutRequest.mockRestore();
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

  it('should reject signatures outside the documented KHQRcc callback format', () => {
    const payload = {
      tran_id: 'ORD-123456',
      amount: '5.00',
      status: '00',
      hash: 'not-a-khqrcc-sha256-hash'
    };

    const isValid = ABAPayWayService.verifyWebhookSignature(payload);
    expect(isValid).toBe(false);
  });
});
