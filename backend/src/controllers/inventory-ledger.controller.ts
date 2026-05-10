import { Request, Response, NextFunction } from 'express';
import inventoryLedger from '../services/inventory-ledger.service';
import { AuthenticatedRequest } from '../types';
import { sendSuccess } from '../utils/response.util';

class InventoryLedgerController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await inventoryLedger.getAll(req.query);
      sendSuccess(res, result, 'Inventory fetched');
    } catch (error) {
      next(error);
    }
  }

  async getDashboardStats(_req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await inventoryLedger.getDashboardStats();
      sendSuccess(res, stats, 'Inventory stats fetched');
    } catch (error) {
      next(error);
    }
  }

  async getByProductId(req: Request, res: Response, next: NextFunction) {
    try {
      const inv = await inventoryLedger.getByProductId(req.params.productId);
      sendSuccess(res, inv, inv ? 'Inventory found' : 'No inventory record');
    } catch (error) {
      next(error);
    }
  }

  async getAuditLog(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await inventoryLedger.getAuditLog(req.query);
      sendSuccess(res, result, 'Audit log fetched');
    } catch (error) {
      next(error);
    }
  }

  async addStock(req: Request, res: Response, next: NextFunction) {
    try {
      const adminId = (req as AuthenticatedRequest).user!.userId;
      const result = await inventoryLedger.addStock(req.params.productId, req.body.quantity, req.body.notes || '', adminId);
      sendSuccess(res, result, 'Stock added');
    } catch (error) {
      next(error);
    }
  }

  async removeStock(req: Request, res: Response, next: NextFunction) {
    try {
      const adminId = (req as AuthenticatedRequest).user!.userId;
      const result = await inventoryLedger.removeStock(req.params.productId, req.body.quantity, req.body.notes || '', adminId);
      sendSuccess(res, result, 'Stock removed');
    } catch (error) {
      next(error);
    }
  }

  async adjustStock(req: Request, res: Response, next: NextFunction) {
    try {
      const adminId = (req as AuthenticatedRequest).user!.userId;
      const result = await inventoryLedger.adjustStock(req.params.productId, req.body.newStock, req.body.notes || '', adminId);
      sendSuccess(res, result, 'Stock adjusted');
    } catch (error) {
      next(error);
    }
  }

  async markDamaged(req: Request, res: Response, next: NextFunction) {
    try {
      const adminId = (req as AuthenticatedRequest).user!.userId;
      const result = await inventoryLedger.markDamaged(req.params.productId, req.body.quantity, req.body.notes || '', adminId);
      sendSuccess(res, result, 'Stock marked as damaged');
    } catch (error) {
      next(error);
    }
  }

  async exportCsv(_req: Request, res: Response, next: NextFunction) {
    try {
      const csv = await inventoryLedger.exportStockCsv();
      const filename = `stock-report-${new Date().toISOString().split('T')[0]}.csv`;
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
      res.send(csv);
    } catch (error) {
      next(error);
    }
  }
}

export default new InventoryLedgerController();
