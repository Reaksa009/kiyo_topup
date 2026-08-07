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
   * Generate SHA-1 security hash for KHQRcc Checkout request
   */
  static generateHash(
    transactionId: string,
    amount: string,
    successUrl: string,
    remark: string
  ): string {
    const rawString = `${env.ABA_PAYWAY_API_KEY}${transactionId}${amount}${successUrl}${remark}`;
    return crypto.createHash('sha1').update(rawString).digest('hex');
  }

  /**
   * Generate KHQRcc Checkout redirect URL for an order
   */
  static async createPaymentCheckout(
    orderNumber: string,
    amount: number,
    customerEmail: string = 'customer@kiyotopup.com'
  ) {
    const formattedAmount = amount.toFixed(2);
    const remark = `Order ${orderNumber}`;
    const successUrl = `${env.CLIENT_URL}/tracking?orderNumber=${orderNumber}`;

    const hash = this.generateHash(
      orderNumber,
      formattedAmount,
      successUrl,
      remark
    );

    // Build the final gateway redirection checkout URL
    const checkoutUrl = `${env.ABA_PAYWAY_API_URL}/${env.ABA_PAYWAY_MERCHANT_ID}?transaction_id=${orderNumber}&amount=${formattedAmount}&success_url=${encodeURIComponent(successUrl)}&remark=${encodeURIComponent(remark)}&hash=${hash}`;

    return {
      merchantId: env.ABA_PAYWAY_MERCHANT_ID,
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

    const secret = env.ABA_PAYWAY_API_KEY;

    // Check SHA-256 (KHQRcc Webhook standard)
    // Formula: sha256(secret + req_time + transaction_id + amount + "SUCCESS")
    const khqrccCalculatedHash = crypto
      .createHash('sha256')
      .update(`${secret}${req_time || ''}${orderIdKey}${amount || ''}SUCCESS`)
      .digest('hex');

    if (finalHash.toLowerCase() === khqrccCalculatedHash.toLowerCase()) {
      return true;
    }

    // Check HMAC-SHA256 (ABA PayWay standard fallback)
    try {
      const rawString = `${orderIdKey}${status || '00'}${amount || ''}`;
      const calculatedPaywayHash = crypto.createHmac('sha256', secret).update(rawString).digest('base64');
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
      const url = `https://khqr.cc/api/${env.ABA_PAYWAY_MERCHANT_ID}/payment-gateway/v1/payments/check-transv2-khqrcc`;
      const secret = env.ABA_PAYWAY_API_KEY;
      const hashStr = `${secret}${tranId}`;
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
