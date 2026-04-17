import { Router } from 'express';
import supplierController from '../controllers/supplier.controller';
import { authenticate } from '../middleware/auth.middleware';
import { isAdmin, isSupplier } from '../middleware/role.middleware';
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
router.get('/me', authenticate, isSupplier, supplierController.getMyProfile);
router.put('/me', authenticate, isSupplier, validate(updateSupplierSelfSchema), supplierController.updateMyProfile);

// All remaining supplier routes require admin access
router.use(authenticate, isAdmin);

// Dashboard & Analytics
router.get('/dashboard', supplierController.getDashboardStats);
router.get('/analytics', supplierController.getAnalytics);

// Purchase Orders
router.get('/purchase-orders', supplierController.getAllPurchaseOrders);
router.get('/purchase-orders/:id', supplierController.getPurchaseOrderById);
router.post('/purchase-orders', validate(createPurchaseOrderSchema), supplierController.createPurchaseOrder);
router.put('/purchase-orders/:id', supplierController.updatePurchaseOrder);
router.post('/purchase-orders/:id/receive', validate(receivePurchaseOrderSchema), supplierController.receivePurchaseOrder);

// Suppliers CRUD
router.get('/', supplierController.getAll);
router.get('/:id', supplierController.getById);
router.post('/', validate(createSupplierSchema), supplierController.create);
router.put('/:id', validate(updateSupplierSchema), supplierController.update);
router.delete('/:id', supplierController.delete);

// Supplier Products
router.get('/:id/products', supplierController.getSupplierProducts);
router.post('/:id/products', validate(assignProductSchema), supplierController.assignProduct);
router.delete('/:id/products/:productId', supplierController.removeProduct);

export default router;
