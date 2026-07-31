import { Request, Response } from 'express';
import { Payment, Order } from '../models/Order';
import { ABAPayWayService } from '../services/payments/ABAPayWayService';
import { BakongKHQRService } from '../services/payments/BakongKHQRService';
import { orderQueue } from '../queues/orderQueue';
import { TelegramService } from '../services/telegram.service';
import { logger } from '../utils/logger';
import { env } from '../config/env';

const fulfillBatchIfApplicable = async (orderNo: string) => {
  if (orderNo.startsWith('BCH-')) {
    const subOrders = await Order.find({ 'metadata.parentOrderNumber': orderNo });
    logger.info(`[Fulfillment] Found ${subOrders.length} sub-orders for batch ${orderNo}. Triggering fulfillments...`);
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

export class PaymentController {
  /**
   * Check status of payment and trigger fulfillment if paid
   */
  static async checkStatus(req: Request, res: Response) {
    try {
      const { orderNumber } = req.params;
      const order = await Order.findOne({ orderNumber });
      if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

      const payment = await Payment.findOne({ orderId: order._id });

      if (order.paymentStatus === 'paid') {
        return res.json({
          success: true,
          status: 'paid',
          overallStatus: order.overallStatus,
          message: 'Payment confirmed.'
        });
      }

      // Check ABA status
      if (order.paymentMethod === 'ABA_PAYWAY') {
        const check = await ABAPayWayService.checkTransactionStatus(order.orderNumber);
        if (check.status === '00') {
          order.paymentStatus = 'paid';
          order.overallStatus = 'processing';
          await order.save();

          if (payment) {
            payment.status = 'success';
            payment.paidAt = new Date();
            await payment.save();
          }

          await fulfillBatchIfApplicable(order.orderNumber);
          await orderQueue.add('fulfill', { orderId: order._id.toString() });
          await TelegramService.notifyPaymentSuccess(order.orderNumber, order.amount, 'ABA PayWay');

          return res.json({ success: true, status: 'paid', overallStatus: 'processing' });
        }
      }

      // Check Bakong status
      if (order.paymentMethod === 'BAKONG_KHQR' && payment?.transactionId) {
        const check = await BakongKHQRService.verifyTransactionByMd5(payment.transactionId, {
          amount: payment.amount,
          currency: payment.currency
        });
        if (check.success) {
          const paidOrder = await Order.findOneAndUpdate(
            { _id: order._id, paymentStatus: { $ne: 'paid' } },
            { $set: { paymentStatus: 'paid', overallStatus: 'processing' } },
            { new: true }
          );

          if (!paidOrder) {
            return res.json({ success: true, status: 'paid', overallStatus: order.overallStatus });
          }

          payment.status = 'success';
          payment.paidAt = new Date();
          payment.rawPayload = check.data;
          await payment.save();

          await fulfillBatchIfApplicable(paidOrder.orderNumber);
          await orderQueue.add('fulfill', { orderId: paidOrder._id.toString() });
          await TelegramService.notifyPaymentSuccess(paidOrder.orderNumber, paidOrder.amount, 'Bakong KHQR');

          return res.json({ success: true, status: 'paid', overallStatus: 'processing' });
        }
      }

      res.json({
        success: true,
        status: order.paymentStatus,
        overallStatus: order.overallStatus,
        message: 'Awaiting payment confirmation.'
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Mock / Dev Simulator for testing instant payment confirmation
   */
  static async simulateSuccess(req: Request, res: Response) {
    try {
      if (env.NODE_ENV === 'production' || !env.ENABLE_PAYMENT_SIMULATOR) {
        return res.status(404).json({ success: false, message: 'Not found.' });
      }

      const { orderNumber } = req.body;
      const order = await Order.findOne({ orderNumber });
      if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

      order.paymentStatus = 'paid';
      order.overallStatus = 'processing';
      await order.save();

      const payment = await Payment.findOne({ orderId: order._id });
      if (payment) {
        payment.status = 'success';
        payment.paidAt = new Date();
        await payment.save();
      }

      await fulfillBatchIfApplicable(order.orderNumber);
      await orderQueue.add('fulfill', { orderId: order._id.toString() });
      await TelegramService.notifyPaymentSuccess(order.orderNumber, order.amount, `${order.paymentMethod} (Simulated)`);

      res.json({
        success: true,
        message: 'Payment simulation succeeded. Order sent to provider queue!',
        data: { order }
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
