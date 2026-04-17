import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import activityLogService from '../services/activity-log.service';
import { sendSuccess, sendPaginated } from '../utils/response.util';

class ActivityLogController {
  async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const result = await activityLogService.getAll({
        page,
        limit,
        action: req.query.action as string,
        resource: req.query.resource as string,
        userId: req.query.userId as string,
        search: req.query.search as string,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
      });
      sendPaginated(res, result.logs, result.pagination, 'Activity logs fetched');
    } catch (error) {
      next(error);
    }
  }

  async getByResource(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { resource, resourceId } = req.params;
      const logs = await activityLogService.getByResource(resource, resourceId);
      sendSuccess(res, logs, 'Logs fetched');
    } catch (error) {
      next(error);
    }
  }
}

export default new ActivityLogController();
