import { Router } from 'express';
import { ProviderSyncController } from '../controllers/providerSync.controller';
import { authenticateJwt, requirePermission } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticateJwt);
router.post('/providers/g2bulk/sync/games', requirePermission('catalogue.sync'), ProviderSyncController.syncGames);
router.post('/providers/g2bulk/sync/packages', requirePermission('catalogue.sync'), ProviderSyncController.syncPackages);
router.post('/providers/g2bulk/sync/full', requirePermission('catalogue.sync'), ProviderSyncController.syncFull);
router.get('/providers/g2bulk/sync/status', requirePermission('sync_logs.read'), ProviderSyncController.getStatus);
router.get('/providers/g2bulk/sync/history', requirePermission('sync_logs.read'), ProviderSyncController.getHistory);
export default router;
