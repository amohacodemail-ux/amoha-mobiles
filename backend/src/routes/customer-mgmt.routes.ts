import { Router } from 'express';
import customerMgmtController from '../controllers/customer-mgmt.controller';
import { authenticate } from '../middleware/auth.middleware';
import { isAdmin } from '../middleware/role.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  updateSegmentSchema,
  addTagSchema,
  addNoteSchema,
  createFraudFlagSchema,
  resolveFraudFlagSchema,
} from '../validators/customer-mgmt.validator';

const router = Router();

// All routes require admin access
router.use(authenticate, isAdmin);

// Dashboard
router.get('/dashboard', customerMgmtController.getDashboardStats);

// Fraud detection
router.get('/fraud-flags', customerMgmtController.getFraudFlags);
router.post('/fraud-flags', validate(createFraudFlagSchema), customerMgmtController.createFraudFlag);
router.post('/fraud-flags/:flagId/resolve', validate(resolveFraudFlagSchema), customerMgmtController.resolveFraudFlag);
router.post('/fraud-detection/run', customerMgmtController.runFraudDetection);

// Auto-segmentation
router.post('/auto-segment', customerMgmtController.autoSegment);

// Customer CRUD / Detail
router.get('/', customerMgmtController.getAll);
router.get('/:id', customerMgmtController.getDetail);
router.get('/:id/behavior', customerMgmtController.getBehaviorAnalytics);

// Segmentation
router.put('/:id/segment', validate(updateSegmentSchema), customerMgmtController.updateSegment);

// Tags
router.post('/:id/tags', validate(addTagSchema), customerMgmtController.addTag);
router.delete('/:id/tags/:tagId', customerMgmtController.removeTag);

// Notes
router.post('/:id/notes', validate(addNoteSchema), customerMgmtController.addNote);
router.put('/notes/:noteId', customerMgmtController.updateNote);
router.delete('/notes/:noteId', customerMgmtController.deleteNote);

export default router;
