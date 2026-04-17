import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import orderController from '../controllers/order.controller';
import { authenticate } from '../middleware/auth.middleware';
import { isAdmin } from '../middleware/role.middleware';
import { validate } from '../middleware/validate.middleware';
import { createOrderSchema, updateOrderStatusSchema, cancelOrderSchema } from '../validators/order.validator';
import { getRateLimitKey } from '../utils/rate-limit.util';

const router = Router();

// Rate limiter for public order tracking to prevent enumeration
const trackOrderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { success: false, message: 'Too many tracking requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getRateLimitKey,
});

// Public route - track order by order number & phone (walk-in customers)
router.get('/track/public', trackOrderLimiter, orderController.publicTrackOrder);

// All other order routes are protected
router.use(authenticate);

// User routes
router.post('/', validate(createOrderSchema), orderController.create);
router.get('/', orderController.getAll);
router.get('/:id', orderController.getById);
router.get('/:id/invoice', orderController.downloadInvoice);
router.put('/:id/cancel', validate(cancelOrderSchema), orderController.cancel);
router.get('/:id/track', orderController.trackOrder);

// Admin routes
router.get('/admin/all', isAdmin, orderController.getAllOrders);
router.put('/admin/:id/status', isAdmin, validate(updateOrderStatusSchema), orderController.updateOrderStatus);

export default router;
