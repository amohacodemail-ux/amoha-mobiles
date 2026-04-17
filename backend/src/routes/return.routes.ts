import { Router } from 'express';
import returnController from '../controllers/return.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';

const router = Router();

// User routes
router.post('/', authenticate, returnController.createReturn);
router.get('/', authenticate, returnController.getUserReturns);
router.get('/:id', authenticate, returnController.getReturnById);

// Admin routes
router.get('/admin/all', authenticate, authorize('admin'), returnController.getAllReturns);
router.get('/admin/stats', authenticate, authorize('admin'), returnController.getReturnStats);
router.patch('/admin/:id/status', authenticate, authorize('admin'), returnController.updateReturnStatus);

export default router;
