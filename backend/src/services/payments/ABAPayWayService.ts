import crypto from 'crypto';
import axios from 'axios';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';

export interface ABAPurchasePayload {
  req_time: string;
  tran_id: string;
  amount: string;
  items: string;
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  type: string;
  payment_option: string;
  return_url: string;
  cancel_url: string;
  hash: string;
}

export class ABAPayWayService {
  /**
   * Get active keys, falling back to correct KHQRcc credentials if defaults/sandbox are set in env
   */
  static getCredentials() {
    // If the merchant ID in env is default sandbox or unset, force use of correct production KHQRcc profile ID
    const merchantId = (!env.ABA_PAYWAY_MERCHANT_ID || env.ABA_PAYWAY_MERCHANT_ID === 'kiyo_merchant_001')
      ? 'pVWqrqi5ioEWXUVNm34yj5YUcemo90sU'
      : env.ABA_PAYWAY_MERCHANT_ID;

    // If the API key is default sample or unset, force use of correct production KHQRcc secret key
    const apiKey = (!env.ABA_PAYWAY_API_KEY || env.ABA_PAYWAY_API_KEY === 'aba_payway_api_key_sample')
      ? 'b84M7oiPofX3RpyZM48Z12jFtQsPWCcj'
      : env.ABA_PAYWAY_API_KEY;

    // Force API URL to point to KHQRcc checkout endpoint
    const apiUrl = (!env.ABA_PAYWAY_API_URL || env.ABA_PAYWAY_API_URL.includes('payway.com.kh') || env.ABA_PAYWAY_API_URL.includes('sandbox'))
      ? 'https://khqr.cc/api/payment/requestv2'
      : env.ABA_PAYWAY_API_URL;

    return { merchantId, apiKey, apiUrl };
  }

  /**
   * Generate SHA-1 security hash for KHQRcc Checkout request
   */
  static generateHash(
    transactionId: string,
    amount: string,
    successUrl: string,
    remark: string
  ): string {
    const { apiKey } = this.getCredentials();
    const rawString = `${apiKey}${transactionId}${amount}${successUrl}${remark}`;
    return crypto.createHash('sha1').update(rawString).digest('hex');
  }

  static async createPaymentCheckout(
    orderNumber: string,
    amount: number,
    customerEmail: string = 'customer@kiyotopup.com'
  ) {
    const { merchantId, apiUrl } = this.getCredentials();
    const formattedAmount = amount.toFixed(2);
    const remark = orderNumber;
    const successUrl = `${env.CLIENT_URL}/tracking`;

    const hash = this.generateHash(
      orderNumber,
      formattedAmount,
      successUrl,
      remark
    );

    // Build the final gateway redirection checkout URL
    const checkoutUrl = `${apiUrl}/${merchantId}?transaction_id=${orderNumber}&amount=${formattedAmount}&success_url=${encodeURIComponent(successUrl)}&remark=${encodeURIComponent(remark)}&hash=${hash}`;

    return {
      merchantId,
      tranId: orderNumber,
      amount: formattedAmount,
      currency: 'USD',
      hash,
      checkoutUrl
    };
  }

  /**
   * Verify incoming Webhook Signature from KHQRcc (SHA-256) or PayWay standard fallback (HMAC-SHA256)
   */
  static verifyWebhookSignature(payload: Record<string, any>): boolean {
    const { transaction_id, status, amount, hash, req_time } = payload;
    const orderIdKey = transaction_id || payload.tran_id;
    const finalHash = hash || payload.success_hash;

    if (!orderIdKey || !finalHash) return false;

    const { apiKey } = this.getCredentials();

    // Check SHA-256 (KHQRcc Webhook standard)
    // Formula: sha256(secret + req_time + transaction_id + amount + "SUCCESS")
    const khqrccCalculatedHash = crypto
      .createHash('sha256')
      .update(`${apiKey}${req_time || ''}${orderIdKey}${amount || ''}SUCCESS`)
      .digest('hex');

    if (finalHash.toLowerCase() === khqrccCalculatedHash.toLowerCase()) {
      return true;
    }

    // Check HMAC-SHA256 (ABA PayWay standard fallback)
    try {
      const rawString = `${orderIdKey}${status || '00'}${amount || ''}`;
      const calculatedPaywayHash = crypto.createHmac('sha256', apiKey).update(rawString).digest('base64');
      return finalHash === calculatedPaywayHash;
    } catch {
      return false;
    }
  }

  /**
   * Poll check status directly from KHQRcc Check Transaction v2 API with Bakong fallback
   */
  static async checkTransactionStatus(tranId: string) {
    try {
      const { merchantId, apiKey } = this.getCredentials();
      const url = `https://khqr.cc/api/${merchantId}/payment-gateway/v1/payments/check-transv2-khqrcc`;
      const hashStr = `${apiKey}${tranId}`;
      const hash = crypto.createHash('sha1').update(hashStr).digest('hex');

      const response = await axios.post(url, new URLSearchParams({
        transaction_id: tranId,
        hash: hash
      }).toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        timeout: 8000
      });

      const result = response.data;
      if (result && result.responseCode === 0 && result.data?.status === 'success') {
        return { status: '00', description: 'Success', tran_id: tranId, amount: result.data.amount };
      }
      return { status: 'pending', description: result?.data?.status || 'Pending' };
    } catch (error: any) {
      logger.error('KHQRcc Transaction Check Error:', error.message);
      return { status: 'error', message: error.message };
    }
  }
}
