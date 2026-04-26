import { Request, Response, NextFunction } from 'express';
import categoryService from '../services/category.service';
import { sendSuccess, sendCreated, sendMessage } from '../utils/response.util';

class CategoryController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      // Only expose active categories to the public; pass remaining query params through
      const categories = await categoryService.getAll({ ...req.query, isActive: 'true' });
      sendSuccess(res, categories, 'Categories fetched');
    } catch (error) {
      next(error);
    }
  }

  async getAllAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await categoryService.getAllAdmin(req.query);
      sendSuccess(res, categories, 'All categories fetched');
    } catch (error) {
      next(error);
    }
  }

  async getBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const category = await categoryService.getBySlug(req.params.slug);
      sendSuccess(res, category, 'Category fetched');
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const category = await categoryService.create(req.body);
      sendCreated(res, category, 'Category created');
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const category = await categoryService.update(req.params.id, req.body);
      sendSuccess(res, category, 'Category updated');
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await categoryService.delete(req.params.id);
      sendMessage(res, result?.message || 'Category deleted');
    } catch (error) {
      next(error);
    }
  }
}

export default new CategoryController();
