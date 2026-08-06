import { Queue, Worker, Job } from 'bullmq';
import { redisClient } from '../config/redis';
import { Order } from '../models/Order';
import { Package } from '../models/Package';
import { ProviderOrder } from '../models/Provider';
import { ProviderFactory } from '../services/providers/ProviderFactory';
import { TelegramService } from '../services/telegram.service';
import { logger } from '../utils/logger';
import { Server as SocketServer } from 'socket.io';

export const ORDER_QUEUE_NAME = 'order-fulfillment-queue';

let ioInstance: SocketServer | null = null;
let queueInstance: Queue | null = null;
let isRedisOffline = false;

export const setSocketInstance = (io: SocketServer) => {
  ioInstance = io;
};

// Lazy getter for BullMQ Queue to prevent startup crashes when Redis is offline
const getOrderQueue = (): Queue | null => {
  if (isRedisOffline) return null;
  if (!queueInstance) {
    try {
      queueInstance = new Queue(ORDER_QUEUE_NAME, {
        connection: redisClient as any,
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000
          },
          removeOnComplete: 100,
          removeOnFail: 500
        }
      });
      queueInstance.on('error', (err) => {
        logger.warn(`BullMQ Queue error detected: ${err.message}`);
      });
    } catch (err: any) {
      logger.warn(`Failed to initialize BullMQ Queue: ${err.message}. Fallback mode active.`);
      isRedisOffline = true;
      return null;
    }
  }
  return queueInstance;
};

// Core order fulfillment execution logic
export const processOrderFulfillment = async (orderId: string) => {
  logger.info(`[Fulfillment Engine] Processing order fulfillment for orderId: ${orderId}`);

  const order = await Order.findById(orderId);
  if (!order) {
    throw new Error(`Order ${orderId} not found in database`);
  }

  if (order.paymentStatus !== 'paid') {
    logger.warn(`Order ${order.orderNumber} is not marked paid. Aborting provider request.`);
    return;
  }

  if (order.priceReviewStatus === 'required' || order.overallStatus === 'price_review_required') {
    logger.warn(`Order ${order.orderNumber} is awaiting price review. Aborting provider request.`);
    return;
  }

  // Mark status as processing
  order.providerStatus = 'processing';
  order.overallStatus = 'processing';
  await order.save();

  if (ioInstance) {
    ioInstance.emit(`order_update_${order.orderNumber}`, {
      orderNumber: order.orderNumber,
      overallStatus: 'processing',
      providerStatus: 'processing'
    });
  }

  const pkg = await Package.findById(order.packageId);
  const providerType = order.providerType || pkg?.providerType || 'G2BULK';
  const providerProductId = order.providerProductId || pkg?.providerProductId;
  if (!providerProductId) {
    throw new Error(`Order ${order.orderNumber} has no provider product snapshot and its package no longer exists.`);
  }

  const provider = ProviderFactory.getProvider(providerType);

  // Create tracking ProviderOrder
  const providerOrder = await ProviderOrder.create({
    orderId: order._id,
    providerType,
    providerProductId,
    costPrice: order.costPrice,
    status: 'processing'
  });

  // Convert playerFields map to plain object
  const playerFieldsObj: Record<string, string> = {};
  if (order.playerFields instanceof Map) {
    order.playerFields.forEach((val, key) => {
      playerFieldsObj[key] = val;
    });
  } else {
    Object.assign(playerFieldsObj, order.playerFields);
  }

  // Submit order to G2Bulk provider
  const response = await provider.submitOrder({
    orderNumber: order.orderNumber,
    productId: providerProductId,
    playerFields: playerFieldsObj
  });

  if (response.success) {
    providerOrder.externalOrderId = response.externalOrderId || '';
    providerOrder.status = 'success';
    providerOrder.responseData = response.rawResponse;
    await providerOrder.save();

    order.providerStatus = 'success';
    order.overallStatus = 'completed';
    await order.save();

    logger.info(`[Fulfillment Engine] Order ${order.orderNumber} top-up completed successfully!`);

    // Notify Telegram & WebSockets
    await TelegramService.notifyOrderCompleted(order.orderNumber, order.gameTitle, order.profit);

    if (ioInstance) {
      ioInstance.emit(`order_update_${order.orderNumber}`, {
        orderNumber: order.orderNumber,
        overallStatus: 'completed',
        providerStatus: 'success',
        completedAt: new Date()
      });
    }
  } else {
    providerOrder.status = 'failed';
    providerOrder.errorMessage = response.message || 'Provider top-up failed';
    providerOrder.responseData = response.rawResponse;
    await providerOrder.save();

    order.providerStatus = 'failed';
    order.overallStatus = 'failed';
    order.failureReason = response.message || 'Provider submission error';
    await order.save();

    logger.error(`[Fulfillment Engine] Order ${order.orderNumber} failed at provider: ${response.message}`);

    await TelegramService.notifyOrderFailed(order.orderNumber, response.message || 'Fulfillment error');

    if (ioInstance) {
      ioInstance.emit(`order_update_${order.orderNumber}`, {
        orderNumber: order.orderNumber,
        overallStatus: 'failed',
        providerStatus: 'failed',
        failureReason: order.failureReason
      });
    }
  }
};

// Mock queue interface with identical signature to prevent controller refactoring
export const orderQueue = {
  add: async (jobName: string, data: { orderId: string }) => {
    const queue = process.env.VERCEL === '1' ? null : getOrderQueue();
    // Use BullMQ if Redis is ready/connecting and not in Vercel, otherwise execute synchronously in background
    const useQueue = queue && 
                     (redisClient.status === 'ready' || redisClient.status === 'connecting') &&
                     !process.env.VERCEL;

    if (useQueue) {
      try {
        await queue.add(jobName, data);
        logger.info(`[Queue Manager] Added order job to BullMQ queue: ${data.orderId}`);
        return;
      } catch (err: any) {
        logger.warn(`[Queue Manager] BullMQ add job failed: ${err.message}. Falling back to sync execution.`);
      }
    }

    // Direct background sync execution
    logger.info(`[Queue Manager] Processing order ${data.orderId} synchronously (Vercel/Offline Fallback)`);
    processOrderFulfillment(data.orderId).catch(err => {
      logger.error(`[Queue Manager Fallback] Sync fulfillment failed for order ${data.orderId}:`, err.message);
    });
  }
};

// Boot up BullMQ worker conditionally only if Redis is available
export const initOrderWorker = () => {
  if (redisClient.status !== 'ready' && redisClient.status !== 'connecting') {
    logger.warn('Redis is offline. BullMQ Worker skipped. Sync fallback active.');
    return null;
  }

  try {
    const worker = new Worker(
      ORDER_QUEUE_NAME,
      async (job: Job<{ orderId: string }>) => {
        await processOrderFulfillment(job.data.orderId);
      },
      { connection: redisClient as any }
    );

    worker.on('failed', (job, err) => {
      logger.error(`[Queue Worker] Job ${job?.id} failed with error:`, err.message);
    });

    return worker;
  } catch (err: any) {
    logger.warn(`Failed to initialize BullMQ Worker: ${err.message}. Sync fallback active.`);
    return null;
  }
};
