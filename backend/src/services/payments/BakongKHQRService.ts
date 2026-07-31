import crypto from 'crypto';
import axios from 'axios';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';

interface KHQRVerificationExpectation {
  amount: number;
  currency: string;
}

interface KHQRLinkCreateResponse {
  status?: string;
  qr?: string;
  md5?: string;
  tran?: string;
  amount?: number | string;
  currency?: string;
  merchantname?: string;
  created_at?: string;
  expires_at?: string;
}

interface KHQRVerificationResult {
  success: boolean;
  responseCode?: number;
  responseMessage?: string;
  status?: string;
  data?: any;
  error?: string;
}

export class BakongKHQRService {
  private static readonly REQUEST_TIMEOUT_MS = 10000;

  private static getKHQRLinkHeaders() {
    return {
      Authorization: `Bearer ${env.KHQR_API_TOKEN}`,
      Accept: 'application/json'
    };
  }

  private static getKHQRLinkUrl(path: string) {
    const baseUrl = new URL(env.KHQR_API_BASE_URL);
    const url = new URL(path, `${baseUrl.toString().replace(/\/$/, '')}/`);

    if (url.protocol !== 'https:' || url.origin !== baseUrl.origin) {
      throw new Error('Invalid KHQR Link API URL');
    }

    return url.toString();
  }

  private static moneyMatches(actual: number | string | undefined, expected: number) {
    const actualNumber = typeof actual === 'string' ? Number(actual) : actual;
    return Number.isFinite(actualNumber) && Math.round(Number(actualNumber) * 100) === Math.round(expected * 100);
  }

  /**
   * Calculate CRC16 CCITT checksum for EMVCo KHQR payloads
   */
  private static calculateCRC16(str: string): string {
    let crc = 0xffff;
    for (let c = 0; c < str.length; c++) {
      crc ^= str.charCodeAt(c) << 8;
      for (let i = 0; i < 8; i++) {
        if (crc & 0x8000) {
          crc = (crc << 1) ^ 0x1021;
        } else {
          crc = crc << 1;
        }
      }
    }
    return (crc & 0xffff).toString(16).toUpperCase().padStart(4, '0');
  }

  /**
   * Generate a Bakong EMVCo Standard KHQR QR Code String
   */
  static generateKHQR(orderNumber: string, amount: number) {
    const formattedAmount = amount.toFixed(2);
    const merchantName = env.BAKONG_MERCHANT_NAME || 'KIYO TOPUP STORE';
    const merchantCity = env.BAKONG_MERCHANT_CITY || 'Phnom Penh';
    const accountId = env.BAKONG_ACCOUNT_ID || 'kiyo@acleda';

    // Build EMVCo tags
    const payloadWithoutCRC =
      `000201` + // Payload Format Indicator
      `010212` + // Dynamic QR Code
      `38580016A00000077000010112${accountId.length.toString().padStart(2, '0')}${accountId}` +
      `52045999` + // Merchant Category Code
      `5303840` + // Currency Code (840 = USD)
      `54${formattedAmount.length.toString().padStart(2, '0')}${formattedAmount}` + // Transaction Amount
      `5802KH` + // Country Code
      `59${merchantName.length.toString().padStart(2, '0')}${merchantName}` + // Merchant Name
      `60${merchantCity.length.toString().padStart(2, '0')}${merchantCity}` + // Merchant City
      `62${(orderNumber.length + 4).toString().padStart(2, '0')}05${orderNumber.length.toString().padStart(2, '0')}${orderNumber}` + // Additional Data Field
      `6304`; // CRC Tag Header

    const crc = this.calculateCRC16(payloadWithoutCRC);
    const fullQrString = `${payloadWithoutCRC}${crc}`;
    const md5Hash = crypto.createHash('md5').update(fullQrString).digest('hex');

    return {
      qrString: fullQrString,
      md5: md5Hash,
      merchantName,
      amount: formattedAmount,
      currency: 'USD',
      deepLink: `bakong://qr?data=${encodeURIComponent(fullQrString)}`
    };
  }

