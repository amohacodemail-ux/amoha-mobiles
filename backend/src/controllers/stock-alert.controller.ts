import { Request, Response, NextFunction } from 'express';
import stockNotificationService from '../services/stock-notification.service';
import { sendSuccess, sendCreated, sendMessage } from '../utils/response.util';

class StockAlertController {
  async subscribe(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id;
      const { productId, whatsappOptIn } = req.body;
      const data = await stockNotificationService.subscribeUser(userId, productId, whatsappOptIn);
      return sendCreated(res, data, 'Successfully subscribed to stock alerts');
    } catch (error) {
      next(error);
    }
  }

  async unsubscribe(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id;
      const { productId } = req.params;
      await stockNotificationService.unsubscribeUser(userId, productId);
      return sendMessage(res, 'Successfully unsubscribed from stock alerts');
    } catch (error) {
      next(error);
    }
  }

  async checkStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id;
      const { productId } = req.params;
      const data = await stockNotificationService.checkSubscription(userId, productId);
      return sendSuccess(res, data, 'Subscription status retrieved');
    } catch (error) {
      next(error);
    }
  }
}

export default new StockAlertController();
