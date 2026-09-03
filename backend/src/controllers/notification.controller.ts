import { Request, Response, NextFunction } from 'express';
import notificationService from '../services/notification.service';
import { sendSuccess, sendMessage } from '../utils/response.util';

class NotificationController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      let type = req.query.type as string | undefined;

      const userRole = (req as any).user?.role;
      if (userRole === 'purchase' || userRole === 'purchase_inventory') {
        type = 'low_stock';
      }

      const result = await notificationService.getAll(page, limit, type);
      sendSuccess(res, result, 'Notifications fetched');
    } catch (error) {
      next(error);
    }
  }

  async getRecent(req: Request, res: Response, next: NextFunction) {
    try {
      const userRole = (req as any).user?.role;
      let type = undefined;
      if (userRole === 'purchase' || userRole === 'purchase_inventory') {
        type = 'low_stock';
      }

      const notifications = await notificationService.getRecent(10, type);
      const unreadCount = await notificationService.getUnreadCount(type);
      sendSuccess(res, { notifications, unreadCount }, 'Recent notifications fetched');
    } catch (error) {
      next(error);
    }
  }

  async getUnreadCount(req: Request, res: Response, next: NextFunction) {
    try {
      const userRole = (req as any).user?.role;
      let type = undefined;
      if (userRole === 'purchase' || userRole === 'purchase_inventory') {
        type = 'low_stock';
      }

      const count = await notificationService.getUnreadCount(type);
      sendSuccess(res, { count }, 'Unread count fetched');
    } catch (error) {
      next(error);
    }
  }

  async markRead(req: Request, res: Response, next: NextFunction) {
    try {
      const notification = await notificationService.markRead(req.params.id);
      sendSuccess(res, notification, 'Notification marked as read');
    } catch (error) {
      next(error);
    }
  }

  async markAllRead(_req: Request, res: Response, next: NextFunction) {
    try {
      await notificationService.markAllRead();
      sendMessage(res, 'All notifications marked as read');
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await notificationService.delete(req.params.id);
      sendMessage(res, 'Notification deleted');
    } catch (error) {
      next(error);
    }
  }

  async clearAll(_req: Request, res: Response, next: NextFunction) {
    try {
      await notificationService.clearAll();
      sendMessage(res, 'Read notifications cleared');
    } catch (error) {
      next(error);
    }
  }
}

export default new NotificationController();
