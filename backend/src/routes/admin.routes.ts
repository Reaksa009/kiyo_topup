import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { OperationsController } from '../controllers/operations.controller';
import { authenticateJwt, requirePermission } from '../middleware/auth.middleware';

const router = Router();

router.get('/metrics', authenticateJwt, requirePermission('dashboard:read'), AdminController.getDashboardMetrics);
router.get('/operations', authenticateJwt, requirePermission('dashboard:read'), OperationsController.getOperationsSummary);
router.post('/catalog-sync', authenticateJwt, requirePermission('games:write'), OperationsController.runCatalogSync);
router.get('/roles', authenticateJwt, requirePermission('rbac:read'), AdminController.getRoles);
router.post('/roles', authenticateJwt, requirePermission('rbac:write'), AdminController.createRole);
router.get('/logs', authenticateJwt, requirePermission('settings:read'), AdminController.getActivityLogs);

export default router;
