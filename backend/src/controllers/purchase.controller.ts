import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/response.util';
import purchaseService from '../services/purchase.service';

class PurchaseController {
  // ==================== GRN ====================
  async createGRN(req: Request, res: Response, next: NextFunction) {
    try {
      // @ts-ignore
      const userId = req.user?.id;
      const data = await purchaseService.createGRN(req.body, userId);
      sendSuccess(res, data, 'GRN created successfully', 201);
    } catch (err) { next(err); }
  }

  async getGRNs(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await purchaseService.getGRNs(req.query);
      sendSuccess(res, data);
    } catch (err) { next(err); }
  }

  // ==================== Returns ====================
  async createReturn(req: Request, res: Response, next: NextFunction) {
    try {
      // @ts-ignore
      const userId = req.user?.id;
      const data = await purchaseService.createReturn(req.body, userId);
      sendSuccess(res, data, 'Purchase Return created successfully', 201);
    } catch (err) { next(err); }
  }

  async getReturns(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await purchaseService.getReturns(req.query);
      sendSuccess(res, data);
    } catch (err) { next(err); }
  }

  // ==================== Payments ====================
  async createPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await purchaseService.createPayment(req.body);
      sendSuccess(res, data, 'Payment recorded successfully', 201);
    } catch (err) { next(err); }
  }

  async getPayments(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await purchaseService.getPayments(req.query);
      sendSuccess(res, data);
    } catch (err) { next(err); }
  }

  // ==================== Reports ====================
  async getReports(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await purchaseService.getReports(req.query);
      sendSuccess(res, data);
    } catch (err) { next(err); }
  }
}

export default new PurchaseController();
