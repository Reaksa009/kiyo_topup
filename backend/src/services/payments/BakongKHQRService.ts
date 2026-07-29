import crypto from 'crypto';
import axios from 'axios';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';

export class BakongKHQRService {
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
   * Verify Bakong KHQR transaction by MD5 via Bakong Open API
   */
  static async verifyTransactionByMd5(md5Hash: string) {
    try {
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
      logger.error('Bakong KHQR Verification Error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
}
