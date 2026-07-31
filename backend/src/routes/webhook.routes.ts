import { Router } from 'express';
import { WebhookController } from '../controllers/webhook.controller';
import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

const router = Router();

const requireSecret = (secret: string) => (req: Request, res: Response, next: NextFunction) => {
  const provided = req.get('x-webhook-secret') || req.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!secret || !provided || provided.length !== secret.length || !crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(secret))) {
    return res.status(401).json({ success: false, message: 'Invalid webhook credentials.' });
  }
  next();
};

router.post('/aba-payway', WebhookController.handleABAPayWay);
router.post('/bakong-khqr', requireSecret(env.BAKONG_WEBHOOK_SECRET), WebhookController.handleBakongKHQR);
router.post('/g2bulk', requireSecret(env.G2BULK_WEBHOOK_SECRET), WebhookController.handleProviderCallback);

export default router;
