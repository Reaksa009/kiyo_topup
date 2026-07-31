import axios from 'axios';
import { env } from '../src/config/env';
import { BakongKHQRService } from '../src/services/payments/BakongKHQRService';

describe('KHQR Link payment provider', () => {
  const originalConfig = {
    provider: env.KHQR_PROVIDER,
    token: env.KHQR_API_TOKEN,
    accountId: env.KHQR_BAKONG_ACCOUNT_ID,
    accountName: env.KHQR_ACCOUNT_NAME,
    currency: env.KHQR_CURRENCY,
    baseUrl: env.KHQR_API_BASE_URL
  };

  beforeEach(() => {
    env.KHQR_PROVIDER = 'khqr_link';
    env.KHQR_API_TOKEN = 'test-private-khqr-token';
    env.KHQR_BAKONG_ACCOUNT_ID = 'merchant@bank';
    env.KHQR_ACCOUNT_NAME = 'KIYO TOPUP';
    env.KHQR_CURRENCY = 'USD';
    env.KHQR_API_BASE_URL = 'https://api.khqr.link';
  });

  afterEach(() => {
    env.KHQR_PROVIDER = originalConfig.provider;
    env.KHQR_API_TOKEN = originalConfig.token;
    env.KHQR_BAKONG_ACCOUNT_ID = originalConfig.accountId;
    env.KHQR_ACCOUNT_NAME = originalConfig.accountName;
    env.KHQR_CURRENCY = originalConfig.currency;
    env.KHQR_API_BASE_URL = originalConfig.baseUrl;
  });

  it('creates a provider QR image payment without exposing the token in the result', async () => {
    const getSpy = jest.spyOn(axios, 'get').mockResolvedValue({
      status: 200,
      data: {
        status: 'success',
        qr: 'http://api.khqr.link/v1/qr/abc123',
        md5: '531458185fd39028cfd8f64fdd5022d3',
        tran: 'abc123',
        amount: 1.25,
        currency: 'USD',
        merchantname: 'KIYO TOPUP',
        created_at: '2026-07-31T10:00:00.000Z',
        expires_at: '2026-07-31T10:15:00.000Z'
      }
    });

    const payment = await BakongKHQRService.createPayment('ORD-123', 1.25);

    expect(payment).toMatchObject({
      provider: 'khqr_link',
      qrImageUrl: 'https://api.khqr.link/v1/qr/abc123',
      md5: '531458185fd39028cfd8f64fdd5022d3',
      amount: '1.25',
      currency: 'USD'
    });
    expect(JSON.stringify(payment)).not.toContain(env.KHQR_API_TOKEN);
    expect(getSpy).toHaveBeenCalledWith(
      'https://api.khqr.link/v1/khqr/create',
      expect.objectContaining({
        params: {
          amount: '1.25',
          bakongid: 'merchant@bank',
          merchantname: 'KIYO TOPUP'
        },
        headers: expect.objectContaining({ Authorization: 'Bearer test-private-khqr-token' })
      })
    );
  });

  it('rejects a QR image URL outside the trusted KHQR API transaction path', async () => {
    jest.spyOn(axios, 'get').mockResolvedValue({
      status: 200,
      data: {
        status: 'success',
        qr: 'https://example.com/v1/qr/abc123',
        md5: '531458185fd39028cfd8f64fdd5022d3',
        tran: 'abc123',
        amount: 1.25,
        currency: 'USD',
        merchantname: 'KIYO TOPUP'
      }
    });

    await expect(BakongKHQRService.createPayment('ORD-123', 1.25)).rejects.toThrow(
      'Unable to create KHQR payment'
    );
  });

  it('accepts only a backend-completed, verified payment matching the order', async () => {
    jest.spyOn(axios, 'get').mockResolvedValue({
      status: 200,
      data: {
        responseCode: 0,
        responseMessage: 'Success',
        status: 'COMPLETED',
        verified: true,
        md5: '531458185fd39028cfd8f64fdd5022d3',
        amount: 4.5,
        currency: 'USD'
      }
    });

    const verification = await BakongKHQRService.verifyTransactionByMd5(
      '531458185fd39028cfd8f64fdd5022d3',
      { amount: 4.5, currency: 'USD' }
    );

    expect(verification.success).toBe(true);
  });

  it('rejects a completed payment when its amount does not match the order', async () => {
    jest.spyOn(axios, 'get').mockResolvedValue({
      status: 200,
      data: {
        responseCode: 0,
        responseMessage: 'Success',
        status: 'COMPLETED',
        verified: true,
        md5: '531458185fd39028cfd8f64fdd5022d3',
        amount: 1,
        currency: 'USD'
      }
    });

    const verification = await BakongKHQRService.verifyTransactionByMd5(
      '531458185fd39028cfd8f64fdd5022d3',
      { amount: 10, currency: 'USD' }
    );

    expect(verification.success).toBe(false);
    expect(verification.responseMessage).toContain('does not match');
  });
});
