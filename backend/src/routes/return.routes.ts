import { Router } from 'express';
import returnController from '../controllers/return.controller';
import { authenticate } from '../middleware/auth.middleware';
import { canAccessSales, canAccessAdminOnly } from '../middleware/role.middleware';

const router = Router();

// User routes (frontend - any authenticated user)
router.post('/', authenticate, returnController.createReturn);
router.get('/', authenticate, returnController.getUserReturns);
router.get('/:id', authenticate, returnController.getReturnById);

// Admin routes - Sales & Admin only
router.get('/admin/all', authenticate, canAccessSales, returnController.getAllReturns);
router.get('/admin/stats', authenticate, canAccessSales, returnController.getReturnStats);
router.patch('/admin/:id/status', authenticate, canAccessSales, returnController.updateReturnStatus);

export default router;
