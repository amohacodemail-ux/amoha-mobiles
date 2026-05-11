import { Router } from 'express';
import controller from '../controllers/inventory-ledger.controller';
import { authenticate } from '../middleware/auth.middleware';
import { canAccessPurchase, canAccessAdminOnly } from '../middleware/role.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  addStockSchema,
  removeStockSchema,
  adjustStockSchema,
  markDamagedSchema,
} from '../validators/inventory-ledger.validator';

const router = Router();

// All inventory-ledger routes require purchase or admin access
router.use(authenticate, canAccessPurchase);

// Dashboard & list
router.get('/dashboard', canAccessPurchase, controller.getDashboardStats);
router.get('/audit-log', canAccessAdminOnly, controller.getAuditLog);
router.get('/', canAccessPurchase, controller.getAll);

// CSV export - Admin only
router.get('/export/csv', canAccessAdminOnly, controller.exportCsv);

// Per-product operations
router.get('/product/:productId', canAccessPurchase, controller.getByProductId);
router.post('/product/:productId/add', canAccessPurchase, validate(addStockSchema), controller.addStock);
router.post('/product/:productId/remove', canAccessPurchase, validate(removeStockSchema), controller.removeStock);
router.post('/product/:productId/adjust', canAccessPurchase, validate(adjustStockSchema), controller.adjustStock);
router.post('/product/:productId/damaged', canAccessPurchase, validate(markDamagedSchema), controller.markDamaged);

export default router;
