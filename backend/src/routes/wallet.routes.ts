import { Router } from 'express';
import walletController from '../controllers/wallet.controller';
import { authenticate } from '../middleware/auth.middleware';
import { canAccessSales, canAccessAdminOnly } from '../middleware/role.middleware';

const router = Router();

// User routes (frontend - any authenticated user)
router.get('/balance', authenticate, walletController.getBalance);
router.get('/transactions', authenticate, walletController.getTransactions);

// Admin routes - Sales & Admin only
router.get('/admin/all', authenticate, canAccessSales, walletController.getAllWallets);
router.post('/admin/credit', authenticate, canAccessAdminOnly, walletController.adminCredit);

export default router;
