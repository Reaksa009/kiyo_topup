import { Router } from 'express';
import { ProviderController } from '../controllers/provider.controller';
import { authenticateJwt, requirePermission } from '../middleware/auth.middleware';

const router = Router();

router.get('/balance/:providerType?', authenticateJwt, requirePermission('settings:read'), ProviderController.getBalance);
router.get('/logs', authenticateJwt, requirePermission('settings:read'), ProviderController.getLogs);

export default router;
