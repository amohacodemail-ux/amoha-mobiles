import { Request, Response, NextFunction } from 'express';
import serviceRequestService from '../services/service-request.service';
import { sendSuccess, sendCreated, sendMessage } from '../utils/response.util';
import { AuthenticatedRequest } from '../types';
import { notifyServiceRequest } from '../utils/notify';
import { sendServiceRequestStatusEmail, sendServiceRequestCreatedEmail } from '../utils/email.util';

class ServiceRequestController {
  // Public: submit a service request
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthenticatedRequest;
      const data = {
        ...req.body,
        user: authReq.user?.userId,
      };
      const request = await serviceRequestService.create(data);
      notifyServiceRequest(request.customerName, request.serviceType, request._id.toString());
      // Send confirmation email to customer
      if (request.customerEmail) {
        sendServiceRequestCreatedEmail(
          request.customerEmail,
          request.customerName,
          request.requestNumber,
          request.serviceType,
        ).catch(() => {});
      }
      sendCreated(res, request, 'Service request submitted successfully');
    } catch (error) {
      next(error);
    }
  }

  // Authenticated: get my service requests
  async getMyRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthenticatedRequest;
      const requests = await serviceRequestService.getByUser(authReq.user!.userId);
      sendSuccess(res, requests, 'Service requests fetched');
    } catch (error) {
      next(error);
    }
  }

  // Admin: list all with filters
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, status, search } = req.query;
      const result = await serviceRequestService.getAll({
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        status: status as string,
        search: search as string,
      });
      sendSuccess(res, result, 'Service requests fetched');
    } catch (error) {
      next(error);
    }
  }

  // Admin: get one
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const request = await serviceRequestService.getById(req.params.id);
      sendSuccess(res, request, 'Service request fetched');
    } catch (error) {
      next(error);
    }
  }

  // Admin: update status
  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, adminNotes, finalPrice } = req.body;
      const request = await serviceRequestService.updateStatus(
        req.params.id,
        status,
        adminNotes,
        finalPrice,
      );
      // Send status email to customer
      if (request.customerEmail) {
        sendServiceRequestStatusEmail(
          request.customerEmail,
          request.customerName,
          request.requestNumber,
          request.serviceType,
          request.status,
          request.adminNotes,
        ).catch(() => {});
      }
      sendSuccess(res, request, 'Service request updated');
    } catch (error) {
      next(error);
    }
  }

  // Admin: delete
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await serviceRequestService.delete(req.params.id);
      sendMessage(res, 'Service request deleted');
    } catch (error) {
      next(error);
    }
  }

  // Admin: stats
  async getStats(_req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await serviceRequestService.getStats();
      sendSuccess(res, stats, 'Service stats fetched');
    } catch (error) {
      next(error);
    }
  }
}

export default new ServiceRequestController();
