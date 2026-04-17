import { Request, Response, NextFunction } from 'express';
import supplierEntryService from '../services/supplier-entry.service';
import { AuthenticatedRequest } from '../types';
import { sendSuccess, sendCreated, sendMessage } from '../utils/response.util';

class SupplierEntryController {
  // ==================== Supplier actions ====================

  async createEntry(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as AuthenticatedRequest).user!.userId;
      const entry = await supplierEntryService.createEntry(userId, req.body);
      sendCreated(res, entry, 'Supplier entry submitted');
    } catch (error) {
      next(error);
    }
  }

  async getMyEntries(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as AuthenticatedRequest).user!.userId;
      const result = await supplierEntryService.getMyEntries(userId, req.query);
      sendSuccess(res, result, 'Entries fetched');
    } catch (error) {
      next(error);
    }
  }

  async getEntryById(req: Request, res: Response, next: NextFunction) {
    try {
      const entry = await supplierEntryService.getEntryById(req.params.id);
      sendSuccess(res, entry, 'Entry fetched');
    } catch (error) {
      next(error);
    }
  }

  // ==================== Admin actions ====================

  async getAllEntries(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await supplierEntryService.getAllEntries(req.query);
      sendSuccess(res, result, 'All entries fetched');
    } catch (error) {
      next(error);
    }
  }

  async getDashboardStats(_req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await supplierEntryService.getDashboardStats();
      sendSuccess(res, stats, 'Dashboard stats fetched');
    } catch (error) {
      next(error);
    }
  }

  async convertEntry(req: Request, res: Response, next: NextFunction) {
    try {
      const adminId = (req as AuthenticatedRequest).user!.userId;
      const result = await supplierEntryService.convertEntry(req.params.id, adminId, req.body);
      sendSuccess(res, result, 'Entry converted to product');
    } catch (error) {
      next(error);
    }
  }

  async rejectEntry(req: Request, res: Response, next: NextFunction) {
    try {
      const adminId = (req as AuthenticatedRequest).user!.userId;
      const result = await supplierEntryService.rejectEntry(req.params.id, adminId, req.body.reason);
      sendSuccess(res, result, 'Entry rejected');
    } catch (error) {
      next(error);
    }
  }
}

export default new SupplierEntryController();
