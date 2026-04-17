import { Router } from 'express';
import activityLogController from '../controllers/activity-log.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';

const router = Router();

// All routes are admin-only
router.get('/', authenticate, authorize('admin'), activityLogController.getAll);
router.get('/:resource/:resourceId', authenticate, authorize('admin'), activityLogController.getByResource);

export default router;
