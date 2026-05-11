import { Router } from 'express';
import controller from '../controllers/supplier-entry.controller';
import { authenticate } from '../middleware/auth.middleware';
import { canAccessPurchase, canAccessAdminOnly, canAccessSupplier } from '../middleware/role.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  createEntrySchema,
  convertEntrySchema,
  rejectEntrySchema,
} from '../validators/supplier-entry.validator';

const router = Router();

// All routes require authentication
router.use(authenticate);

// --- Supplier routes (supplier OR purchase/admin can submit entries) ---
router.post('/', canAccessSupplier, validate(createEntrySchema), controller.createEntry);
router.get('/my', canAccessSupplier, controller.getMyEntries);

// --- Purchase & Admin routes ---
router.get('/dashboard', canAccessPurchase, controller.getDashboardStats);
router.get('/all', canAccessPurchase, controller.getAllEntries);
router.get('/:id', canAccessPurchase, controller.getEntryById);
router.post('/:id/convert', canAccessPurchase, validate(convertEntrySchema), controller.convertEntry);
router.post('/:id/reject', canAccessAdminOnly, validate(rejectEntrySchema), controller.rejectEntry);

export default router;
