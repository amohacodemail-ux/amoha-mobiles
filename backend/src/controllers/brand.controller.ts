import { Request, Response, NextFunction } from 'express';
import brandService from '../services/brand.service';
import { sendSuccess, sendCreated, sendMessage } from '../utils/response.util';

class BrandController {
  async getAll(_req: Request, res: Response, next: NextFunction) {
    try {
      const brands = await brandService.getAll();
      sendSuccess(res, brands, 'Brands fetched');
    } catch (error) {
      next(error);
    }
  }

  async getAllAdmin(_req: Request, res: Response, next: NextFunction) {
    try {
      const brands = await brandService.getAllAdmin();
      sendSuccess(res, brands, 'All brands fetched');
    } catch (error) {
      next(error);
    }
  }

  async getBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const brand = await brandService.getBySlug(req.params.slug);
      sendSuccess(res, brand, 'Brand fetched');
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const brand = await brandService.create(req.body);
      sendCreated(res, brand, 'Brand created');
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const brand = await brandService.update(req.params.id, req.body);
      sendSuccess(res, brand, 'Brand updated');
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await brandService.delete(req.params.id);
      sendMessage(res, 'Brand deleted');
    } catch (error) {
      next(error);
    }
  }
}

export default new BrandController();
