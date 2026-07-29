import { Router } from 'express';
import { ReportController } from '../controllers/report.controller';
import { authenticateJwt, requirePermission } from '../middleware/auth.middleware';

const router = Router();

router.get('/revenue', authenticateJwt, requirePermission('reports:read'), ReportController.getRevenueReport);

export default router;
