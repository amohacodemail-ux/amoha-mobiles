import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import couponService from '../services/coupon.service';
import { authenticate } from '../middleware/auth.middleware';
import { isAdmin } from '../middleware/role.middleware';
import { sendSuccess, sendCreated, sendMessage } from '../utils/response.util';

const router = Router();

// Public - validate coupon
router.post('/validate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code, orderAmount } = req.body;
    const result = await couponService.validate(code, orderAmount || 0);
    sendSuccess(res, result, result.message);
  } catch (error) {
    next(error);
  }
});

// Admin routes
router.get('/', authenticate, isAdmin, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const coupons = await couponService.getAll();
    sendSuccess(res, coupons, 'Coupons fetched');
  } catch (error) {
    next(error);
  }
});

router.post('/', authenticate, isAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const coupon = await couponService.create(req.body);
    sendCreated(res, coupon, 'Coupon created');
  } catch (error) {
    next(error);
  }
});

router.put('/:id', authenticate, isAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const coupon = await couponService.update(req.params.id, req.body);
    sendSuccess(res, coupon, 'Coupon updated');
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authenticate, isAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await couponService.delete(req.params.id);
    sendMessage(res, 'Coupon deleted');
  } catch (error) {
    next(error);
  }
});

export default router;
