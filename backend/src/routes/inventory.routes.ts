import { Router } from 'express';
import inventoryController from '../controllers/inventory.controller';
import { authenticate } from '../middleware/auth.middleware';
import { isAdmin } from '../middleware/role.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  createWarehouseSchema,
  updateWarehouseSchema,
  updateStockSchema,
  bulkUpdateStockSchema,
} from '../validators/inventory.validator';

const router = Router();

// All inventory routes require admin access
router.use(authenticate, isAdmin);

// Dashboard
router.get('/dashboard', inventoryController.getDashboardStats);

// Forecasting
router.get('/forecasts', inventoryController.getForecasts);
router.post('/forecasts/generate', inventoryController.generateForecasts);

// Alerts
router.get('/alerts', inventoryController.getAlerts);
router.post('/alerts/check', inventoryController.checkAlerts);
router.put('/alerts/:id/acknowledge', inventoryController.acknowledgeAlert);

// Movements
router.get('/movements', inventoryController.getMovements);

// Stock
router.get('/stock', inventoryController.getStockOverview);
router.post('/stock/update', validate(updateStockSchema), inventoryController.updateStock);
router.post('/stock/bulk-update', validate(bulkUpdateStockSchema), inventoryController.bulkUpdateStock);

// Warehouses
router.get('/warehouses', inventoryController.getWarehouses);
router.get('/warehouses/:id', inventoryController.getWarehouseById);
router.get('/warehouses/:id/stock', inventoryController.getWarehouseStock);
router.post('/warehouses', validate(createWarehouseSchema), inventoryController.createWarehouse);
router.put('/warehouses/:id', validate(updateWarehouseSchema), inventoryController.updateWarehouse);
router.delete('/warehouses/:id', inventoryController.deleteWarehouse);

export default router;
