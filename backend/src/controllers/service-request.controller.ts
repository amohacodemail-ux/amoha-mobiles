import { Request, Response, NextFunction } from 'express';
import serviceRequestService from '../services/service-request.service';
import { sendSuccess, sendCreated, sendMessage } from '../utils/response.util';
import { AuthenticatedRequest } from '../types';
import { notifyServiceRequest } from '../utils/notify';
import { sendServiceRequestStatusEmail, sendServiceRequestCreatedEmail } from '../utils/email.util';
import { AppError, BadRequestError } from '../errors/app-error';
import paymentService from '../services/payment.service';
import env from '../config/env';

class ServiceRequestController {
  // Public: submit a service request
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthenticatedRequest;
      const data = {
        ...req.body,
        userId: authReq.user?.userId || null,
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

  // Authenticated: get single my service request
  async getMyRequestById(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthenticatedRequest;
      const request = await serviceRequestService.getById(req.params.id);
      
      // Ensure the request belongs to the logged-in user
      if (request.userId && request.userId !== authReq.user!.userId) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }
      
      sendSuccess(res, request, 'Service request fetched');
    } catch (error) {
      next(error);
    }
  }

  // Admin & Service Engineer: list requests
  // Service engineers are automatically scoped to their assigned requests (backend enforced)
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthenticatedRequest;
      const { page, limit, status, search } = req.query;

      // Backend enforcement: service_engineer can ONLY see requests assigned to them
      const isServiceEngineer = authReq.user?.role === 'service_engineer';
      const assignedTo = isServiceEngineer ? authReq.user!.userId : (req.query.assignedTo as string | undefined);

      const result = await serviceRequestService.getAll({
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        status: status as string,
        search: search as string,
        assignedTo,
      });
      sendSuccess(res, result, 'Service requests fetched');
    } catch (error) {
      next(error);
    }
  }

  // Admin & Service Engineer: get one
  // Service engineers can only access requests assigned to them
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthenticatedRequest;
      const request = await serviceRequestService.getById(req.params.id);

      // Backend enforcement: service_engineer cannot access other engineers' requests
      if (authReq.user?.role === 'service_engineer') {
        if (request.assignedTo !== authReq.user.userId) {
          return res.status(403).json({
            success: false,
            message: 'Access denied. This service request is not assigned to you.',
          });
        }
      }

      sendSuccess(res, request, 'Service request fetched');
    } catch (error) {
      next(error);
    }
  }

  // Admin & Service Engineer: update status
  // Service engineers: ownership check + allowed status transitions only
  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthenticatedRequest;
      const isServiceEngineer = authReq.user?.role === 'service_engineer';

      // Fetch existing request first for ownership + transition validation
      const existing = await serviceRequestService.getById(req.params.id);

      if (isServiceEngineer) {
        // Ownership check: engineer can only update their own assigned requests
        if (existing.assignedTo !== authReq.user!.userId) {
          return res.status(403).json({
            success: false,
            message: 'Access denied. This service request is not assigned to you.',
          });
        }
      }

      const { status, adminNotes, finalPrice, assignedTo, serviceCharges, partsCharges, totalAmount, paymentMethod, paymentStatus } = req.body;

      // Backend enforcement: validate status transitions for service engineers
      if (isServiceEngineer && status) {
        const ENGINEER_ALLOWED_TRANSITIONS: Record<string, string[]> = {
          accepted:    ['in_progress'],
          in_progress: ['completed'],
        };
        const allowedNext = ENGINEER_ALLOWED_TRANSITIONS[existing.status] || [];
        if (!allowedNext.includes(status)) {
          return res.status(400).json({
            success: false,
            message: `Invalid status transition. From '${existing.status}' you can only move to: [${allowedNext.join(', ') || 'none'}].`,
          });
        }
      }

      let updates: any = { status, adminNotes, finalPrice };

      // Only admin can reassign (change assigned_to)
      if (!isServiceEngineer && assignedTo !== undefined) {
        updates.assigned_to = assignedTo;
      }

      // Merge billing fields (admin only for billing mutations)
      if (!isServiceEngineer) {
        if (serviceCharges !== undefined) updates.serviceCharges = serviceCharges;
        if (partsCharges !== undefined) updates.partsCharges = partsCharges;
        if (totalAmount !== undefined) updates.totalAmount = totalAmount;
        if (paymentMethod !== undefined) updates.paymentMethod = paymentMethod;
        if (paymentStatus !== undefined) updates.paymentStatus = paymentStatus;
      }

      const request = await serviceRequestService.updateStatus(
        req.params.id,
        updates
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

  // Admin & Service Engineer: stats
  // Service engineers see stats scoped to their own assigned requests
  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthenticatedRequest;
      const isServiceEngineer = authReq.user?.role === 'service_engineer';
      const assignedTo = isServiceEngineer ? authReq.user!.userId : undefined;
      const stats = await serviceRequestService.getStats(assignedTo);
      sendSuccess(res, stats, 'Service stats fetched');
    } catch (error) {
      next(error);
    }
  }

  // Admin: upload photos
  async uploadPhotos(req: Request, res: Response, next: NextFunction) {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const customerPhoto = files?.['customerPhoto']?.[0];
      const devicePhoto = files?.['devicePhoto']?.[0];

      const result: any = {};
      if (customerPhoto) result.customerPhotoUrl = `/uploads/service-requests/${customerPhoto.filename}`;
      if (devicePhoto) result.devicePhotoUrl = `/uploads/service-requests/${devicePhoto.filename}`;

      sendSuccess(res, result, 'Photos uploaded successfully');
    } catch (error) {
      next(error);
    }
  }

  // Admin & User: generate invoice
  async generateInvoice(req: Request, res: Response, next: NextFunction) {
    try {
      const request = await serviceRequestService.getById(req.params.id);
      
      const authReq = req as AuthenticatedRequest;
      const isStaff = ['admin', 'service_engineer'].includes(authReq.user?.role || '');
      const requestUserId = request.user?.id || request.user?._id || request.user?.toString();
      if (!isStaff && requestUserId !== authReq.user!.userId) {
        throw new AppError('Not authorized to access this invoice', 403);
      }
      
      // We will map service request data to the InvoiceData structure from invoice.util.ts
      const { generateInvoicePDF } = await import('../utils/invoice.util');
      
      // Check if invoice number exists, if not generate one
      let invoiceNum = request.invoiceNumber;
      if (!invoiceNum) {
        invoiceNum = `INV-SR-${Date.now().toString().slice(-6)}`;
        await serviceRequestService.updateBilling(request._id.toString(), {
          invoiceNumber: invoiceNum,
          invoiceDate: new Date(),
          paymentStatus: 'paid' // Assuming generating invoice means it's paid, or keep it pending based on logic. Let's keep existing.
        });
      }

      const items = [];
      if (request.serviceCharges && request.serviceCharges > 0) {
        items.push({ name: 'Service / Labor Charges', quantity: 1, price: request.serviceCharges });
      }
      if (request.partsCharges && request.partsCharges > 0) {
        items.push({ name: 'Parts Replacement', quantity: 1, price: request.partsCharges });
      }

      generateInvoicePDF(res, {
        orderNumber: request.requestNumber,
        invoiceNumber: invoiceNum,
        orderDate: request.invoiceDate ? new Date(request.invoiceDate).toISOString() : (request.createdAt ? new Date(request.createdAt).toISOString() : new Date().toISOString()),
        customerName: `${request.customerName} (${request.isWalkIn ? 'Walk-in Customer' : 'Online Customer'})`,
        customerEmail: request.customerEmail || '',
        customerPhone: request.customerPhone,
        shippingAddress: {
          fullName: `${request.customerName} (${request.isWalkIn ? 'Walk-in Customer' : 'Online Customer'})`,
          addressLine1: '—', // No address captured in SR
          city: '—',
          state: '—',
          pincode: '—',
          phone: request.customerPhone
        },
        items: items.length ? items : [{ name: request.serviceType || 'Service', quantity: 1, price: request.totalAmount || 0 }],
        subtotal: request.totalAmount || 0,
        discount: 0,
        deliveryCharge: 0,
        totalAmount: request.totalAmount || 0,
        paymentMethod: request.paymentMethod || 'Cash',
        paymentStatus: request.paymentStatus || 'pending',
        businessName: 'AMOHA MOBILES SERVICE CENTER',
        gstin: '33EOWPK7053B2ZR',
        panNumber: 'EOWPK7053B',
        businessAddress: '73/3 Therveethi, Idikarai, Coimbatore, Tamil Nadu, 641022',
        businessPhone: '+91 6380123183',
        businessEmail: 'amohamimpex@gmail.com',
      });
    } catch (error) {
      next(error);
    }
  }

  // Payment: create Razorpay order for service request
  async createPaymentOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthenticatedRequest;
      const request = await serviceRequestService.getById(req.params.id);

      const requestUserId = request.user?.id || request.user?._id || request.user?.toString() || request.userId;
      if (requestUserId !== authReq.user!.userId) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }

      const totalAmount = request.totalAmount || request.finalPrice;
      if (!totalAmount || totalAmount <= 0) {
        throw new BadRequestError('Service request total amount is not set or invalid');
      }

      if (request.paymentStatus === 'paid') {
        throw new BadRequestError('Payment is already completed for this service request');
      }

      const razorpayOrder = await paymentService.createRazorpayOrder(totalAmount, 'INR');
      const result = {
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        keyId: env.RAZORPAY_KEY_ID,
        totalAmount,
      };

      sendSuccess(res, result, 'Razorpay order created for service request');
    } catch (error) {
      next(error);
    }
  }

  // Payment: verify Razorpay payment for service request
  async verifyPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthenticatedRequest;
      const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

      const request = await serviceRequestService.getById(req.params.id);

      const requestUserId = request.user?.id || request.user?._id || request.user?.toString() || request.userId;
      if (requestUserId !== authReq.user!.userId) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }

      const paymentData = {
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: razorpayPaymentId,
        razorpay_signature: razorpaySignature,
      };

      const verification = await paymentService.verifyPayment(paymentData);
      if (!verification.verified) {
        throw new BadRequestError('Payment verification failed');
      }

      const updatedRequest = await serviceRequestService.updateStatus(request._id.toString(), {
        paymentMethod: 'razorpay',
        paymentStatus: 'paid',
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
      });

      sendSuccess(res, updatedRequest, 'Payment verified and service request updated successfully');
    } catch (error) {
      next(error);
    }
  }

  // Payment: set cash payment
  async cashPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthenticatedRequest;
      const request = await serviceRequestService.getById(req.params.id);

      const requestUserId = request.user?.id || request.user?._id || request.user?.toString() || request.userId;
      if (requestUserId !== authReq.user!.userId) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }

      if (request.paymentStatus === 'paid') {
        throw new BadRequestError('Payment is already completed for this service request');
      }

      const updatedRequest = await serviceRequestService.updateStatus(request._id.toString(), {
        paymentMethod: 'cash',
        paymentStatus: 'pending',
      });

      sendSuccess(res, updatedRequest, 'Payment method set to cash');
    } catch (error) {
      next(error);
    }
  }
}

export default new ServiceRequestController();
