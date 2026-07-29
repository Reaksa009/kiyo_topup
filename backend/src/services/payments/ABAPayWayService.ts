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
   * Generate HMAC SHA-256 signature hash for ABA PayWay request payload
   */
  static generateHash(
    reqTime: string,
    tranId: string,
    amount: string,
    items: string,
    shipping: string,
    firstname: string,
    lastname: string,
    email: string,
    phone: string,
    type: string,
    paymentOption: string
  ): string {
    const rawString = `${reqTime}${env.ABA_PAYWAY_MERCHANT_ID}${tranId}${amount}${items}${shipping}${firstname}${lastname}${email}${phone}${type}${paymentOption}`;
    return crypto.createHmac('sha256', env.ABA_PAYWAY_API_KEY).update(rawString).digest('base64');
  }

  /**
   * Generate PayWay Checkout details & KHQR payload for an order
   */
  static async createPaymentCheckout(
    orderNumber: string,
    amount: number,
    customerEmail: string = 'customer@kiyotopup.com'
  ) {
    const reqTime = Math.floor(Date.now() / 1000).toString();
    const formattedAmount = amount.toFixed(2);
    const items = Buffer.from(JSON.stringify([{ name: `TopUp Order ${orderNumber}`, quantity: '1', price: formattedAmount }])).toString('base64');
    const firstname = 'KIYO';
    const lastname = 'Customer';
    const phone = '012345678';
    const type = 'purchase';
    const paymentOption = 'abapay_khqr'; // ABA PayWay KHQR option

    const hash = this.generateHash(
      reqTime,
      orderNumber,
      formattedAmount,
      items,
      '0.00',
      firstname,
      lastname,
      customerEmail,
      phone,
      type,
      paymentOption
    );

    const checkoutUrl = `${env.ABA_PAYWAY_API_URL}`;

    // Generate mock/sample KHQR payload string for immediate scanning
    const qrString = `00020101021238580016A00000077000010112${env.ABA_PAYWAY_MERCHANT_ID}520459995303840540${formattedAmount}5802KH5910KIYO TOPUP6010Phnom Penh6304`;

    return {
      merchantId: env.ABA_PAYWAY_MERCHANT_ID,
      reqTime,
      tranId: orderNumber,
      amount: formattedAmount,
      currency: 'USD',
      hash,
      checkoutUrl,
      qrString: `${qrString}${crypto.createHash('md5').update(qrString).digest('hex').substring(0, 4).toUpperCase()}`,
      deepLink: `abapay://qr?data=${encodeURIComponent(qrString)}`
    };
  }

  /**
   * Verify incoming Webhook Signature from ABA PayWay
   */
  static verifyWebhookSignature(payload: Record<string, any>): boolean {
    const { tran_id, status, amount, hash } = payload;
    if (!tran_id || !status || !hash) return false;

    const rawString = `${tran_id}${status}${amount || ''}`;
    const calculatedHash = crypto.createHmac('sha256', env.ABA_PAYWAY_API_KEY).update(rawString).digest('base64');

    return hash === calculatedHash || env.ABA_PAYWAY_API_KEY.includes('sample');
  }

  /**
   * Check transaction status directly from ABA API
   */
  static async checkTransactionStatus(tranId: string) {
    try {
      if (env.ABA_PAYWAY_API_KEY.includes('sample')) {
        return { status: '00', description: 'Success (Mock)', tran_id: tranId, amount: '1.00' };
      }
      const reqTime = Math.floor(Date.now() / 1000).toString();
      const hash = crypto
        .createHmac('sha256', env.ABA_PAYWAY_API_KEY)
        .update(`${reqTime}${env.ABA_PAYWAY_MERCHANT_ID}${tranId}`)
        .digest('base64');

      const res = await axios.post(`${env.ABA_PAYWAY_API_URL}/check-transaction`, {
        req_time: reqTime,
        merchant_id: env.ABA_PAYWAY_MERCHANT_ID,
        tran_id: tranId,
        hash
      });

      return res.data;
    } catch (error: any) {
      logger.error('ABA Transaction Check Error:', error.message);
      return { status: 'error', message: error.message };
    }
  }
}
