import { Response, NextFunction } from 'express';
import productViewService from '../services/product-view.service';
import cartAbandonmentService from '../services/cart-abandonment.service';
import { AuthenticatedRequest } from '../types';
import { sendSuccess, sendMessage } from '../utils/response.util';

class ProductViewController {
  /** User: track a product view */
  async track(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { productId } = req.body;
      if (!productId) {
        return sendMessage(res, 'productId is required', 400);
      }
      await productViewService.trackView(productId, userId);
      sendMessage(res, 'View tracked');
    } catch (error) {
      next(error);
    }
  }

  /** Admin: get all product views (paginated, searchable) */
  async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = (req.query.search as string) || '';
      const data = await productViewService.getAll({ page, limit, search });
      sendSuccess(res, data, 'Product views fetched');
    } catch (error) {
      next(error);
    }
  }

  /** Admin: get per-user summary of views */
  async getUserSummary(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = (req.query.search as string) || '';
      const data = await productViewService.getUserViewSummary({ page, limit, search });
      sendSuccess(res, data, 'User view summary fetched');
    } catch (error) {
      next(error);
    }
  }

  /** Admin: get views for a specific user */
  async getUserViews(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const views = await productViewService.getUserViews(userId);
      sendSuccess(res, views, 'User views fetched');
    } catch (error) {
      next(error);
    }
  }

  /** Admin: get abandoned carts (paginated, searchable) */
  async getAbandonedCarts(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = (req.query.search as string) || '';
      const minAge = req.query.minAge ? parseInt(req.query.minAge as string) : 0;
      const data = await cartAbandonmentService.getAbandonedCarts({ page, limit, search, minAge });
      sendSuccess(res, data, 'Abandoned carts fetched');
    } catch (error) {
      next(error);
    }
  }

  /** Admin: download abandoned carts as CSV */
  async downloadAbandonedCarts(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const minAge = req.query.minAge ? parseInt(req.query.minAge as string) : 0;
      const csv = await cartAbandonmentService.getAbandonedCartsCSV(minAge);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=abandoned-carts.csv');
      res.send(csv);
    } catch (error) {
      next(error);
    }
  }
}

export default new ProductViewController();
