import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import paymentController from '../controllers/payment.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { createRazorpayOrderSchema, verifyPaymentSchema } from '../validators/payment.validator';
import { getRateLimitKey } from '../utils/rate-limit.util';

const router = Router();

/**
 * Rate limiters for payment endpoints.
 * • create-order: max 10 attempts per 15 min per IP — prevents cart-spam / order-flooding.
 * • verify:       max 5 attempts per 15 min per IP  — critical; fewer retries tolerated.
 */
const createOrderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getRateLimitKey,
  message: {
    success: false,
    message: 'Too many payment requests. Please wait a few minutes before trying again.',
  },
});

const verifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getRateLimitKey,
  message: {
    success: false,
    message: 'Too many verification attempts. Please wait a few minutes before trying again.',
  },
});

router.use(authenticate);

router.post('/create-order', createOrderLimiter, validate(createRazorpayOrderSchema), paymentController.createOrder);
router.post('/verify', verifyLimiter, validate(verifyPaymentSchema), paymentController.verifyPayment);

export default router;

