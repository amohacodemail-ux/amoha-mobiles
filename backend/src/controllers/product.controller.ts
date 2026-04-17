import { Request, Response, NextFunction } from 'express';
import productService from '../services/product.service';
import { AuthenticatedRequest, ProductFilterQuery } from '../types';
import { sendSuccess, sendCreated, sendMessage } from '../utils/response.util';
import { notifyReview } from '../utils/notify';
import activityLogService from '../services/activity-log.service';

class ProductController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = req.query as ProductFilterQuery;
      const result = await productService.getAll(filters);
      sendSuccess(res, result, 'Products fetched');
    } catch (error) {
      next(error);
    }
  }

  async getBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await productService.getBySlug(req.params.slug);
      sendSuccess(res, product, 'Product fetched');
    } catch (error) {
      next(error);
    }
  }

  async getFeatured(_req: Request, res: Response, next: NextFunction) {
    try {
      const products = await productService.getFeatured();
      sendSuccess(res, products, 'Featured products fetched');
    } catch (error) {
      next(error);
    }
  }

  async getTrending(_req: Request, res: Response, next: NextFunction) {
    try {
      const products = await productService.getTrending();
      sendSuccess(res, products, 'Trending products fetched');
    } catch (error) {
      next(error);
    }
  }

  async getByCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = req.query as ProductFilterQuery;
      const result = await productService.getByCategory(req.params.categorySlug, filters);
      sendSuccess(res, result, 'Category products fetched');
    } catch (error) {
      next(error);
    }
  }

  async searchSuggestions(req: Request, res: Response, next: NextFunction) {
    try {
      const q = req.query.q as string;
      const suggestions = await productService.searchSuggestions(q);
      sendSuccess(res, suggestions, 'Search suggestions');
    } catch (error) {
      next(error);
    }
  }

  async getRelated(req: Request, res: Response, next: NextFunction) {
    try {
      const products = await productService.getRelated(req.params.id);
      sendSuccess(res, products, 'Related products fetched');
    } catch (error) {
      next(error);
    }
  }

  // Admin
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await productService.create(req.body);
      activityLogService.log({ adminId: (req as AuthenticatedRequest).user?.userId, action: 'create', entity: 'product', entityId: product._id || product.id, details: `Created product: ${req.body.name}`, ipAddress: req.ip }).catch(() => {});
      sendCreated(res, product, 'Product created');
    } catch (error) {
      next(error);
    }
  }

  async bulkCreate(req: Request, res: Response, next: NextFunction) {
    try {
      const { products } = req.body;
      if (!Array.isArray(products) || products.length === 0) {
        return res.status(400).json({ success: false, message: 'Products array is required' });
      }
      if (products.length > 100) {
        return res.status(400).json({ success: false, message: 'Maximum 100 products per batch' });
      }
      const result = await productService.bulkCreate(products);
      sendSuccess(res, result, `Bulk upload complete: ${result.created} created, ${result.failed} failed`);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await productService.update(req.params.id, req.body);
      activityLogService.log({ adminId: (req as AuthenticatedRequest).user?.userId, action: 'update', entity: 'product', entityId: req.params.id, details: `Updated product`, ipAddress: req.ip }).catch(() => {});
      sendSuccess(res, product, 'Product updated');
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await productService.delete(req.params.id);
      activityLogService.log({ adminId: (req as AuthenticatedRequest).user?.userId, action: 'delete', entity: 'product', entityId: req.params.id, details: `Deleted product`, ipAddress: req.ip }).catch(() => {});
      sendMessage(res, result?.message || 'Product deleted');
    } catch (error) {
      next(error);
    }
  }

  async updateStock(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await productService.updateStock(req.params.id, req.body.stock);
      sendSuccess(res, product, 'Stock updated');
    } catch (error) {
      next(error);
    }
  }

  // Reviews
  async addReview(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const product = await productService.addReview(req.params.id, req.user!.userId, req.body);
      notifyReview(product.name, req.body.rating, req.user!.userId);
      sendCreated(res, product, 'Review added');
    } catch (error) {
      next(error);
    }
  }

  async deleteReview(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const isAdmin = req.user!.role === 'admin';
      const product = await productService.deleteReview(req.params.id, req.params.reviewId, req.user!.userId, isAdmin);
      sendSuccess(res, product, 'Review deleted');
    } catch (error) {
      next(error);
    }
  }

  // Public: Get latest top-rated reviews for homepage
  async getTopReviews(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 8, 20);
      const supabase = (await import('../config/supabase')).default;
      const { transformRow } = await import('../utils/transform.util');

      const { data: reviews } = await supabase
        .from('reviews')
        .select('*, products(name, slug, images), users:user_id(name, avatar)')
        .gte('rating', 4)
        .order('created_at', { ascending: false })
        .limit(limit);

      const result = (reviews || []).map((r: any) => ({
        _id: r.id,
        id: r.id,
        rating: r.rating,
        title: r.title,
        comment: r.comment,
        createdAt: r.created_at,
        productName: r.products?.name || '',
        productSlug: r.products?.slug || '',
        productThumbnail: r.products?.images?.[0] || '',
        user: r.users ? { name: r.users.name, avatar: r.users.avatar } : { name: 'Customer', avatar: '' },
      }));
      sendSuccess(res, result, 'Top reviews fetched');
    } catch (error) {
      next(error);
    }
  }

  async getRecentlyViewed(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 10, 20);
      const products = await productService.getRecentlyViewed(req.user!.userId, limit);
      sendSuccess(res, products, 'Recently viewed products');
    } catch (error) {
      next(error);
    }
  }
}

export default new ProductController();
