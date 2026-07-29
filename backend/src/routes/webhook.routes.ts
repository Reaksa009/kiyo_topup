import { Router } from 'express';
import { WebhookController } from '../controllers/webhook.controller';

const router = Router();

router.post('/aba-payway', WebhookController.handleABAPayWay);
router.post('/bakong-khqr', WebhookController.handleBakongKHQR);
router.post('/g2bulk', WebhookController.handleProviderCallback);

export default router;
