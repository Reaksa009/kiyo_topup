import { Router } from 'express';
import { CustomerController } from '../controllers/customer.controller';
import { authenticateJwt, requirePermission } from '../middleware/auth.middleware';

const router = Router();

router.get('/saved-accounts', authenticateJwt, CustomerController.getSavedAccounts);
router.get('/', authenticateJwt, requirePermission('customers:read'), CustomerController.getAllCustomers);
router.put('/:customerId/balance', authenticateJwt, requirePermission('customers:write'), CustomerController.updateBalance);

export default router;
