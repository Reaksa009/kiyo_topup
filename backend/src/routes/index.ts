import { Router } from 'express';
import authRoutes from './auth.routes';
import gameRoutes from './game.routes';
import packageRoutes from './package.routes';
import orderRoutes from './order.routes';
import paymentRoutes from './payment.routes';
import webhookRoutes from './webhook.routes';
import providerRoutes from './provider.routes';
import customerRoutes from './customer.routes';
import cmsRoutes from './cms.routes';
import adminRoutes from './admin.routes';
import reportRoutes from './report.routes';
import settingRoutes from './setting.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/games', gameRoutes);
router.use('/packages', packageRoutes);
router.use('/orders', orderRoutes);
router.use('/payments', paymentRoutes);
router.use('/webhooks', webhookRoutes);
router.use('/providers', providerRoutes);
router.use('/customers', customerRoutes);
router.use('/cms', cmsRoutes);
router.use('/admin', adminRoutes);
router.use('/reports', reportRoutes);
router.use('/settings', settingRoutes);

export default router;
