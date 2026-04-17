import { Response, NextFunction } from 'express';
import crmService from '../services/crm.service';
import { AuthenticatedRequest } from '../types';
import { sendSuccess, sendMessage } from '../utils/response.util';

class CrmController {
  /** Get all customers with stats */
  async getCustomers(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = (req.query.search as string) || '';
      const segment = (req.query.segment as string) || '';
      const sortBy = (req.query.sortBy as string) || 'lastOrderDate';
      const sortOrder = (req.query.sortOrder as string) || 'desc';
      const data = await crmService.getCustomers({ page, limit, search, segment, sortBy, sortOrder });
      sendSuccess(res, data, 'Customers fetched');
    } catch (error) {
      next(error);
    }
  }

  /** Get single customer profile */
  async getCustomerProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { customerId } = req.params;
      const data = await crmService.getCustomerProfile(customerId);
      sendSuccess(res, data, 'Customer profile fetched');
    } catch (error) {
      next(error);
    }
  }

  /** Add CRM note */
  async addNote(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { customerId } = req.params;
      const { type, content } = req.body;
      if (!content) return sendMessage(res, 'Note content is required', 400);
      const note = await crmService.addNote(customerId, req.user!.userId, { type: type || 'note', content });
      sendSuccess(res, note, 'Note added');
    } catch (error) {
      next(error);
    }
  }

  /** Delete CRM note */
  async deleteNote(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await crmService.deleteNote(req.params.noteId);
      sendMessage(res, 'Note deleted');
    } catch (error) {
      next(error);
    }
  }

  /** Get segment summary */
  async getSegmentSummary(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = await crmService.getSegmentSummary();
      sendSuccess(res, data, 'Segment summary fetched');
    } catch (error) {
      next(error);
    }
  }
}

export default new CrmController();
