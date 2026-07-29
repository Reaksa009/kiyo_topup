import { Request, Response } from 'express';
import { Order, Payment } from '../models/Order';
import { ABAPayWayService } from '../services/payments/ABAPayWayService';
import { orderQueue } from '../queues/orderQueue';
import { TelegramService } from '../services/telegram.service';
import { logger } from '../utils/logger';

const fulfillBatchIfApplicable = async (orderNo: string) => {
  if (orderNo.startsWith('BCH-')) {
    const subOrders = await Order.find({ 'metadata.parentOrderNumber': orderNo });
    logger.info(`[Fulfillment Webhook] Found ${subOrders.length} sub-orders for batch ${orderNo}. Triggering fulfillments...`);
    for (const sub of subOrders) {
      if (sub.paymentStatus !== 'paid') {
        sub.paymentStatus = 'paid';
        sub.overallStatus = 'processing';
        await sub.save();
        
        await Payment.findOneAndUpdate(
          { orderId: sub._id },
          { status: 'success', paidAt: new Date() },
          { upsert: true }
        );
        
        await orderQueue.add('fulfill', { orderId: sub._id.toString() });
      }
    }
  }
};

export class WebhookController {
  /**
   * Handle ABA PayWay incoming Webhook Notification
   */
  static async handleABAPayWay(req: Request, res: Response) {
    try {
      const payload = req.body;
      logger.info('Received ABA PayWay Webhook:', payload);

      const isValid = ABAPayWayService.verifyWebhookSignature(payload);
      if (!isValid) {
        logger.warn('Invalid ABA PayWay Webhook Signature');
        return res.status(400).json({ status: 'error', message: 'Invalid signature' });
      }

      const { tran_id, status } = payload;
      const order = await Order.findOne({ orderNumber: tran_id });

      if (!order) {
        return res.status(404).json({ status: 'error', message: 'Order not found' });
      }

      if (status === '00' || status === '0') {
        if (order.paymentStatus !== 'paid') {
          order.paymentStatus = 'paid';
          order.overallStatus = 'processing';
          await order.save();

          await Payment.findOneAndUpdate(
            { orderId: order._id },
            { status: 'success', rawPayload: payload, paidAt: new Date() }
          );

          await fulfillBatchIfApplicable(order.orderNumber);
          await orderQueue.add('fulfill', { orderId: order._id.toString() });
          await TelegramService.notifyPaymentSuccess(order.orderNumber, order.amount, 'ABA PayWay Webhook');
        }
      } else {
        order.paymentStatus = 'failed';
        order.overallStatus = 'failed';
        await order.save();
      }

      res.json({ status: 'success' });
    } catch (error: any) {
      logger.error('ABA Webhook Error:', error);
      res.status(500).json({ status: 'error', message: error.message });
    }
  }

  /**
   * Handle Bakong KHQR Webhook
   */
  static async handleBakongKHQR(req: Request, res: Response) {
    try {
      const payload = req.body;
      logger.info('Received Bakong KHQR Webhook:', payload);

      const { md5, orderNumber, status } = payload;
      let order = await Order.findOne({ orderNumber });

      if (!order && md5) {
        const payment = await Payment.findOne({ transactionId: md5 });
        if (payment) {
          order = await Order.findById(payment.orderId);
        }
      }

      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }

      if (status === 'SUCCESS' || status === 'PAID') {
        if (order.paymentStatus !== 'paid') {
          order.paymentStatus = 'paid';
          order.overallStatus = 'processing';
          await order.save();

          await Payment.findOneAndUpdate(
            { orderId: order._id },
            { status: 'success', rawPayload: payload, paidAt: new Date() }
          );

          await fulfillBatchIfApplicable(order.orderNumber);
          await orderQueue.add('fulfill', { orderId: order._id.toString() });
          await TelegramService.notifyPaymentSuccess(order.orderNumber, order.amount, 'Bakong KHQR Webhook');
        }
      }

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Handle G2Bulk / Provider Async Status Webhook Callback
   */
  static async handleProviderCallback(req: Request, res: Response) {
    try {
      const payload = req.body;
      logger.info('Received Provider Async Callback:', payload);

      const { custom_order_id, order_id, status } = payload;
      const order = await Order.findOne({ orderNumber: custom_order_id });

      if (!order) {
        return res.status(404).json({ success: false, message: 'Order reference not found' });
      }

      if (status === 'completed' || status === 'success') {
        order.providerStatus = 'success';
        order.overallStatus = 'completed';
        await order.save();
        await TelegramService.notifyOrderCompleted(order.orderNumber, order.gameTitle, order.profit);
      } else if (status === 'failed' || status === 'canceled') {
        order.providerStatus = 'failed';
        order.overallStatus = 'failed';
        order.failureReason = payload.message || 'Provider async rejection';
        await order.save();
        await TelegramService.notifyOrderFailed(order.orderNumber, order.failureReason || 'Provider callback error');
      }

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
