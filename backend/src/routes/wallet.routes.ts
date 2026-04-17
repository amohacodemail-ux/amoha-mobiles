import { Router } from 'express';
import walletController from '../controllers/wallet.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';

const router = Router();

// User routes
router.get('/balance', authenticate, walletController.getBalance);
router.get('/transactions', authenticate, walletController.getTransactions);

// Admin routes
router.get('/admin/all', authenticate, authorize('admin'), walletController.getAllWallets);
router.post('/admin/credit', authenticate, authorize('admin'), walletController.adminCredit);

export default router;
