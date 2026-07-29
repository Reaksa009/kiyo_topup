import { Router } from 'express';
import { GameController } from '../controllers/game.controller';
import { authenticateJwt, requirePermission } from '../middleware/auth.middleware';

const router = Router();

// Public
router.get('/', GameController.getGames);
router.get('/categories', GameController.getCategories);
router.post('/verify-player', GameController.verifyPlayer);
router.get('/:slug', GameController.getGameBySlug);

// Admin
router.post('/', authenticateJwt, requirePermission('games:write'), GameController.createGame);
router.put('/:id', authenticateJwt, requirePermission('games:write'), GameController.updateGame);
router.delete('/:id', authenticateJwt, requirePermission('games:write'), GameController.deleteGame);

export default router;
