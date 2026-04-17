import { Request, Response, NextFunction } from 'express';
import inventoryService from '../services/inventory.service';
import { sendSuccess, sendCreated, sendMessage } from '../utils/response.util';

interface AuthenticatedRequest extends Request {
  user?: { userId: string; role: string };
}

class InventoryController {
  // ==================== Warehouses ====================

  async getWarehouses(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await inventoryService.getWarehouses(req.query);
      sendSuccess(res, result, 'Warehouses fetched');
    } catch (error) {
      next(error);
    }
  }

  async getWarehouseById(req: Request, res: Response, next: NextFunction) {
    try {
      const warehouse = await inventoryService.getWarehouseById(req.params.id);
      sendSuccess(res, warehouse, 'Warehouse fetched');
    } catch (error) {
      next(error);
    }
  }

  async createWarehouse(req: Request, res: Response, next: NextFunction) {
    try {
      const warehouse = await inventoryService.createWarehouse(req.body);
      sendCreated(res, warehouse, 'Warehouse created');
    } catch (error) {
      next(error);
    }
  }

  async updateWarehouse(req: Request, res: Response, next: NextFunction) {
    try {
      const warehouse = await inventoryService.updateWarehouse(req.params.id, req.body);
      sendSuccess(res, warehouse, 'Warehouse updated');
    } catch (error) {
      next(error);
    }
  }

  async deleteWarehouse(req: Request, res: Response, next: NextFunction) {
    try {
      await inventoryService.deleteWarehouse(req.params.id);
      sendMessage(res, 'Warehouse deleted');
    } catch (error) {
      next(error);
    }
  }

  // ==================== Stock ====================

  async getStockOverview(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await inventoryService.getStockOverview(req.query);
      sendSuccess(res, result, 'Stock overview fetched');
    } catch (error) {
      next(error);
    }
  }

  async getWarehouseStock(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await inventoryService.getWarehouseStock(req.params.id, req.query);
      sendSuccess(res, result, 'Warehouse stock fetched');
    } catch (error) {
      next(error);
    }
  }

  async updateStock(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as AuthenticatedRequest).user?.userId || '';
      const result = await inventoryService.updateStock(
        req.body.productId, req.body.quantity, req.body.type, userId, req.body.notes, req.body.warehouseId
      );
      sendSuccess(res, result, 'Stock updated');
    } catch (error) {
      next(error);
    }
  }

  async bulkUpdateStock(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as AuthenticatedRequest).user?.userId || '';
      const results = await inventoryService.bulkUpdateStock(req.body.items, userId);
      sendSuccess(res, results, 'Bulk stock update complete');
    } catch (error) {
      next(error);
    }
  }

  // ==================== Movements ====================

  async getMovements(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await inventoryService.getMovements(req.query);
      sendSuccess(res, result, 'Movements fetched');
    } catch (error) {
      next(error);
    }
  }

  // ==================== Alerts ====================

  async getAlerts(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await inventoryService.getAlerts(req.query);
      sendSuccess(res, result, 'Stock alerts fetched');
    } catch (error) {
      next(error);
    }
  }

  async acknowledgeAlert(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as AuthenticatedRequest).user?.userId || '';
      const alert = await inventoryService.acknowledgeAlert(req.params.id, userId);
      sendSuccess(res, alert, 'Alert acknowledged');
    } catch (error) {
      next(error);
    }
  }

  async checkAlerts(_req: Request, res: Response, next: NextFunction) {
    try {
      const result = await inventoryService.checkAndCreateAlerts();
      sendSuccess(res, result, 'Alert check complete');
    } catch (error) {
      next(error);
    }
  }

  // ==================== Forecasting ====================

  async getForecasts(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await inventoryService.getForecasts(req.query);
      sendSuccess(res, result, 'Forecasts fetched');
    } catch (error) {
      next(error);
    }
  }

  async generateForecasts(_req: Request, res: Response, next: NextFunction) {
    try {
      const result = await inventoryService.generateForecasts();
      sendSuccess(res, result, 'Forecasts generated');
    } catch (error) {
      next(error);
    }
  }

  // ==================== Dashboard ====================

  async getDashboardStats(_req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await inventoryService.getDashboardStats();
      sendSuccess(res, stats, 'Inventory dashboard stats fetched');
    } catch (error) {
      next(error);
    }
  }
}

export default new InventoryController();
