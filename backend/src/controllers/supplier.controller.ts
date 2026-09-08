import { Request, Response, NextFunction } from 'express';
import { sendSuccess, sendCreated, sendMessage } from '../utils/response.util';
import supplierService from '../services/supplier.service';
import purchaseService from '../services/purchase.service';
import supabase from '../config/supabase';
import { ForbiddenError } from '../errors/app-error';

interface AuthenticatedRequest extends Request {
  user?: { userId: string; role: string };
}

class SupplierController {
  // ==================== Suppliers CRUD ====================

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await supplierService.getAll(req.query);
      sendSuccess(res, result, 'Suppliers fetched');
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const supplier = await supplierService.getById(req.params.id);
      sendSuccess(res, supplier, 'Supplier fetched');
    } catch (error) {
      next(error);
    }
  }

  async getMyProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const supplier = await supplierService.getMyProfile(req.user?.userId || '');
      sendSuccess(res, supplier, 'Supplier profile fetched');
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const supplier = await supplierService.create(req.body);
      sendCreated(res, supplier, 'Supplier created');
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const supplier = await supplierService.update(req.params.id, req.body);
      sendSuccess(res, supplier, 'Supplier updated');
    } catch (error) {
      next(error);
    }
  }

  async updateMyProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const supplier = await supplierService.updateMyProfile(req.user?.userId || '', req.body);
      sendSuccess(res, supplier, 'Supplier profile updated');
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const adminId = (req as AuthenticatedRequest).user?.userId;
      const result = await supplierService.delete(req.params.id, adminId, req.ip);
      sendMessage(res, result?.message || 'Supplier deleted');
    } catch (error) {
      next(error);
    }
  }

  // ==================== Supplier Products ====================

  async assignProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const mapping = await supplierService.assignProduct(req.params.id, req.body);
      sendCreated(res, mapping, 'Product assigned to supplier');
    } catch (error) {
      next(error);
    }
  }

  async removeProduct(req: Request, res: Response, next: NextFunction) {
    try {
      await supplierService.removeProduct(req.params.id, req.params.productId);
      sendMessage(res, 'Product removed from supplier');
    } catch (error) {
      next(error);
    }
  }

  async getSupplierProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const products = await supplierService.getSupplierProducts(req.params.id);
      sendSuccess(res, products, 'Supplier products fetched');
    } catch (error) {
      next(error);
    }
  }

  // ==================== Purchase Orders ====================

  async getAllPurchaseOrders(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const query = { ...req.query };
      
      // If user is a supplier, restrict to their own purchase orders
      if (req.user?.role === 'supplier') {
        const { data: userRecord } = await supabase
          .from('users').select('email').eq('id', req.user.userId).maybeSingle();
        if (userRecord?.email) {
          const { data: supplierRec } = await supabase
            .from('suppliers').select('id').eq('email', userRecord.email).maybeSingle();
          if (supplierRec) {
            query.supplierId = supplierRec.id;
          }
        }
      }
      
      const result = await supplierService.getAllPurchaseOrders(query);
      sendSuccess(res, result, 'Purchase orders fetched');
    } catch (error) {
      next(error);
    }
  }

  async getPurchaseOrderById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const po = await supplierService.getPurchaseOrderById(req.params.id);
      
      // If user is a supplier, ensure this PO belongs to them
      if (req.user?.role === 'supplier') {
        const { data: userRecord } = await supabase
          .from('users').select('email').eq('id', req.user.userId).maybeSingle();
        if (userRecord?.email) {
          const { data: supplierRec } = await supabase
            .from('suppliers').select('id').eq('email', userRecord.email).maybeSingle();
          if (supplierRec && po.supplierId !== supplierRec.id) {
            throw new ForbiddenError('You do not have access to this purchase order');
          }
        }
      }
      
      sendSuccess(res, po, 'Purchase order fetched');
    } catch (error) {
      next(error);
    }
  }

  async getGRNs(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      // 1. Force the correct supplierId
      let supplierId = req.query.supplierId as string;
      
      if (req.user?.role === 'supplier') {
        const { data: userRecord } = await supabase
          .from('users').select('email').eq('id', req.user.userId).maybeSingle();
        if (userRecord?.email) {
          const { data: supplierRec } = await supabase
            .from('suppliers').select('id').eq('email', userRecord.email).maybeSingle();
          if (!supplierRec) {
            throw new ForbiddenError('Supplier profile not found');
          }
          // Strictly force the supplierId to the authenticated one
          supplierId = supplierRec.id;
        } else {
           throw new ForbiddenError('Supplier email not found');
        }
      }

      // 2. Query the raw GRNs 
      // purchaseService.getGRNs returns them sorted by created_at descending.
      // We will re-sort internally by created_at ascending to calculate running totals, then sort back.
      const query = { ...req.query, supplierId };
      const rawGrns = await purchaseService.getGRNs(query);

      // 3. Post-process to attach calculated fields
      // Group by PO to calculate running totals for previously received quantity
      const poItemTotals: Record<string, number> = {}; 
      
      // Sort ascending to process in chronological order
      const ascGrns = [...rawGrns].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      const processedGrns = ascGrns.map(grn => {
        let totalOrdered = 0;
        let totalReceived = 0;
        let totalAccepted = 0;
        let totalRejected = 0;

        const processedItems = (grn.items || []).map((item: any) => {
          const poItemId = item.poItemId || item.po_item_id;
          
          // Current previously received is the running total before adding this item
          const previouslyReceived = poItemTotals[poItemId] || 0;
          
          // Received this time
          const receivedThisTime = item.receivedQty || 0;
          const acceptedQty = item.acceptedQty || 0;
          const rejectedQty = item.rejectedQty || 0;
          
          // Update running total for future GRNs
          poItemTotals[poItemId] = previouslyReceived + receivedThisTime;
          
          const totalReceivedForItem = previouslyReceived + receivedThisTime;
          const orderedQty = item.orderedQty || 0;
          const pendingQty = Math.max(0, orderedQty - totalReceivedForItem);

          totalOrdered += orderedQty;
          totalReceived += receivedThisTime;
          totalAccepted += acceptedQty;
          totalRejected += rejectedQty;

          return {
            ...item,
            previouslyReceivedQty: previouslyReceived,
            receivedThisTime: receivedThisTime,
            totalReceivedQty: totalReceivedForItem,
            pendingQty: pendingQty,
          };
        });

        return {
          ...grn,
          items: processedItems,
          totalOrdered,
          totalReceived,
          totalAccepted,
          totalRejected,
        };
      });

      // Sort descending again for display
      processedGrns.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      sendSuccess(res, processedGrns, 'GRNs fetched successfully');
    } catch (error) {
      next(error);
    }
  }

  async createPurchaseOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as AuthenticatedRequest).user?.userId || '';
      const po = await supplierService.createPurchaseOrder(req.body, userId);
      sendCreated(res, po, 'Purchase order created');
    } catch (error) {
      next(error);
    }
  }

  async updatePurchaseOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const po = await supplierService.updatePurchaseOrder(req.params.id, req.body);
      sendSuccess(res, po, 'Purchase order updated');
    } catch (error) {
      next(error);
    }
  }

  async receivePurchaseOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const receivedBy = (req as AuthenticatedRequest).user?.userId;
      const po = await supplierService.receivePurchaseOrder(req.params.id, req.body.items, receivedBy);
      sendSuccess(res, po, 'Items received successfully');
    } catch (error) {
      next(error);
    }
  }

  // ==================== Supplier Actions (Supplier Login) ====================

  private getSupplierIdFromAuth = async (req: AuthenticatedRequest): Promise<string> => {
    if (req.user?.role !== 'supplier') throw new ForbiddenError('Only suppliers can perform this action');
    const { data: userRecord } = await supabase.from('users').select('email').eq('id', req.user.userId).maybeSingle();
    if (!userRecord?.email) throw new ForbiddenError('Supplier email not found');
    const { data: supplierRec } = await supabase.from('suppliers').select('id').eq('email', userRecord.email).maybeSingle();
    if (!supplierRec) throw new ForbiddenError('Supplier profile not found');
    return supplierRec.id;
  };

  acceptPurchaseOrder = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const supplierId = await this.getSupplierIdFromAuth(req);
      const po = await supplierService.acceptPurchaseOrder(req.params.id, supplierId);
      sendSuccess(res, po, 'Purchase order accepted');
    } catch (error) {
      next(error);
    }
  };

  rejectPurchaseOrder = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const supplierId = await this.getSupplierIdFromAuth(req);
      const po = await supplierService.rejectPurchaseOrder(req.params.id, supplierId, req.body.rejectReason);
      sendSuccess(res, po, 'Purchase order rejected');
    } catch (error) {
      next(error);
    }
  };

  updateDeliveryStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const supplierId = await this.getSupplierIdFromAuth(req);
      const { status, trackingNumber, dispatchDate } = req.body;
      const po = await supplierService.updateDeliveryStatus(req.params.id, supplierId, status, trackingNumber, dispatchDate);
      sendSuccess(res, po, 'Delivery status updated');
    } catch (error) {
      next(error);
    }
  };

  uploadInvoice = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const supplierId = await this.getSupplierIdFromAuth(req);
      const invoice = await supplierService.uploadInvoice(supplierId, req.body);
      sendCreated(res, invoice, 'Invoice uploaded successfully');
    } catch (error) {
      next(error);
    }
  };

  getSupplierInvoices = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const supplierId = await this.getSupplierIdFromAuth(req);
      const invoices = await supplierService.getSupplierInvoices(supplierId);
      sendSuccess(res, invoices, 'Invoices fetched successfully');
    } catch (error) {
      next(error);
    }
  };

  // ==================== Analytics ====================

  async getAnalytics(_req: Request, res: Response, next: NextFunction) {
    try {
      const analytics = await supplierService.getSupplierAnalytics();
      sendSuccess(res, analytics, 'Supplier analytics fetched');
    } catch (error) {
      next(error);
    }
  }

  async getDashboardStats(_req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await supplierService.getDashboardStats();
      sendSuccess(res, stats, 'Supplier dashboard stats fetched');
    } catch (error) {
      next(error);
    }
  }

  // ==================== Supplier Catalogue ====================

  createCatalogueItem = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const supplierId = await this.getSupplierIdFromAuth(req);
      const item = await supplierService.createCatalogueItem(supplierId, req.body, req.user!.userId);
      sendCreated(res, item, 'Catalogue item created');
    } catch (error) {
      next(error);
    }
  };

  updateCatalogueItem = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const supplierId = await this.getSupplierIdFromAuth(req);
      const item = await supplierService.updateCatalogueItem(supplierId, req.params.id, req.body, req.user!.userId);
      sendSuccess(res, item, 'Catalogue item updated');
    } catch (error) {
      next(error);
    }
  };

  deleteCatalogueItem = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const supplierId = await this.getSupplierIdFromAuth(req);
      await supplierService.deleteCatalogueItem(supplierId, req.params.id, req.user!.userId);
      sendSuccess(res, null, 'Catalogue item deleted');
    } catch (error) {
      next(error);
    }
  };

  getMyCatalogue = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const supplierId = await this.getSupplierIdFromAuth(req);
      const catalogue = await supplierService.getSupplierCatalogue(supplierId);
      sendSuccess(res, catalogue, 'Catalogue fetched');
    } catch (error) {
      next(error);
    }
  };

  getAllCatalogues = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters = {
        search: req.query.search as string,
        category: req.query.category as string,
        supplierId: req.query.supplierId as string,
      };
      const catalogues = await supplierService.getAllCatalogues(filters);
      sendSuccess(res, catalogues, 'All catalogues fetched');
    } catch (error) {
      next(error);
    }
  };

  mapCatalogueToMaster = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { masterProductId } = req.body;
      if (!masterProductId) {
        return res.status(400).json({ success: false, message: 'masterProductId is required' });
      }
      const item = await supplierService.mapCatalogueToMaster(req.params.id, masterProductId, req.user!.userId);
      sendSuccess(res, item, 'Catalogue mapped to master product');
    } catch (error) {
      next(error);
    }
  };
}

export default new SupplierController();
