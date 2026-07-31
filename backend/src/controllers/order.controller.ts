import { Request, Response } from 'express';
import crypto from 'crypto';
import { Order } from '../models/Order';
import { Game, Package } from '../models/Game';
import { Coupon } from '../models/CMS';
import { Payment } from '../models/Order';
import { User } from '../models/User';
import { ABAPayWayService } from '../services/payments/ABAPayWayService';
import { BakongKHQRService } from '../services/payments/BakongKHQRService';
import { TelegramService } from '../services/telegram.service';
import { orderQueue } from '../queues/orderQueue';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { AuditService } from '../services/audit.service';
import { G2BulkAdapter } from '../services/providers/G2BulkAdapter';
import { Settings } from '../models/System';
import { CATALOG_SYNC_MESSAGE } from '../middleware/catalogSync.middleware';

export class OrderController {
  /**
   * Create a new top-up order with server-calculated prices and payment gateway details
   */
  static async createOrder(req: AuthenticatedRequest, res: Response) {
    try {
      // Check if catalog synchronization lock is enabled
      const settings = await Settings.findOne();
      if (settings?.isSyncing) {
        return res.status(503).json({
          success: false,
          message: CATALOG_SYNC_MESSAGE
        });
      }

      const { gameId, packageId, playerFields, paymentMethod, couponCode, guestEmail } = req.body;
      const idempotencyKey = (req.headers['x-idempotency-key'] as string) || req.body.idempotencyKey || crypto.randomUUID();

      // Check existing order with same idempotency key
      const existing = await Order.findOne({ idempotencyKey });
      if (existing) {
        return res.json({
          success: true,
          message: 'Order retrieved from idempotency key',
          data: { order: existing }
        });
      }

      // Fetch Game and Package strictly from DB (Never trust client prices!)
      const game = await Game.findById(gameId);
      if (!game || game.status !== 'active') {
        return res.status(400).json({ success: false, message: 'Selected game is currently unavailable.' });
      }

      const pkg = await Package.findById(packageId);
      if (!pkg || pkg.status !== 'active') {
        return res.status(400).json({ success: false, message: 'Selected package is out of stock or unavailable.' });
      }

      // Validate required dynamic player fields
      for (const field of game.inputFields) {
        if (field.required && (!playerFields || !playerFields[field.name])) {
          return res.status(400).json({
            success: false,
            message: `Field '${field.label}' is required for ${game.title}.`
          });
        }
      }

      // Verify player credentials against G2Bulk database before creating order or generating payment details
      const g2bulkAdapter = new G2BulkAdapter();
      const verification = await g2bulkAdapter.validatePlayer(game.slug, playerFields);
      if (!verification.valid) {
        return res.status(400).json({
          success: false,
          message: 'Player not found in G2Bulk database'
        });
      }

      // Close the window between the route-level guard and the slower provider
      // validation call. Never create an order from a pre-sync package snapshot.
      if (await Settings.exists({ isSyncing: true })) {
        return res.status(503).json({ success: false, message: CATALOG_SYNC_MESSAGE });
      }

      let finalPrice = pkg.price;
      let discountAmount = 0;

      // Handle Coupon Code discount
      if (couponCode) {
        const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), active: true });
        if (coupon && coupon.expiryDate > new Date() && coupon.usedCount < coupon.maxUses) {
          if (finalPrice >= coupon.minOrderAmount) {
            if (coupon.discountType === 'percentage') {
              discountAmount = (finalPrice * coupon.discountValue) / 100;
            } else {
              discountAmount = coupon.discountValue;
            }
            finalPrice = Math.max(0.01, finalPrice - discountAmount);
            coupon.usedCount += 1;
            await coupon.save();
          }
        }
      }

      const costPrice = pkg.costPrice;
      const profit = finalPrice - costPrice;
      const orderNumber = `ORD-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;

      const order = await Order.create({
        orderNumber,
        userId: req.user?.id || undefined,
        guestEmail: guestEmail || (req.user?.email || ''),
        gameId: game._id,
        packageId: pkg._id,
        playerFields,
        gameTitle: game.title,
        packageTitle: pkg.title,
        providerType: pkg.providerType,
        providerProductId: pkg.providerProductId,
        supplierId: pkg.supplierId,
        amount: finalPrice,
        costPrice,
        profit,
        paymentMethod,
        paymentStatus: 'pending',
        providerStatus: 'pending',
        overallStatus: 'pending',
        idempotencyKey,
        couponCode: couponCode ? couponCode.toUpperCase() : '',
        discountAmount
      });

      // Save player ID into user's saved accounts if authenticated
      if (req.user?.id) {
        const primaryPlayerId = playerFields.playerId || Object.values(playerFields)[0] || '';
        await User.findByIdAndUpdate(req.user.id, {
          $addToSet: {
            savedPlayerIds: {
              gameId: game._id,
              gameSlug: game.slug,
              playerId: primaryPlayerId,
              label: `${game.title} Account`
            }
          }
        });
      }

      let paymentDetails: any = null;

      // Wallet Payment Mode
      if (paymentMethod === 'WALLET') {
        if (!req.user?.id) {
          return res.status(400).json({ success: false, message: 'You must be logged in to pay with wallet balance.' });
        }
        const user = await User.findById(req.user.id);
        if (!user || user.walletBalance < finalPrice) {
          return res.status(400).json({ success: false, message: 'Insufficient wallet balance.' });
        }

        user.walletBalance -= finalPrice;
        await user.save();

        order.paymentStatus = 'paid';
        order.overallStatus = 'processing';
        await order.save();

        await Payment.create({
          orderId: order._id,
          paymentMethod: 'WALLET',
          transactionId: `WAL-${Date.now()}`,
          amount: finalPrice,
          currency: 'USD',
          status: 'success',
          paidAt: new Date()
        });

        // Trigger Queue Processing
        await orderQueue.add('fulfill', { orderId: order._id.toString() });

        await TelegramService.notifyPaymentSuccess(order.orderNumber, finalPrice, 'Customer Wallet');

        return res.status(201).json({
          success: true,
          message: 'Order paid using wallet balance. Top-up in progress!',
          data: { order, payment: { type: 'WALLET', paid: true } }
        });
      }

      // ABA PayWay Gateway
      if (paymentMethod === 'ABA_PAYWAY') {
        paymentDetails = await ABAPayWayService.createPaymentCheckout(orderNumber, finalPrice, guestEmail || req.user?.email);
      }

      // Bakong KHQR Gateway
      if (paymentMethod === 'BAKONG_KHQR') {
        paymentDetails = BakongKHQRService.generateKHQR(orderNumber, finalPrice);
      }

      // Create pending Payment record
      await Payment.create({
        orderId: order._id,
        paymentMethod,
        transactionId: paymentDetails?.tranId || paymentDetails?.md5 || orderNumber,
        amount: finalPrice,
        currency: 'USD',
        status: 'pending'
      });

      await TelegramService.notifyNewOrder(orderNumber, game.title, pkg.title, finalPrice);

      res.status(201).json({
        success: true,
        message: 'Order created successfully. Please complete payment.',
        data: {
          order,
          paymentDetails
        }
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getOrderDetails(req: Request, res: Response) {
    try {
      const { orderNumber } = req.params;
      const order = await Order.findOne({ orderNumber }).populate('gameId', 'title thumbnail bannerUrl inputFields');
      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found.' });
      }

      const payment = await Payment.findOne({ orderId: order._id });

      const {
        guestEmail: _guestEmail,
        userId: _userId,
        playerFields: _playerFields,
        costPrice: _costPrice,
        profit: _profit,
        couponCode: _couponCode,
        discountAmount: _discountAmount,
        metadata: _metadata,
        ...publicOrder
      } = order.toObject();

      res.json({
        success: true,
        data: {
          order: publicOrder,
          payment: payment
            ? {
                paymentMethod: payment.paymentMethod,
                amount: payment.amount,
                currency: payment.currency,
                status: payment.status,
                paidAt: payment.paidAt
              }
            : null
        }
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Create master batch order and sub-orders for bulk checkouts
   */
  static async createBulkOrder(req: AuthenticatedRequest, res: Response) {
    try {
      // Check if catalog synchronization lock is enabled
      const settings = await Settings.findOne();
      if (settings?.isSyncing) {
        return res.status(503).json({
          success: false,
          message: CATALOG_SYNC_MESSAGE
        });
      }

      const { gameId, packageId, players, paymentMethod, couponCode, guestEmail } = req.body;
      if (!Array.isArray(players) || players.length === 0) {
        return res.status(400).json({ success: false, message: 'Please provide at least one player account.' });
      }

      // Fetch Game and Package strictly from DB
      const game = await Game.findById(gameId);
      if (!game || game.status !== 'active') {
        return res.status(400).json({ success: false, message: 'Selected game is currently unavailable.' });
      }

      const pkg = await Package.findById(packageId);
      if (!pkg || pkg.status !== 'active') {
        return res.status(400).json({ success: false, message: 'Selected package is out of stock or unavailable.' });
      }

      if (await Settings.exists({ isSyncing: true })) {
        return res.status(503).json({ success: false, message: CATALOG_SYNC_MESSAGE });
      }

      let finalPricePerUnit = pkg.price;
      let discountAmount = 0;

      // Handle Coupon Code discount
      if (couponCode) {
        const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), active: true });
        if (coupon && coupon.expiryDate > new Date() && coupon.usedCount < coupon.maxUses) {
          if (finalPricePerUnit >= coupon.minOrderAmount) {
            if (coupon.discountType === 'percentage') {
              discountAmount = (finalPricePerUnit * coupon.discountValue) / 100;
            } else {
              discountAmount = coupon.discountValue;
            }
            finalPricePerUnit = Math.max(0.01, finalPricePerUnit - discountAmount);
            coupon.usedCount += 1;
            await coupon.save();
          }
        }
      }

      const totalCostPrice = pkg.costPrice * players.length;
      const totalAmount = finalPricePerUnit * players.length;
      const totalProfit = totalAmount - totalCostPrice;

      const parentOrderNumber = `BCH-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;

      // Create Parent Order representing the transaction
      const parentOrder = await Order.create({
        orderNumber: parentOrderNumber,
        userId: req.user?.id || undefined,
        guestEmail: guestEmail || (req.user?.email || 'customer@kiyotopup.com'),
        gameId: game._id,
        packageId: pkg._id,
        playerFields: { count: players.length.toString() }, // simple stats
        gameTitle: game.title,
        packageTitle: `${pkg.title} (Bulk x${players.length})`,
        providerType: pkg.providerType,
        providerProductId: pkg.providerProductId,
        supplierId: pkg.supplierId,
        amount: totalAmount,
        costPrice: totalCostPrice,
        profit: totalProfit,
        paymentMethod,
        paymentStatus: 'pending',
        providerStatus: 'pending',
        overallStatus: 'pending',
        idempotencyKey: crypto.randomUUID(),
        couponCode: couponCode ? couponCode.toUpperCase() : '',
        discountAmount: discountAmount * players.length
      });

      // Save player suborders
      const g2bulkAdapter = new G2BulkAdapter();
      for (const pFields of players) {
        // Validate required dynamic player fields for each item
        for (const field of game.inputFields) {
          if (field.required && (!pFields || !pFields[field.name])) {
            return res.status(400).json({
              success: false,
              message: `Field '${field.label}' is required for all player items.`
            });
          }
        }

        // Verify player credentials against G2Bulk database
        const verification = await g2bulkAdapter.validatePlayer(game.slug, pFields);
        if (!verification.valid) {
          const userId = pFields.userId || pFields.playerId || '';
          return res.status(400).json({
            success: false,
            message: `Player '${userId}' not found in G2Bulk database`
          });
        }

        const subOrderNo = `ORD-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
        await Order.create({
          orderNumber: subOrderNo,
          userId: req.user?.id || undefined,
          guestEmail: guestEmail || (req.user?.email || 'customer@kiyotopup.com'),
          gameId: game._id,
          packageId: pkg._id,
          playerFields: pFields,
          gameTitle: game.title,
          packageTitle: pkg.title,
          providerType: pkg.providerType,
          providerProductId: pkg.providerProductId,
          supplierId: pkg.supplierId,
          amount: finalPricePerUnit,
          costPrice: pkg.costPrice,
          profit: finalPricePerUnit - pkg.costPrice,
          paymentMethod,
          paymentStatus: 'pending',
          providerStatus: 'pending',
          overallStatus: 'pending',
          idempotencyKey: crypto.randomUUID(),
          metadata: { parentOrderNumber: parentOrderNumber }
        });
      }

      // Generate payment gateways integration payloads for parent order total sum
      let paymentDetails: any = null;

      if (paymentMethod === 'ABA_PAYWAY') {
        paymentDetails = await ABAPayWayService.createPaymentCheckout(
          parentOrderNumber,
          totalAmount,
          guestEmail || 'customer@kiyotopup.com'
        );
      } else if (paymentMethod === 'BAKONG_KHQR') {
        const check = BakongKHQRService.generateKHQR(parentOrderNumber, totalAmount);
        
        // Create Parent Payment Record
        await Payment.create({
          orderId: parentOrder._id,
          paymentMethod: 'BAKONG_KHQR',
          transactionId: check.md5,
          amount: totalAmount,
          currency: 'USD',
          status: 'pending'
        });

        paymentDetails = {
          qrString: check.qrString,
          md5: check.md5,
          amount: totalAmount,
          deepLink: check.deepLink
        };
      }

      res.json({
        success: true,
        message: 'Bulk order batch created successfully',
        data: {
          order: parentOrder,
          paymentDetails
        }
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getUserOrders(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

      const orders = await Order.find({ userId: req.user.id }).sort({ createdAt: -1 });
      res.json({ success: true, count: orders.length, data: orders });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Admin Operations
  static async getAllOrders(req: Request, res: Response) {
    try {
      const { status, paymentStatus, search } = req.query;
      const query: any = {};

      if (status) query.overallStatus = status;
      if (paymentStatus) query.paymentStatus = paymentStatus;
      if (search) {
        const safeSearch = String(search).slice(0, 80).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        query.$or = [
          { orderNumber: { $regex: safeSearch, $options: 'i' } },
          { gameTitle: { $regex: safeSearch, $options: 'i' } },
          { guestEmail: { $regex: safeSearch, $options: 'i' } }
        ];
      }

      const orders = await Order.find(query).sort({ createdAt: -1 }).limit(100);
      res.json({ success: true, count: orders.length, data: orders });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async retryOrder(req: AuthenticatedRequest, res: Response) {
    try {
      const { orderId } = req.params;
      const order = await Order.findById(orderId);
      if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

      if (order.paymentStatus !== 'paid') {
        return res.status(409).json({
          success: false,
          message: 'Only verified paid orders can be re-sent to the provider. Confirm payment first.'
        });
      }

      if (order.overallStatus === 'completed' || order.providerStatus === 'success') {
        return res.status(409).json({ success: false, message: 'Completed orders cannot be re-sent.' });
      }

      order.providerStatus = 'processing';
      order.overallStatus = 'processing';
      await order.save();

      await orderQueue.add('fulfill', { orderId: order._id.toString() });
      await AuditService.log('MANUAL_ORDER_RETRY', 'admin', req.user?.id, req.ip, req.headers['user-agent'], { orderId });

      res.json({ success: true, message: 'Order re-queued for provider fulfillment' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
