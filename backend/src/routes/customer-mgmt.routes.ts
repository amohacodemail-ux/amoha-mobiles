import { Router } from 'express';
import customerMgmtController from '../controllers/customer-mgmt.controller';
import { authenticate } from '../middleware/auth.middleware';
import { canAccessMarketing, canAccessAdminOnly } from '../middleware/role.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  updateSegmentSchema,
  addTagSchema,
  addNoteSchema,
  createFraudFlagSchema,
  resolveFraudFlagSchema,
} from '../validators/customer-mgmt.validator';

const router = Router();

// All routes require marketing or admin access
router.use(authenticate, canAccessMarketing);

// Dashboard
router.get('/dashboard', customerMgmtController.getDashboardStats);

// Fraud detection - Admin only
router.get('/fraud-flags', canAccessAdminOnly, customerMgmtController.getFraudFlags);
router.post('/fraud-flags', canAccessAdminOnly, validate(createFraudFlagSchema), customerMgmtController.createFraudFlag);
router.post('/fraud-flags/:flagId/resolve', canAccessAdminOnly, validate(resolveFraudFlagSchema), customerMgmtController.resolveFraudFlag);
router.post('/fraud-detection/run', canAccessAdminOnly, customerMgmtController.runFraudDetection);

// Auto-segmentation - Admin only
router.post('/auto-segment', canAccessAdminOnly, customerMgmtController.autoSegment);

// Customer CRUD / Detail - Marketing & Admin
router.get('/', canAccessMarketing, customerMgmtController.getAll);
router.get('/:id', canAccessMarketing, customerMgmtController.getDetail);
router.get('/:id/behavior', canAccessMarketing, customerMgmtController.getBehaviorAnalytics);

// Segmentation - Marketing & Admin
router.put('/:id/segment', canAccessMarketing, validate(updateSegmentSchema), customerMgmtController.updateSegment);

// Tags - Marketing & Admin
router.post('/:id/tags', canAccessMarketing, validate(addTagSchema), customerMgmtController.addTag);
router.delete('/:id/tags/:tagId', canAccessAdminOnly, customerMgmtController.removeTag);

// Notes - Marketing & Admin
router.post('/:id/notes', canAccessMarketing, validate(addNoteSchema), customerMgmtController.addNote);
router.put('/notes/:noteId', canAccessMarketing, customerMgmtController.updateNote);
router.delete('/notes/:noteId', canAccessAdminOnly, customerMgmtController.deleteNote);

export default router;
