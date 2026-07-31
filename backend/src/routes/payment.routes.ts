import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller';
import { env } from '../config/env';

const router = Router();

router.get('/status/:orderNumber', PaymentController.checkStatus);
if (env.ENABLE_PAYMENT_SIMULATOR && env.NODE_ENV !== 'production') {
  router.post('/simulate', PaymentController.simulateSuccess);
}

export default router;
