import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticateJwt } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { loginSchema, registerSchema } from '../validation/auth.schemas';

const router = Router();

router.post('/register', validateRequest(registerSchema), AuthController.registerUser);
router.post('/login', validateRequest(loginSchema), AuthController.loginUser);
router.post('/admin/login', validateRequest(loginSchema), AuthController.loginAdmin);
router.get('/me', authenticateJwt, AuthController.getProfile);

export default router;
