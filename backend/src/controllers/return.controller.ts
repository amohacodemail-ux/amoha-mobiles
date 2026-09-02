import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import returnService from '../services/return.service';
import { sendSuccess, sendCreated, sendPaginated, sendMessage } from '../utils/response.util';

class ReturnController {
  async createReturn(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const result = await returnService.createReturnRequest(userId, req.body);
      sendCreated(res, result, 'Return request submitted');
    } catch (error) {
      next(error);
    }
  }

  async getUserReturns(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const result = await returnService.getReturnRequests({ page, limit, userId });
      sendPaginated(res, result.returns, result.pagination, 'Returns fetched');
    } catch (error) {
      next(error);
    }
  }

  async getReturnById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await returnService.getReturnRequestById(req.params.id);
      sendSuccess(res, result, 'Return details fetched');
    } catch (error) {
      next(error);
    }
  }

  // Admin
  async getAllReturns(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const status = req.query.status as string;
      const search = req.query.search as string;
      const result = await returnService.getReturnRequests({ page, limit, status, search });
      sendPaginated(res, result.returns, result.pagination, 'Returns fetched');
    } catch (error) {
      next(error);
    }
  }

  async updateReturnStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { status, message } = req.body;
      const adminId = req.user!.userId;
      const result = await returnService.updateReturnStatus(req.params.id, status, message || '', adminId);
      sendSuccess(res, result, 'Return status updated');
    } catch (error) {
      next(error);
    }
  }

  async getReturnStats(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const stats = await returnService.getReturnStats();
      sendSuccess(res, stats, 'Return stats fetched');
    } catch (error) {
      next(error);
    }
  }
}

export default new ReturnController();
