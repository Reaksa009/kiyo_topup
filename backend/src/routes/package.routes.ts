import { Router } from 'express';
import { PackageController } from '../controllers/package.controller';
import { authenticateJwt, requirePermission } from '../middleware/auth.middleware';

const router = Router();

router.get('/game/:gameId', PackageController.getPackagesByGame);
router.post('/', authenticateJwt, requirePermission('games:write'), PackageController.createPackage);
router.put('/:id', authenticateJwt, requirePermission('games:write'), PackageController.updatePackage);
router.delete('/:id', authenticateJwt, requirePermission('games:write'), PackageController.deletePackage);

export default router;
