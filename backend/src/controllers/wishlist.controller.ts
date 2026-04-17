import { Response, NextFunction } from 'express';
import wishlistService from '../services/wishlist.service';
import { AuthenticatedRequest } from '../types';
import { sendSuccess, sendMessage } from '../utils/response.util';

class WishlistController {
  async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const items = await wishlistService.getAll(req.user!.userId);
      sendSuccess(res, items, 'Wishlist fetched');
    } catch (error) {
      next(error);
    }
  }

  async add(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { productId } = req.body;
      const item = await wishlistService.add(req.user!.userId, productId);
      sendSuccess(res, item, 'Added to wishlist', 201);
    } catch (error) {
      next(error);
    }
  }

  async remove(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await wishlistService.remove(req.user!.userId, req.params.productId);
      sendMessage(res, 'Removed from wishlist');
    } catch (error) {
      next(error);
    }
  }

  async check(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const isInWishlist = await wishlistService.check(req.user!.userId, req.params.productId);
      sendSuccess(res, { isInWishlist }, 'Wishlist check');
    } catch (error) {
      next(error);
    }
  }
}

export default new WishlistController();
