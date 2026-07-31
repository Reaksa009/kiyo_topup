import { Router } from 'express';
import { GameController } from '../controllers/game.controller';
import { authenticateJwt, requirePermission } from '../middleware/auth.middleware';
import { catalogSyncGuard } from '../middleware/catalogSync.middleware';

const router = Router();

// Public
router.get('/', catalogSyncGuard, GameController.getGames);
router.get('/categories', GameController.getCategories);
router.post('/verify-player', catalogSyncGuard, GameController.verifyPlayer);
router.get('/:slug', catalogSyncGuard, GameController.getGameBySlug);

// Admin
router.post('/', authenticateJwt, requirePermission('games:write'), GameController.createGame);
router.put('/:id', authenticateJwt, requirePermission('games:write'), GameController.updateGame);
router.delete('/:id', authenticateJwt, requirePermission('games:write'), GameController.deleteGame);

export default router;
