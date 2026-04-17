import { Response, NextFunction } from 'express';
import paymentService from '../services/payment.service';
import cartService from '../services/cart.service';
import supabase from '../config/supabase';
import { AuthenticatedRequest } from '../types';
import { BadRequestError } from '../errors/app-error';
import env from '../config/env';
import { sendSuccess, sendCreated } from '../utils/response.util';
import { notifyOrder } from '../utils/notify';
import { sendOrderConfirmationEmail } from '../utils/email.util';

class PaymentController {
  async createOrder(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { couponCode } = req.body;

      let cart = await cartService.getCart(userId);
      if (!cart?.items?.length) {
        throw new BadRequestError('Cart is empty');
      }

      if (couponCode) {
        cart = await cartService.applyCoupon(userId, couponCode);
      }

      const totalAmount = Number(cart.total || 0);
      if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
        throw new BadRequestError('Invalid cart total for payment');
      }

      const razorpayOrder = await paymentService.createRazorpayOrder(totalAmount, 'INR');
      const result = {
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        keyId: env.RAZORPAY_KEY_ID,
        subtotal: Number(cart.subtotal || 0),
        discount: Number(cart.discount || 0),
        deliveryCharge: Number(cart.shippingFee || 0),
        totalAmount,
      };

      sendSuccess(res, result, 'Razorpay order created');
    } catch (error) {
      next(error);
    }
  }

  async verifyPayment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { razorpayOrderId, razorpayPaymentId, razorpaySignature, shippingAddress, couponCode } = req.body;

      let cart = await cartService.getCart(userId);
      if (!cart?.items?.length) {
        throw new BadRequestError('Cart is empty');
      }

      if (couponCode) {
        cart = await cartService.applyCoupon(userId, couponCode);
      }

      const paymentData = {
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: razorpayPaymentId,
        razorpay_signature: razorpaySignature,
      };

      const orderData = {
        shippingAddress,
        billingAddress: shippingAddress,
        paymentMethod: 'razorpay',
        subtotal: Number(cart.subtotal || 0),
        tax: Number(cart.tax || 0),
        shippingFee: Number(cart.shippingFee || 0),
        discount: Number(cart.discount || 0),
        total: Number(cart.total || 0),
        couponCode: couponCode || cart.couponCode,
        items: (cart.items || []).map((item: any) => {
          const product = item.product || {};
          return {
            productId: item.productId || product.id,
            productName: product.name || item.productName || 'Product',
            productImage: Array.isArray(product.images) ? product.images[0] : undefined,
            price: Number(product.sellingPrice || item.price || 0),
            quantity: Number(item.quantity || 1),
          };
        }),
      };

      const order = await paymentService.processPaymentAndCreateOrder(userId, paymentData, orderData);

      if (order) {
        notifyOrder(order.orderNumber, order.total, order._id || order.id);
        const { data: user } = await supabase.from('users').select('email, name').eq('id', userId).maybeSingle();
        if (user) {
          const items = (order.items || []).map((i: any) => ({
            name: i.productName || 'Product', quantity: i.quantity, price: i.price,
          }));
          sendOrderConfirmationEmail(user.email, user.name, {
            orderNumber: order.orderNumber, totalAmount: order.total, items,
          }).catch((err: any) => console.error('Failed to send order confirmation email:', err?.message));
        }
      }

      sendCreated(res, order, 'Payment verified and order placed successfully');
    } catch (error) {
      next(error);
    }
  }
}

export default new PaymentController();
