import { Router } from 'express';
import inventoryController from '../controllers/inventory.controller';
import { authenticate } from '../middleware/auth.middleware';
import { canAccessPurchase, canAccessAdminOnly } from '../middleware/role.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  createWarehouseSchema,
  updateWarehouseSchema,
  updateStockSchema,
  bulkUpdateStockSchema,
} from '../validators/inventory.validator';

const router = Router();

// All inventory routes require purchase or admin access
router.use(authenticate, canAccessPurchase);

// Dashboard
router.get('/dashboard', canAccessPurchase, inventoryController.getDashboardStats);

// Forecasting
router.get('/forecasts', canAccessPurchase, inventoryController.getForecasts);
router.post('/forecasts/generate', canAccessPurchase, inventoryController.generateForecasts);

// Alerts
router.get('/alerts', canAccessPurchase, inventoryController.getAlerts);
router.post('/alerts/check', canAccessPurchase, inventoryController.checkAlerts);
router.put('/alerts/:id/acknowledge', canAccessPurchase, inventoryController.acknowledgeAlert);

// Movements
router.get('/movements', canAccessPurchase, inventoryController.getMovements);

// Stock
router.get('/stock', canAccessPurchase, inventoryController.getStockOverview);
router.post('/stock/update', canAccessPurchase, validate(updateStockSchema), inventoryController.updateStock);
router.post('/stock/bulk-update', canAccessPurchase, validate(bulkUpdateStockSchema), inventoryController.bulkUpdateStock);

// Warehouses
router.get('/warehouses', canAccessPurchase, inventoryController.getWarehouses);
router.get('/warehouses/:id', canAccessPurchase, inventoryController.getWarehouseById);
router.get('/warehouses/:id/stock', canAccessPurchase, inventoryController.getWarehouseStock);
router.post('/warehouses', canAccessPurchase, validate(createWarehouseSchema), inventoryController.createWarehouse);
router.put('/warehouses/:id', canAccessPurchase, validate(updateWarehouseSchema), inventoryController.updateWarehouse);
router.delete('/warehouses/:id', canAccessAdminOnly, inventoryController.deleteWarehouse);

export default router;
