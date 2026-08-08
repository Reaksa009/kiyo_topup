import crypto from 'crypto';
import axios from 'axios';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';

export class ABAPayWayService {
  private static readonly REQUEST_TIMEOUT_MS = 8000;

  /** Return the KHQRcc profile and server-side payment secret. */
  static getCredentials() {
    const merchantId = env.ABA_PAYWAY_MERCHANT_ID.trim();
    const apiKey = env.ABA_PAYWAY_API_KEY.trim();
    const apiUrl = env.ABA_PAYWAY_API_URL.replace(/\/$/, '');
    const parsedApiUrl = new URL(apiUrl);

    if (
      parsedApiUrl.protocol !== 'https:' ||
      parsedApiUrl.hostname !== 'khqr.cc' ||
      parsedApiUrl.pathname !== '/api/payment/requestv2' ||
      !/^[a-z0-9_-]{8,128}$/i.test(merchantId)
    ) {
      throw new Error('Invalid KHQRcc configuration');
    }

    return { merchantId, apiKey, apiUrl };
  }

  /** sha1(secret + transaction_id + amount + success_url + remark) */
  static generateHash(
    transactionId: string,
    amount: string,
    successUrl: string,
    remark: string
  ): string {
    const { apiKey } = this.getCredentials();
    return crypto
      .createHash('sha1')
      .update(`${apiKey}${transactionId}${amount}${successUrl}${remark}`)
      .digest('hex');
  }

  /** Build the documented managed-checkout URL for a frontend redirect. */
  static async createPaymentCheckout(
    orderNumber: string,
    amount: number,
    _customerEmail: string = 'customer@kiyotopup.com'
  ) {
    if (!Number.isFinite(amount) || amount < 0.01) {
      throw new Error('ABA payment amount must be at least 0.01 USD');
    }

    const { merchantId, apiUrl } = this.getCredentials();
    const formattedAmount = amount.toFixed(2);
    const remark = orderNumber;

    const successUrl = new URL('/tracking', env.CLIENT_URL);
    successUrl.searchParams.set('orderNumber', orderNumber);

    const cancelUrl = new URL(successUrl);
    cancelUrl.searchParams.set('payment', 'cancelled');

    const hash = this.generateHash(
      orderNumber,
      formattedAmount,
      successUrl.toString(),
      remark
    );

    const checkoutUrl = new URL(`${apiUrl}/${encodeURIComponent(merchantId)}`);
    checkoutUrl.searchParams.set('transaction_id', orderNumber);
    checkoutUrl.searchParams.set('amount', formattedAmount);
    checkoutUrl.searchParams.set('success_url', successUrl.toString());
    checkoutUrl.searchParams.set('remark', remark);
    checkoutUrl.searchParams.set('cancel_url', cancelUrl.toString());
    checkoutUrl.searchParams.set('hash', hash);

    return {
      merchantId,
      tranId: orderNumber,
      amount: formattedAmount,
      currency: 'USD',
      hash,
      checkoutUrl: checkoutUrl.toString()
    };
  }

  /** sha256(secret + req_time + transaction_id + amount + "SUCCESS") */
  static verifyWebhookSignature(payload: Record<string, unknown>): boolean {
    const transactionId = typeof payload.transaction_id === 'string' ? payload.transaction_id : '';
    const amount = typeof payload.amount === 'string' || typeof payload.amount === 'number'
      ? String(payload.amount)
      : '';
    const requestTime = typeof payload.req_time === 'string' || typeof payload.req_time === 'number'
      ? String(payload.req_time)
      : '';
    const receivedHash = typeof payload.hash === 'string' ? payload.hash.toLowerCase() : '';

    if (!transactionId || !amount || !requestTime || !/^[a-f0-9]{64}$/.test(receivedHash)) {
      return false;
    }

    const { apiKey } = this.getCredentials();
    const expectedHash = crypto
      .createHash('sha256')
      .update(`${apiKey}${requestTime}${transactionId}${amount}SUCCESS`)
      .digest('hex');

    return crypto.timingSafeEqual(Buffer.from(receivedHash, 'hex'), Buffer.from(expectedHash, 'hex'));
  }

  /** Poll Check Transaction V2 with sha1(secret + transaction_id). */
  static async checkTransactionStatus(transactionId: string) {
    try {
      const { merchantId, apiKey } = this.getCredentials();
      const url = `https://khqr.cc/api/${encodeURIComponent(merchantId)}/payment-gateway/v1/payments/check-transv2-khqrcc`;
      const hash = crypto.createHash('sha1').update(`${apiKey}${transactionId}`).digest('hex');

      const response = await axios.post(
        url,
        new URLSearchParams({ transaction_id: transactionId, hash }).toString(),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          timeout: this.REQUEST_TIMEOUT_MS
        }
      );

      const result = response.data;
      if (result?.responseCode !== 0) {
        return {
          status: 'error',
          message: result?.responseMessage || 'KHQRcc verification failed'
        };
      }

      if (result?.data?.status === 'success') {
        return {
          status: '00',
          description: 'Success',
          tran_id: transactionId,
          amount: result.data.amount
        };
      }

      return { status: 'pending', description: result?.data?.status || 'Pending' };
    } catch (error: any) {
      logger.error('KHQRcc Transaction Check Error', {
        message: error.response?.data?.responseMessage || error.message,
        status: error.response?.status
      });
      return { status: 'error', message: error.response?.data?.responseMessage || error.message };
    }
  }
}
