import { Router } from 'express';
import { SettingController } from '../controllers/setting.controller';
import { authenticateJwt, requirePermission } from '../middleware/auth.middleware';

const router = Router();

router.get('/', SettingController.getSettings);
router.put('/', authenticateJwt, requirePermission('settings:write'), SettingController.updateSettings);

export default router;
