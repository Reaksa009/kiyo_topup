import { Router } from 'express';
import { OrderController } from '../controllers/order.controller';
import { authenticateJwt, requirePermission } from '../middleware/auth.middleware';
import { checkIdempotency } from '../middleware/idempotency.middleware';
import { orderRateLimiter } from '../middleware/rateLimiter.middleware';

const router = Router();

// Public / Customer
router.post('/', orderRateLimiter, checkIdempotency, OrderController.createOrder);
router.post('/bulk', checkIdempotency, OrderController.createBulkOrder);
router.get('/my-orders', authenticateJwt, OrderController.getUserOrders);
router.get('/:orderNumber', OrderController.getOrderDetails);

// Admin
router.get('/', authenticateJwt, requirePermission('orders:read'), OrderController.getAllOrders);
router.post('/:orderId/retry', authenticateJwt, requirePermission('orders:write'), OrderController.retryOrder);

export default router;
