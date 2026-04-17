import { Request, Response, NextFunction } from 'express';
import supplierService from '../services/supplier.service';
import { sendSuccess, sendCreated, sendMessage } from '../utils/response.util';

interface AuthenticatedRequest extends Request {
  user?: { userId: string; role: string };
}

class SupplierController {
  // ==================== Suppliers CRUD ====================

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await supplierService.getAll(req.query);
      sendSuccess(res, result, 'Suppliers fetched');
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const supplier = await supplierService.getById(req.params.id);
      sendSuccess(res, supplier, 'Supplier fetched');
    } catch (error) {
      next(error);
    }
  }

  async getMyProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const supplier = await supplierService.getMyProfile(req.user?.userId || '');
      sendSuccess(res, supplier, 'Supplier profile fetched');
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const supplier = await supplierService.create(req.body);
      sendCreated(res, supplier, 'Supplier created');
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const supplier = await supplierService.update(req.params.id, req.body);
      sendSuccess(res, supplier, 'Supplier updated');
    } catch (error) {
      next(error);
    }
  }

  async updateMyProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const supplier = await supplierService.updateMyProfile(req.user?.userId || '', req.body);
      sendSuccess(res, supplier, 'Supplier profile updated');
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await supplierService.delete(req.params.id);
      sendMessage(res, 'Supplier deleted');
    } catch (error) {
      next(error);
    }
  }

  // ==================== Supplier Products ====================

  async assignProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const mapping = await supplierService.assignProduct(req.params.id, req.body);
      sendCreated(res, mapping, 'Product assigned to supplier');
    } catch (error) {
      next(error);
    }
  }

  async removeProduct(req: Request, res: Response, next: NextFunction) {
    try {
      await supplierService.removeProduct(req.params.id, req.params.productId);
      sendMessage(res, 'Product removed from supplier');
    } catch (error) {
      next(error);
    }
  }

  async getSupplierProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const products = await supplierService.getSupplierProducts(req.params.id);
      sendSuccess(res, products, 'Supplier products fetched');
    } catch (error) {
      next(error);
    }
  }

  // ==================== Purchase Orders ====================

  async getAllPurchaseOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await supplierService.getAllPurchaseOrders(req.query);
      sendSuccess(res, result, 'Purchase orders fetched');
    } catch (error) {
      next(error);
    }
  }

  async getPurchaseOrderById(req: Request, res: Response, next: NextFunction) {
    try {
      const po = await supplierService.getPurchaseOrderById(req.params.id);
      sendSuccess(res, po, 'Purchase order fetched');
    } catch (error) {
      next(error);
    }
  }

  async createPurchaseOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as AuthenticatedRequest).user?.userId || '';
      const po = await supplierService.createPurchaseOrder(req.body, userId);
      sendCreated(res, po, 'Purchase order created');
    } catch (error) {
      next(error);
    }
  }

  async updatePurchaseOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const po = await supplierService.updatePurchaseOrder(req.params.id, req.body);
      sendSuccess(res, po, 'Purchase order updated');
    } catch (error) {
      next(error);
    }
  }

  async receivePurchaseOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const po = await supplierService.receivePurchaseOrder(req.params.id, req.body.items);
      sendSuccess(res, po, 'Items received successfully');
    } catch (error) {
      next(error);
    }
  }

  // ==================== Analytics ====================

  async getAnalytics(_req: Request, res: Response, next: NextFunction) {
    try {
      const analytics = await supplierService.getSupplierAnalytics();
      sendSuccess(res, analytics, 'Supplier analytics fetched');
    } catch (error) {
      next(error);
    }
  }

  async getDashboardStats(_req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await supplierService.getDashboardStats();
      sendSuccess(res, stats, 'Supplier dashboard stats fetched');
    } catch (error) {
      next(error);
    }
  }
}

export default new SupplierController();
