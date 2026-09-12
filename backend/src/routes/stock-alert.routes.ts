import { Router } from 'express';
import stockAlertController from '../controllers/stock-alert.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Phase 7: API for stock-alert subscription (Authenticated only)
router.use(authenticate);

router.post('/', stockAlertController.subscribe);
router.delete('/:productId', stockAlertController.unsubscribe);
router.get('/check/:productId', stockAlertController.checkStatus);

export default router;
