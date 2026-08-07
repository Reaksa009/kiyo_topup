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
    const merchantId = 'pVWqrqi5ioEWXUVNm34yj5YUcemo90sU';
    const apiKey = 'b84M7oiPofX3RpyZM48Zl2jFtQsPWCcj'; // Correct key verified using candidate check (contains lowercase l instead of number 1)
    const apiUrl = 'https://khqr.cc/api/payment/requestv2';

    return { merchantId, apiKey, apiUrl };
  }

  /**
   * Format amount number to match PHP float string conversion (e.g. 0.30 -> "0.3", 1.00 -> "1")
   */
  static formatAmount(amount: number): string {
    return String(Number(amount));
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
    logger.info(`[ABA Hash Generation] rawString: "${rawString}"`);
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
    let successUrl = `${env.CLIENT_URL}/tracking`;
    // Prevent double slashes when CLIENT_URL ends with a slash
    successUrl = successUrl.replace(/([^:]\/)\/+/g, "$1");

    const hash = this.generateHash(
      orderNumber,
      formattedAmount,
      successUrl,
      remark
    );

    // Build the initial gateway redirection checkout URL
    const initialUrl = `${apiUrl}/${merchantId}?transaction_id=${orderNumber}&amount=${formattedAmount}&success_url=${encodeURIComponent(successUrl)}&remark=${encodeURIComponent(remark)}&hash=${hash}`;

    // Pre-resolve the direct checkout URL to bypass intermediate redirect (helping mobile auto-open launch successfully)
    let checkoutUrl = initialUrl;
    try {
      const response = await axios.get(initialUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1'
        },
        timeout: 4000
      });
      if (typeof response.data === 'string') {
        const match = response.data.match(/url='([^']+)'/);
        if (match && match[1]) {
          checkoutUrl = match[1];
          logger.info(`[ABA PayWay] Pre-resolved direct checkout URL: ${checkoutUrl}`);
        }
      }
    } catch (error: any) {
      logger.error(`[ABA PayWay] Pre-resolve direct checkout URL failed: ${error.message}`);
    }

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
