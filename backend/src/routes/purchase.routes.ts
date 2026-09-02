import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';
import purchaseController from '../controllers/purchase.controller';

const router = Router();

// Secure all purchase endpoints
router.use(authenticate);
// Allow either admin or purchase users to access these features
router.use(authorize('admin', 'purchase', 'purchase_inventory'));

// GRN
router.post('/grn', purchaseController.createGRN);
router.get('/grn', purchaseController.getGRNs);

// Returns
router.post('/returns', purchaseController.createReturn);
router.get('/returns', purchaseController.getReturns);

// Payments
router.post('/payments', purchaseController.createPayment);
router.get('/payments', purchaseController.getPayments);

// Reports
router.get('/reports', purchaseController.getReports);

export default router;

