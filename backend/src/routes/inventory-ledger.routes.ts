import { Router } from 'express';
import controller from '../controllers/inventory-ledger.controller';
import { authenticate } from '../middleware/auth.middleware';
import { isAdmin } from '../middleware/role.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  addStockSchema,
  removeStockSchema,
  adjustStockSchema,
  markDamagedSchema,
} from '../validators/inventory-ledger.validator';

const router = Router();

// All inventory-ledger routes require admin access
router.use(authenticate, isAdmin);

// Dashboard & list
router.get('/dashboard', controller.getDashboardStats);
router.get('/audit-log', controller.getAuditLog);
router.get('/', controller.getAll);

// CSV export
router.get('/export/csv', controller.exportCsv);

// Per-product operations
router.get('/product/:productId', controller.getByProductId);
router.post('/product/:productId/add', validate(addStockSchema), controller.addStock);
router.post('/product/:productId/remove', validate(removeStockSchema), controller.removeStock);
router.post('/product/:productId/adjust', validate(adjustStockSchema), controller.adjustStock);
router.post('/product/:productId/damaged', validate(markDamagedSchema), controller.markDamaged);

export default router;
