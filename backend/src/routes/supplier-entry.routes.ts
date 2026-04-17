import { Router } from 'express';
import controller from '../controllers/supplier-entry.controller';
import { authenticate } from '../middleware/auth.middleware';
import { isAdmin, isSupplierOrAdmin } from '../middleware/role.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  createEntrySchema,
  convertEntrySchema,
  rejectEntrySchema,
} from '../validators/supplier-entry.validator';

const router = Router();

// All routes require authentication
router.use(authenticate);

// --- Supplier routes (supplier OR admin can submit entries) ---
router.post('/', isSupplierOrAdmin, validate(createEntrySchema), controller.createEntry);
router.get('/my', isSupplierOrAdmin, controller.getMyEntries);

// --- Admin routes ---
router.get('/dashboard', isAdmin, controller.getDashboardStats);
router.get('/all', isAdmin, controller.getAllEntries);
router.get('/:id', isSupplierOrAdmin, controller.getEntryById);
router.post('/:id/convert', isAdmin, validate(convertEntrySchema), controller.convertEntry);
router.post('/:id/reject', isAdmin, validate(rejectEntrySchema), controller.rejectEntry);

export default router;
