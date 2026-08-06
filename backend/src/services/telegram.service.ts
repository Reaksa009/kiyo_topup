import axios from 'axios';
import { env } from '../config/env';
import { TelegramLog } from '../models/System';
import { logger } from '../utils/logger';

export class TelegramService {
  /**
   * Send notification message to configured Telegram Channel / Group
   */
  static async sendMessage(message: string, chatId?: string, customToken?: string): Promise<boolean> {
    const token = customToken || env.TELEGRAM_BOT_TOKEN;
    const targetChat = chatId || env.TELEGRAM_CHAT_ID;

    if (!token || !targetChat) {
      logger.info(`[Telegram Disabled]: ${message}`);
      return false;
    }

    const url = `https://api.telegram.org/bot${token}/sendMessage`;

    try {
      await axios.post(url, {
        chat_id: targetChat,
        text: message,
        parse_mode: 'HTML'
      });

      await TelegramLog.create({
        message,
        targetChatId: targetChat,
        status: 'sent'
      });

      return true;
    } catch (error: any) {
      logger.error('Failed to send Telegram message:', error.message);
      await TelegramLog.create({
        message,
        targetChatId: targetChat,
        status: 'failed',
        error: error.message
      });
      return false;
    }
  }

  /**
   * Format & Send New Order Created alert
   */
  static async notifyNewOrder(orderNumber: string, gameTitle: string, packageTitle: string, amount: number) {
    const text =
      `🛒 <b>NEW ORDER CREATED</b>\n` +
      `--------------------------------\n` +
      `<b>Order #:</b> <code>${orderNumber}</code>\n` +
      `<b>Game:</b> ${gameTitle}\n` +
      `<b>Package:</b> ${packageTitle}\n` +
      `<b>Amount:</b> $${amount.toFixed(2)}\n` +
      `<b>Status:</b> ⏳ Pending Payment`;
    return this.sendMessage(text);
  }

  /**
   * Format & Send Payment Received alert
   */
  static async notifyPaymentSuccess(orderNumber: string, amount: number, paymentMethod: string) {
    const text =
      `💳 <b>PAYMENT CONFIRMED</b>\n` +
      `--------------------------------\n` +
      `<b>Order #:</b> <code>${orderNumber}</code>\n` +
      `<b>Amount:</b> $${amount.toFixed(2)}\n` +
      `<b>Gateway:</b> ${paymentMethod}\n` +
      `<b>Status:</b> ✅ Paid -> Processing Provider`;
    return this.sendMessage(text, undefined, env.TELEGRAM_PAYMENT_RECEIVED_BOT_TOKEN);
  }

  /**
   * Format & Send Order Sent to Provider alert (Waiting Provider)
   */
  static async notifyOrderProcessing(orderNumber: string, gameTitle: string, packageTitle: string) {
    const text =
      `⏳ <b>ORDER SENT TO SUPPLIER</b>\n` +
      `--------------------------------\n` +
      `<b>Order #:</b> <code>${orderNumber}</code>\n` +
      `<b>Game:</b> ${gameTitle}\n` +
      `<b>Package:</b> ${packageTitle}\n` +
      `<b>Status:</b> ⏳ Waiting for Provider Fulfillment`;
    return this.sendMessage(text, undefined, env.TELEGRAM_ORDER_WP_BOT_TOKEN);
  }

  /**
   * Format & Send Supplier Low Balance Alert
   */
  static async notifyLowBalance(balance: number) {
    const text =
      `⚠️ <b>LOW PROVIDER BALANCE WARNING!</b>\n` +
      `--------------------------------\n` +
      `<b>Provider:</b> G2Bulk\n` +
      `<b>Balance Remaining:</b> $${balance.toFixed(2)}\n` +
      `<b>Status:</b> 🚨 Add funds immediately to prevent top-up disruptions`;
    return this.sendMessage(text, undefined, env.TELEGRAM_PROVIDER_LOW_BALANCE_BOT_TOKEN);
  }

  /**
   * Format & Send Provider Top-Up Completed alert
   */
  static async notifyOrderCompleted(orderNumber: string, gameTitle: string, profit: number) {
    const text =
      `🎉 <b>TOP-UP SUCCESSFUL!</b>\n` +
      `--------------------------------\n` +
      `<b>Order #:</b> <code>${orderNumber}</code>\n` +
      `<b>Game:</b> ${gameTitle}\n` +
      `<b>Estimated Profit:</b> +$${profit.toFixed(2)}\n` +
      `<b>Status:</b> 🚀 Completed & Delivered`;
    return this.sendMessage(text);
  }

  /**
   * Format & Send Provider Top-Up Failure alert
   */
  static async notifyOrderFailed(orderNumber: string, reason: string) {
    const text =
      `⚠️ <b>ORDER TOP-UP FAILED!</b>\n` +
      `--------------------------------\n` +
      `<b>Order #:</b> <code>${orderNumber}</code>\n` +
      `<b>Reason:</b> ${reason}\n` +
      `<b>Action Required:</b> Inspect Admin Dashboard`;
    return this.sendMessage(text, undefined, env.TELEGRAM_FAILED_BOT_TOKEN);
  }
}
