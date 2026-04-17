import { Request, Response, NextFunction } from 'express';
import adminService from '../services/admin.service';
import { AuthenticatedRequest } from '../types';
import { sendSuccess } from '../utils/response.util';

class AdminController {
  async getDashboard(_req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const analytics = await adminService.getDashboardAnalytics();
      sendSuccess(res, analytics, 'Dashboard analytics fetched');
    } catch (error) {
      next(error);
    }
  }

  async getSalesReport(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };
      const report = await adminService.getSalesReport(startDate, endDate);
      sendSuccess(res, report, 'Sales report fetched');
    } catch (error) {
      next(error);
    }
  }

  async getMonthlyRevenue(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const year = req.query.year ? parseInt(req.query.year as string) : undefined;
      const revenue = await adminService.getMonthlyRevenue(year);
      sendSuccess(res, revenue, 'Monthly revenue fetched');
    } catch (error) {
      next(error);
    }
  }

  async getTopProducts(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const products = await adminService.getTopProducts(limit);
      sendSuccess(res, products, 'Top products fetched');
    } catch (error) {
      next(error);
    }
  }

  async getRecentOrders(_req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const orders = await adminService.getRecentOrders();
      sendSuccess(res, orders, 'Recent orders fetched');
    } catch (error) {
      next(error);
    }
  }
}

export default new AdminController();
