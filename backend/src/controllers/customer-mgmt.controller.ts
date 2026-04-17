import { Request, Response, NextFunction } from 'express';
import customerMgmtService from '../services/customer-mgmt.service';
import { sendSuccess, sendCreated, sendMessage } from '../utils/response.util';

interface AuthenticatedRequest extends Request {
  user?: { userId: string; role: string };
}

class CustomerManagementController {
  // ==================== Customers ====================

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await customerMgmtService.getCustomers(req.query);
      sendSuccess(res, result, 'Customers fetched');
    } catch (error) {
      next(error);
    }
  }

  async getDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const customer = await customerMgmtService.getCustomerDetail(req.params.id);
      sendSuccess(res, customer, 'Customer detail fetched');
    } catch (error) {
      next(error);
    }
  }

  async getBehaviorAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const analytics = await customerMgmtService.getBehaviorAnalytics(req.params.id);
      sendSuccess(res, analytics, 'Behavior analytics fetched');
    } catch (error) {
      next(error);
    }
  }

  // ==================== Segmentation ====================

  async updateSegment(req: Request, res: Response, next: NextFunction) {
    try {
      const adminId = (req as AuthenticatedRequest).user?.userId || '';
      const result = await customerMgmtService.updateSegment(req.params.id, req.body.segment, adminId);
      sendSuccess(res, result, 'Segment updated');
    } catch (error) {
      next(error);
    }
  }

  async autoSegment(_req: Request, res: Response, next: NextFunction) {
    try {
      const result = await customerMgmtService.autoSegmentCustomers();
      sendSuccess(res, result, 'Auto-segmentation complete');
    } catch (error) {
      next(error);
    }
  }

  // ==================== Tags ====================

  async addTag(req: Request, res: Response, next: NextFunction) {
    try {
      const adminId = (req as AuthenticatedRequest).user?.userId || '';
      const tag = await customerMgmtService.addTag(req.params.id, req.body.tag, adminId);
      sendCreated(res, tag, 'Tag added');
    } catch (error) {
      next(error);
    }
  }

  async removeTag(req: Request, res: Response, next: NextFunction) {
    try {
      await customerMgmtService.removeTag(req.params.id, req.params.tagId);
      sendMessage(res, 'Tag removed');
    } catch (error) {
      next(error);
    }
  }

  // ==================== Notes ====================

  async addNote(req: Request, res: Response, next: NextFunction) {
    try {
      const adminId = (req as AuthenticatedRequest).user?.userId || '';
      const note = await customerMgmtService.addNote(req.params.id, adminId, req.body);
      sendCreated(res, note, 'Note added');
    } catch (error) {
      next(error);
    }
  }

  async updateNote(req: Request, res: Response, next: NextFunction) {
    try {
      const note = await customerMgmtService.updateNote(req.params.noteId, req.body);
      sendSuccess(res, note, 'Note updated');
    } catch (error) {
      next(error);
    }
  }

  async deleteNote(req: Request, res: Response, next: NextFunction) {
    try {
      await customerMgmtService.deleteNote(req.params.noteId);
      sendMessage(res, 'Note deleted');
    } catch (error) {
      next(error);
    }
  }

  // ==================== Fraud ====================

  async getFraudFlags(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await customerMgmtService.getFraudFlags(req.query);
      sendSuccess(res, result, 'Fraud flags fetched');
    } catch (error) {
      next(error);
    }
  }

  async createFraudFlag(req: Request, res: Response, next: NextFunction) {
    try {
      const flag = await customerMgmtService.createFraudFlag(req.body);
      sendCreated(res, flag, 'Fraud flag created');
    } catch (error) {
      next(error);
    }
  }

  async resolveFraudFlag(req: Request, res: Response, next: NextFunction) {
    try {
      const adminId = (req as AuthenticatedRequest).user?.userId || '';
      const flag = await customerMgmtService.resolveFraudFlag(req.params.flagId, adminId, req.body.resolutionNote);
      sendSuccess(res, flag, 'Fraud flag resolved');
    } catch (error) {
      next(error);
    }
  }

  async runFraudDetection(_req: Request, res: Response, next: NextFunction) {
    try {
      const result = await customerMgmtService.runFraudDetection();
      sendSuccess(res, result, 'Fraud detection completed');
    } catch (error) {
      next(error);
    }
  }

  // ==================== Dashboard ====================

  async getDashboardStats(_req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await customerMgmtService.getDashboardStats();
      sendSuccess(res, stats, 'Customer dashboard stats fetched');
    } catch (error) {
      next(error);
    }
  }
}

export default new CustomerManagementController();
