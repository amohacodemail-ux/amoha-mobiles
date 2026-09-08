import { Router, Request } from 'express';

interface AuthenticatedRequest extends Request {
  user?: { userId: string; role: string };
}
import supplierController from '../controllers/supplier.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize, canAccessAdminOnly, canAccessPurchase, canAccessSupplier } from '../middleware/role.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  createSupplierSchema,
  updateSupplierSchema,
  updateSupplierSelfSchema,
  assignProductSchema,
  createPurchaseOrderSchema,
  receivePurchaseOrderSchema,
} from '../validators/supplier.validator';

const router = Router();

// Supplier self-service routes
router.get('/me', authenticate, canAccessSupplier, supplierController.getMyProfile);
router.put('/me', authenticate, canAccessSupplier, validate(updateSupplierSelfSchema), supplierController.updateMyProfile);

// Supplier Catalogue (Self-service)
router.get('/me/catalogue', authenticate, canAccessSupplier, supplierController.getMyCatalogue);
router.post('/me/catalogue', authenticate, canAccessSupplier, supplierController.createCatalogueItem);
router.put('/me/catalogue/:id', authenticate, canAccessSupplier, supplierController.updateCatalogueItem);
router.delete('/me/catalogue/:id', authenticate, canAccessSupplier, supplierController.deleteCatalogueItem);

// All remaining routes require authentication
router.use(authenticate);

const canAccessPO = authorize('admin', 'purchase', 'purchase_inventory', 'supplier');

// Dashboard & Analytics
router.get('/dashboard', canAccessPurchase, supplierController.getDashboardStats);
router.get('/analytics', canAccessPurchase, supplierController.getAnalytics);

// Purchase Orders
router.get('/purchase-orders', canAccessPO, supplierController.getAllPurchaseOrders);
router.get('/purchase-orders/:id', canAccessPO, supplierController.getPurchaseOrderById);
router.post('/purchase-orders', canAccessPurchase, validate(createPurchaseOrderSchema), supplierController.createPurchaseOrder);
router.put('/purchase-orders/:id', canAccessPO, (req: AuthenticatedRequest, res, next) => {
  if (req.user?.role === 'supplier') {
    const allowedStatuses = ['confirmed'];
    if (req.body.status && !allowedStatuses.includes(req.body.status)) {
      return res.status(403).json({ success: false, message: 'Suppliers can only confirm purchase orders' });
    }
    // Remove any unauthorized fields for suppliers
    const { status, supplier_notes } = req.body;
    req.body = { status, supplier_notes };
  }
  next();
}, supplierController.updatePurchaseOrder);
router.post('/purchase-orders/:id/receive', canAccessPurchase, validate(receivePurchaseOrderSchema), supplierController.receivePurchaseOrder);
// GRNs
router.get('/grns', canAccessPO, supplierController.getGRNs);

// Supplier Portal Specific Routes
const canAccessSupplierPortal = authorize('supplier', 'admin');
router.post('/purchase-orders/:id/accept', authenticate, canAccessSupplierPortal, supplierController.acceptPurchaseOrder);
router.post('/purchase-orders/:id/reject', authenticate, canAccessSupplierPortal, supplierController.rejectPurchaseOrder);
router.put('/purchase-orders/:id/delivery', authenticate, canAccessSupplierPortal, supplierController.updateDeliveryStatus);
router.post('/invoices', authenticate, canAccessSupplierPortal, supplierController.uploadInvoice);
router.get('/invoices', authenticate, canAccessSupplierPortal, supplierController.getSupplierInvoices);

// Suppliers CRUD
router.get('/', canAccessPurchase, supplierController.getAll);
router.get('/:id', canAccessPurchase, supplierController.getById);
router.post('/', canAccessPurchase, validate(createSupplierSchema), supplierController.create);
router.put('/:id', canAccessPurchase, validate(updateSupplierSchema), supplierController.update);
router.delete('/:id', canAccessPurchase, supplierController.delete);

// Supplier Catalogues (Purchase view)
router.get('/catalogues/all', canAccessPurchase, supplierController.getAllCatalogues);
router.post('/catalogues/:id/map', canAccessPurchase, supplierController.mapCatalogueToMaster);

// Supplier Products
router.get('/:id/products', canAccessPurchase, supplierController.getSupplierProducts);
router.post('/:id/products', canAccessPurchase, validate(assignProductSchema), supplierController.assignProduct);
router.delete('/:id/products/:productId', canAccessPurchase, supplierController.removeProduct);

export default router;
