import { Response, NextFunction } from 'express';
import cartService from '../services/cart.service';
import { AuthenticatedRequest } from '../types';
import { sendSuccess, sendMessage } from '../utils/response.util';

class CartController {
  async getCart(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const cart = await cartService.getCart(req.user!.userId);
      sendSuccess(res, cart, 'Cart fetched');
    } catch (error) {
      next(error);
    }
  }

  async addItem(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { productId, quantity, color } = req.body;
      const cart = await cartService.addItem(req.user!.userId, productId, quantity, color);
      sendSuccess(res, cart, 'Item added to cart');
    } catch (error) {
      next(error);
    }
  }

  async updateQuantity(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { quantity } = req.body;
      const cart = await cartService.updateItemQuantity(req.user!.userId, req.params.itemId, quantity);
      sendSuccess(res, cart, 'Cart item updated');
    } catch (error) {
      next(error);
    }
  }

  async removeItem(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const cart = await cartService.removeItem(req.user!.userId, req.params.itemId);
      sendSuccess(res, cart, 'Item removed from cart');
    } catch (error) {
      next(error);
    }
  }

  async clearCart(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await cartService.clearCart(req.user!.userId);
      sendMessage(res, 'Cart cleared');
    } catch (error) {
      next(error);
    }
  }

  async applyCoupon(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { code } = req.body;
      const coupon = await cartService.applyCoupon(req.user!.userId, code);
      sendSuccess(res, coupon, 'Coupon applied');
    } catch (error) {
      next(error);
    }
  }

  async removeCoupon(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const cart = await cartService.removeCoupon(req.user!.userId);
      sendSuccess(res, cart, 'Coupon removed');
    } catch (error) {
      next(error);
    }
  }

  async getAccessories(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const accessories = await cartService.getAccessories(req.user!.userId);
      sendSuccess(res, accessories, 'Cart accessories fetched');
    } catch (error) {
      next(error);
    }
  }

  async saveForLater(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const cart = await cartService.saveForLater(req.user!.userId, req.params.itemId);
      sendSuccess(res, cart, 'Item saved for later');
    } catch (error) {
      next(error);
    }
  }

  async moveToCart(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const cart = await cartService.moveToCart(req.user!.userId, req.params.itemId);
      sendSuccess(res, cart, 'Item moved to cart');
    } catch (error) {
      next(error);
    }
  }

  async removeSavedItem(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const cart = await cartService.removeSavedItem(req.user!.userId, req.params.itemId);
      sendSuccess(res, cart, 'Saved item removed');
    } catch (error) {
      next(error);
    }
  }
}

export default new CartController();
