import { Router } from 'express';
import { OrderController } from '../controllers/order.controller';
import { authenticateJwt, requirePermission } from '../middleware/auth.middleware';
import { checkIdempotency } from '../middleware/idempotency.middleware';
import { orderRateLimiter } from '../middleware/rateLimiter.middleware';
import { catalogSyncGuard } from '../middleware/catalogSync.middleware';

const router = Router();

// Public / Customer
router.post('/', catalogSyncGuard, orderRateLimiter, checkIdempotency, OrderController.createOrder);
router.post('/bulk', catalogSyncGuard, checkIdempotency, OrderController.createBulkOrder);
router.get('/my-orders', authenticateJwt, OrderController.getUserOrders);
router.get('/admin/price-reviews', authenticateJwt, requirePermission('orders:read'), OrderController.getPriceReviewOrders);
router.post('/admin/:orderId/price-review/:decision', authenticateJwt, requirePermission('orders:write'), OrderController.decidePriceReview);
router.get('/:orderNumber', OrderController.getOrderDetails);

// Admin
router.get('/', authenticateJwt, requirePermission('orders:read'), OrderController.getAllOrders);
router.post('/:orderId/retry', catalogSyncGuard, authenticateJwt, requirePermission('orders:write'), OrderController.retryOrder);

export default router;
