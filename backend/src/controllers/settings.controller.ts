import { Request, Response, NextFunction } from 'express';
import settingsService from '../services/settings.service';
import { sendSuccess } from '../utils/response.util';
import { AuthenticatedRequest } from '../types';
import activityLogService from '../services/activity-log.service';

class SettingsController {
  async get(_req: Request, res: Response, next: NextFunction) {
    try {
      const settings = await settingsService.get();
      sendSuccess(res, settings, 'Settings fetched');
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const settings = await settingsService.update(req.body);
      activityLogService.log({ adminId: (req as AuthenticatedRequest).user?.userId, action: 'update', entity: 'settings', details: 'Settings updated', ipAddress: req.ip }).catch(() => {});
      sendSuccess(res, settings, 'Settings updated');
    } catch (error) {
      next(error);
    }
  }
}

export default new SettingsController();
