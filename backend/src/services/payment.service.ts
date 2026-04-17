import supabase from '../config/supabase';
import { transformRow } from '../utils/transform.util';
import { NotFoundError, BadRequestError } from '../errors/app-error';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import env from '../config/env';
import logger from '../utils/logger.util';

const razorpay = new Razorpay({ key_id: env.RAZORPAY_KEY_ID, key_secret: env.RAZORPAY_KEY_SECRET });

class PaymentService {
  async createRazorpayOrder(amount: number, currency: string = 'INR', receipt?: string) {
    if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
      throw new BadRequestError('Payment gateway is not configured. Please contact support.');
    }
    const options = {
      amount: Math.round(amount * 100),
      currency,
      receipt: receipt || `rcpt_${Date.now()}`,
    };
    const order = await razorpay.orders.create(options);
    return order;
  }

  async verifyPayment(paymentData: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = paymentData;
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto.createHmac('sha256', env.RAZORPAY_KEY_SECRET).update(body).digest('hex');
    const isValid = expectedSignature === razorpay_signature;
    return { verified: isValid, paymentId: razorpay_payment_id, orderId: razorpay_order_id };
  }

  async processPaymentAndCreateOrder(userId: string, paymentData: any, orderData: any) {
    const verification = await this.verifyPayment(paymentData);
    if (!verification.verified) throw new BadRequestError('Payment verification failed');

    // Create the order
    const orderInsert: any = {
      user_id: userId,
      order_number: orderData.orderNumber || this.generateOrderNumber(),
      shipping_address: orderData.shippingAddress,
      billing_address: orderData.billingAddress || orderData.shippingAddress,
      payment_method: orderData.paymentMethod || 'razorpay',
      payment_status: 'paid',
      razorpay_order_id: paymentData.razorpay_order_id,
      razorpay_payment_id: paymentData.razorpay_payment_id,
      subtotal: orderData.subtotal,
      tax: orderData.tax || 0,
      shipping_fee: orderData.shippingFee || 0,
      discount: orderData.discount || 0,
      total: orderData.total,
      coupon_code: orderData.couponCode || null,
      notes: orderData.notes || null,
      status: 'confirmed',
    };

    const { data: order, error } = await supabase.from('orders').insert(orderInsert).select('*').single();
    if (error) throw error;

    // Insert order items
    if (orderData.items?.length) {
      const items = orderData.items.map((item: any) => ({
        order_id: order.id,
        product_id: item.productId,
        product_name: item.productName || item.name,
        product_image: item.productImage || item.image || null,
        price: item.price,
        quantity: item.quantity,
        total: item.price * item.quantity,
      }));
      await supabase.from('order_items').insert(items);
    }

    await supabase.from('order_status_history').insert([
      { order_id: order.id, status: 'pending', comment: 'Order placed' },
      { order_id: order.id, status: 'confirmed', comment: 'Payment confirmed via Razorpay' },
    ]);

    // Deduct stock
    for (const item of orderData.items || []) {
      const { data: prod } = await supabase.from('products').select('stock').eq('id', item.productId).single();
      if (prod) {
        await supabase.from('products').update({ stock: Math.max(0, prod.stock - item.quantity) }).eq('id', item.productId);
      }
    }

    // Update coupon usage
    if (orderData.couponCode) {
      await supabase.rpc('increment_coupon_usage', { p_code: orderData.couponCode });
    }

    // Clear cart
    const { data: cart } = await supabase.from('carts').select('id').eq('user_id', userId).maybeSingle();
    if (cart) {
      await supabase.from('cart_items').delete().eq('cart_id', cart.id).eq('saved_for_later', false);
      await supabase.from('carts').update({ subtotal: 0, tax: 0, discount: 0, total: 0, shipping_fee: 0, coupon_code: null }).eq('id', cart.id);
    }

    // Return full order
    const { data: fullOrder } = await supabase
      .from('orders').select('*, order_items(*), order_status_history(*)').eq('id', order.id).single();
    const transformed = transformRow(fullOrder);
    transformed.items = (fullOrder.order_items || []).map(transformRow);
    transformed.statusHistory = (fullOrder.order_status_history || []).map(transformRow);
    delete transformed.orderItems;
    delete transformed.orderStatusHistory;
    return transformed;
  }

  async getPaymentDetails(paymentId: string) {
    const payment = await razorpay.payments.fetch(paymentId);
    return payment;
  }

  async initiateRefund(paymentId: string, amount?: number) {
    const options: any = {};
    if (amount) options.amount = Math.round(amount * 100);
    const refund = await razorpay.payments.refund(paymentId, options);
    return refund;
  }

  private generateOrderNumber(): string {
    const now = new Date();
    const y = now.getFullYear().toString().slice(-2);
    const m = (now.getMonth() + 1).toString().padStart(2, '0');
    const d = now.getDate().toString().padStart(2, '0');
    const r = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `ORD-${y}${m}${d}-${r}`;
  }
}

export default new PaymentService();
