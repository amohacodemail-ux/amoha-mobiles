import { Request, Response, NextFunction } from 'express';
import orderService from '../services/order.service';
import supabase from '../config/supabase';
import { transformRow } from '../utils/transform.util';
import { AuthenticatedRequest } from '../types';
import { sendSuccess, sendCreated, sendMessage } from '../utils/response.util';
import { notifyOrder } from '../utils/notify';
import { sendOrderConfirmationEmail, sendOrderStatusEmail, sendOrderCancellationEmail } from '../utils/email.util';
import { generateInvoicePDF } from '../utils/invoice.util';
import activityLogService from '../services/activity-log.service';

class OrderController {
  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const order = await orderService.createOrder(req.user!.userId, req.body);
      if (order) {
        notifyOrder(order.orderNumber, order.total, order._id || order.id);
        const { data: user } = await supabase.from('users').select('id, name, email, phone').eq('id', req.user!.userId).maybeSingle();
        if (user) {
          const items = (order.items || []).map((i: any) => ({
            name: i.productName || 'Product', quantity: i.quantity, price: i.price,
          }));
          sendOrderConfirmationEmail(user.email, user.name, {
            orderNumber: order.orderNumber, totalAmount: order.total, items,
          }).catch((err: any) => console.error('Failed to send order confirmation email:', err?.message));
        }
      }
      sendCreated(res, order, 'Order placed successfully');
    } catch (error) { next(error); }
  }

  async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await orderService.getUserOrders(req.user!.userId, req.query);
      sendSuccess(res, result, 'Orders fetched');
    } catch (error) { next(error); }
  }

  async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const order = await orderService.getOrderById(req.params.id);
      sendSuccess(res, order, 'Order fetched');
    } catch (error) { next(error); }
  }

  async cancel(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { reason } = req.body;
      const order = await orderService.cancelOrder(req.params.id, req.user!.userId);
      if (order) {
        const { data: user } = await supabase.from('users').select('email, name').eq('id', req.user!.userId).maybeSingle();
        if (user) {
          sendOrderCancellationEmail(user.email, user.name, order.orderNumber, reason)
            .catch((err: any) => console.error('Failed to send cancellation email:', err?.message));
        }
      }
      sendSuccess(res, order, 'Order cancelled');
    } catch (error) { next(error); }
  }

  async trackOrder(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const order = await orderService.getOrderById(req.params.id);
      sendSuccess(res, { statusHistory: order.statusHistory, status: order.status }, 'Order tracking info');
    } catch (error) { next(error); }
  }

  async downloadInvoice(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const order: any = await orderService.getOrderById(req.params.id);
      const { data: user } = await supabase.from('users').select('name, email, phone').eq('id', req.user!.userId).maybeSingle();
      generateInvoicePDF(res, {
        orderNumber: order.orderNumber,
        orderDate: order.createdAt,
        customerName: user?.name || 'Customer',
        customerEmail: user?.email || '',
        customerPhone: user?.phone || '',
        shippingAddress: order.shippingAddress,
        items: (order.items || []).map((i: any) => ({ name: i.productName || 'Product', quantity: i.quantity, price: i.price })),
        subtotal: order.subtotal,
        discount: order.discount,
        deliveryCharge: order.shippingFee,
        totalAmount: order.total,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        couponCode: order.couponCode,
      });
    } catch (error) { next(error); }
  }

  async getAllOrders(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await orderService.getOrders(req.query);
      sendSuccess(res, result, 'All orders fetched');
    } catch (error) { next(error); }
  }

  async updateOrderStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { orderStatus, message, trackingNumber, trackingUrl, logisticsPartner, courierAwbNumber } = req.body;
      let order = await orderService.updateOrderStatus(req.params.id, orderStatus, message);
      if (order && (trackingNumber || trackingUrl || logisticsPartner || courierAwbNumber)) {
        const updates: any = {};
        if (trackingNumber) updates.tracking_number = trackingNumber;
        if (trackingUrl) updates.tracking_url = trackingUrl;
        if (logisticsPartner) updates.logistics_partner = logisticsPartner;
        if (courierAwbNumber) updates.courier_awb_number = courierAwbNumber;
        await supabase.from('orders').update(updates).eq('id', req.params.id);
        order = await orderService.getOrderById(req.params.id);
      }
      if (order) {
        const { data: customer } = await supabase.from('users').select('email, name').eq('id', order.userId).maybeSingle();
        if (customer) {
          sendOrderStatusEmail(customer.email, customer.name, order.orderNumber, orderStatus, message).catch((err: any) => {
            console.error('Failed to send order status email:', err?.message);
          });
        }
      }
      sendSuccess(res, order, 'Order status updated');
      activityLogService.log({ adminId: req.user?.userId, action: 'status_change', entity: 'order', entityId: req.params.id, details: `Order status changed to ${orderStatus}`, ipAddress: req.ip }).catch(() => {});
    } catch (error) { next(error); }
  }

  async publicTrackOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const { orderNumber, phone } = req.query;
      if (!orderNumber || !phone) return res.status(400).json({ success: false, message: 'Order number and phone are required' });
      const phoneStr = String(phone).replace(/[^0-9+]/g, '');
      if (phoneStr.length < 10 || phoneStr.length > 15) return res.status(400).json({ success: false, message: 'Invalid phone number format' });

      const { data: order } = await supabase.from('orders').select('id, order_number, status, created_at, total, tracking_number, tracking_url, logistics_partner, shipping_address, walk_in_customer_phone').eq('order_number', (orderNumber as string).toUpperCase()).maybeSingle();
      if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

      // Verify phone matches shipping address or walk-in phone
      const addr = order.shipping_address as any;
      if (addr?.phone !== phoneStr && order.walk_in_customer_phone !== phoneStr) {
        return res.status(404).json({ success: false, message: 'Order not found. Please check your order number and phone number.' });
      }

      const { data: history } = await supabase.from('order_status_history').select('*').eq('order_id', order.id).order('created_at');
      sendSuccess(res, {
        orderNumber: order.order_number, orderStatus: order.status, statusHistory: (history || []).map(transformRow),
        trackingNumber: order.tracking_number, trackingUrl: order.tracking_url, logisticsPartner: order.logistics_partner,
        totalAmount: order.total, createdAt: order.created_at,
      }, 'Order tracking info');
    } catch (error) { next(error); }
  }
}

export default new OrderController();
