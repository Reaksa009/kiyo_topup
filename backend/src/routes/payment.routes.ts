import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller';

const router = Router();

router.get('/status/:orderNumber', PaymentController.checkStatus);
router.post('/simulate', PaymentController.simulateSuccess);

export default router;
