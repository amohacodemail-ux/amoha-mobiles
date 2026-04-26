import { Request, Response, NextFunction } from 'express';
import bannerService from '../services/banner.service';
import { sendSuccess, sendCreated, sendMessage } from '../utils/response.util';
import { AuthenticatedRequest } from '../types';
import activityLogService from '../services/activity-log.service';

class BannerController {
  async getAll(_req: Request, res: Response, next: NextFunction) {
    try {
      // Public endpoint: only expose active banners
      const banners = await bannerService.getAll({ isActive: 'true' });
      sendSuccess(res, banners, 'Banners fetched');
    } catch (error) {
      next(error);
    }
  }

  async getAllAdmin(_req: Request, res: Response, next: NextFunction) {
    try {
      const banners = await bannerService.getAllAdmin();
      sendSuccess(res, banners, 'All banners fetched');
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const banner = await bannerService.create(req.body);
      activityLogService.log({ adminId: (req as AuthenticatedRequest).user?.userId, action: 'create', entity: 'banner', entityId: banner._id || banner.id, details: `Created banner: ${req.body.title || 'Untitled'}`, ipAddress: req.ip }).catch(() => {});
      sendCreated(res, banner, 'Banner created');
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const banner = await bannerService.update(req.params.id, req.body);
      sendSuccess(res, banner, 'Banner updated');
    } catch (error) {
      next(error);
    }
  }

  async toggleActive(req: Request, res: Response, next: NextFunction) {
    try {
      const { isActive } = req.body;
      const banner = await bannerService.toggleActive(req.params.id, isActive);
      sendSuccess(res, banner, `Banner ${isActive ? 'activated' : 'deactivated'}`);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await bannerService.delete(req.params.id);
      activityLogService.log({ adminId: (req as AuthenticatedRequest).user?.userId, action: 'delete', entity: 'banner', entityId: req.params.id, details: 'Deleted banner', ipAddress: req.ip }).catch(() => {});
      sendMessage(res, 'Banner deleted');
    } catch (error) {
      next(error);
    }
  }
}

export default new BannerController();