  /**
   * Create a payment using the selected KHQR provider. KHQR Link returns a
   * server-rendered QR image URL, while the legacy provider returns raw EMVCo.
   */
  static async createPayment(orderNumber: string, amount: number) {
    if (env.KHQR_PROVIDER !== 'khqr_link') {
      return this.generateKHQR(orderNumber, amount);
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error('KHQR payment amount must be greater than zero');
    }

    try {
      const response = await axios.get<KHQRLinkCreateResponse>(
        this.getKHQRLinkUrl('/v1/khqr/create'),
        {
          params: {
            amount: amount.toFixed(2),
            bakongid: env.KHQR_BAKONG_ACCOUNT_ID,
            merchantname: env.KHQR_ACCOUNT_NAME
          },
          headers: this.getKHQRLinkHeaders(),
          timeout: this.REQUEST_TIMEOUT_MS
        }
      );

      const payload = response.data;
      const md5 = payload?.md5;
      const transactionId = payload?.tran;
      const qrImageUrl = payload?.qr;
      const currency = payload?.currency?.toUpperCase();

      if (
        payload?.status?.toLowerCase() !== 'success' ||
        !md5 ||
        !/^[a-f0-9]{32}$/i.test(md5) ||
        !transactionId ||
        !/^[a-z0-9_-]{4,128}$/i.test(transactionId) ||
        !qrImageUrl ||
        !this.moneyMatches(payload.amount, amount) ||
        currency !== env.KHQR_CURRENCY
      ) {
        throw new Error('KHQR Link returned an invalid payment response');
      }

      const expectedApiUrl = new URL(env.KHQR_API_BASE_URL);
      const qrUrl = new URL(qrImageUrl, env.KHQR_API_BASE_URL);
      const expectedQrPath = `/v1/qr/${transactionId}`;
      if (
        !['http:', 'https:'].includes(qrUrl.protocol) ||
        qrUrl.hostname !== expectedApiUrl.hostname ||
        qrUrl.username ||
        qrUrl.password ||
        !['', '80', '443'].includes(qrUrl.port) ||
        qrUrl.pathname !== expectedQrPath ||
        qrUrl.search ||
        qrUrl.hash
      ) {
        throw new Error('KHQR Link returned an untrusted QR image URL');
      }

      // KHQR Link currently returns an http:// URL even though the same QR
      // image is available over HTTPS. Never send mixed-content URLs to clients.
      qrUrl.protocol = 'https:';
      qrUrl.port = '';

      return {
        provider: 'khqr_link',
        qrImageUrl: qrUrl.toString(),
        md5,
        transactionId,
        merchantName: payload.merchantname || env.KHQR_ACCOUNT_NAME,
        merchantCity: env.KHQR_MERCHANT_CITY,
        amount: Number(payload.amount).toFixed(2),
        currency,
        createdAt: payload.created_at,
        expiresAt: payload.expires_at,
        orderReference: orderNumber
      };
    } catch (error: any) {
      const providerMessage = error.response?.data?.message || error.response?.data?.responseMessage;
      logger.error('KHQR Link creation failed', {
        message: providerMessage || error.message,
        status: error.response?.status,
        orderNumber
      });
      throw new Error(providerMessage || 'Unable to create KHQR payment. Please try again.');
    }
  }

  /**
   * Verify Bakong KHQR transaction by MD5 via Bakong Open API
   */
  static async verifyTransactionByMd5(
    md5Hash: string,
    expected?: KHQRVerificationExpectation
  ): Promise<KHQRVerificationResult> {
    try {
      if (!/^[a-f0-9]{32}$/i.test(md5Hash)) {
        return { success: false, error: 'Invalid KHQR transaction identifier' };
      }

      if (env.KHQR_PROVIDER === 'khqr_link') {
        const response = await axios.get(
          this.getKHQRLinkUrl('/v1/khqr/check'),
          {
            params: {
              md5: md5Hash,
              bakongid: env.KHQR_BAKONG_ACCOUNT_ID
            },
            headers: this.getKHQRLinkHeaders(),
            timeout: this.REQUEST_TIMEOUT_MS,
            validateStatus: (status) => status >= 200 && status < 500
          }
        );

        const payload = response.data;
        const verified =
          response.status === 200 &&
          payload?.responseCode === 0 &&
          payload?.status === 'COMPLETED' &&
          payload?.verified === true &&
          payload?.md5?.toLowerCase() === md5Hash.toLowerCase();

        if (!verified) {
          return {
            success: false,
            status: payload?.status || 'PENDING',
            responseCode: payload?.responseCode,
            responseMessage: payload?.responseMessage || 'Awaiting payment confirmation.'
          };
        }

        if (
          expected &&
          (!this.moneyMatches(payload.amount, expected.amount) ||
            payload?.currency?.toUpperCase() !== expected.currency.toUpperCase())
        ) {
          logger.warn('KHQR Link verification rejected due to payment detail mismatch', {
            md5: md5Hash,
            expectedAmount: expected.amount,
            actualAmount: payload?.amount,
            expectedCurrency: expected.currency,
            actualCurrency: payload?.currency
          });
          return {
            success: false,
            status: 'FAILED',
            responseCode: payload?.responseCode,
            responseMessage: 'Verified KHQR payment does not match this order.'
          };
        }

        return {
          success: true,
          responseCode: payload.responseCode,
          responseMessage: payload.responseMessage,
          status: payload.status,
          data: payload
        };
      }

      if (env.BAKONG_API_TOKEN.includes('sample')) {
        return {
          success: true,
          responseCode: 0,
          responseMessage: 'Mock KHQR Payment Verified',
          data: {
            hash: md5Hash,
            fromAccountId: 'bakong_user@aba',
            toAccountId: env.BAKONG_ACCOUNT_ID,
            amount: 1.0,
            currency: 'USD'
          }
        };
      }

      const res = await axios.post(
        env.BAKONG_API_URL,
        { md5: md5Hash },
        {
          headers: {
            Authorization: `Bearer ${env.BAKONG_API_TOKEN}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      return {
        success: res.data?.responseCode === 0,
        responseCode: res.data?.responseCode,
        responseMessage: res.data?.responseMessage,
        data: res.data?.data
      };
    } catch (error: any) {
      logger.error('Bakong KHQR verification failed', {
        message: error.response?.data?.message || error.message,
        status: error.response?.status
      });
      return {
        success: false,
        error: error.message
      };
    }
  }
}
