import { Router } from 'express';
import supplierController from '../controllers/supplier.controller';
import { authenticate } from '../middleware/auth.middleware';
import { canAccessAdminOnly, canAccessPurchase, canAccessSupplier } from '../middleware/role.middleware';
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

// All remaining supplier routes require purchase or admin access
router.use(authenticate, canAccessPurchase);

// Dashboard & Analytics
router.get('/dashboard', canAccessPurchase, supplierController.getDashboardStats);
router.get('/analytics', canAccessPurchase, supplierController.getAnalytics);

// Purchase Orders
router.get('/purchase-orders', canAccessPurchase, supplierController.getAllPurchaseOrders);
router.get('/purchase-orders/:id', canAccessPurchase, supplierController.getPurchaseOrderById);
router.post('/purchase-orders', canAccessPurchase, validate(createPurchaseOrderSchema), supplierController.createPurchaseOrder);
router.put('/purchase-orders/:id', canAccessPurchase, supplierController.updatePurchaseOrder);
router.post('/purchase-orders/:id/receive', canAccessPurchase, validate(receivePurchaseOrderSchema), supplierController.receivePurchaseOrder);

// Suppliers CRUD
router.get('/', canAccessPurchase, supplierController.getAll);
router.get('/:id', canAccessPurchase, supplierController.getById);
router.post('/', canAccessPurchase, validate(createSupplierSchema), supplierController.create);
router.put('/:id', canAccessPurchase, validate(updateSupplierSchema), supplierController.update);
router.delete('/:id', canAccessAdminOnly, supplierController.delete);

// Supplier Products
router.get('/:id/products', canAccessPurchase, supplierController.getSupplierProducts);
router.post('/:id/products', canAccessPurchase, validate(assignProductSchema), supplierController.assignProduct);
router.delete('/:id/products/:productId', canAccessAdminOnly, supplierController.removeProduct);

export default router;
