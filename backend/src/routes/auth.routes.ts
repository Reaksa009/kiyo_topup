import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticateJwt } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', AuthController.registerUser);
router.post('/login', AuthController.loginUser);
router.post('/admin/login', AuthController.loginAdmin);
router.get('/me', authenticateJwt, AuthController.getProfile);

export default router;
