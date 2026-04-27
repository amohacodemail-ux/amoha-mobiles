import { Request, Response, NextFunction } from 'express';
import supabase from '../config/supabase';
import { transformRow } from '../utils/transform.util';
import { AuthenticatedRequest } from '../types';
import { sendSuccess, sendCreated, sendMessage } from '../utils/response.util';
import { notifyOrder } from '../utils/notify';
import { v4 as uuidv4 } from 'uuid';
import { sendOrderConfirmationEmail } from '../utils/email.util';
import logger from '../utils/logger.util';

class PosController {
  async createOrder(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { items, customerName, customerPhone, customerEmail, paymentMethod, posDiscount, posDiscountType, gstEnabled: gstEnabledOverride, notes } = req.body;
      if (!items || !Array.isArray(items) || items.length === 0) return sendMessage(res, 'At least one item is required', 400);
      if (!paymentMethod) return sendMessage(res, 'Payment method is required', 400);

      const orderItems: any[] = [];
      let subtotal = 0;
      for (const item of items) {
        if (!item.productId || !item.quantity || item.quantity < 1) return sendMessage(res, 'Each item needs productId and quantity', 400);
        const { data: product } = await supabase.from('products').select('*').eq('id', item.productId).single();
        if (!product) return sendMessage(res, `Product not found: ${item.productId}`, 404);
        if (product.stock < item.quantity) return sendMessage(res, `Insufficient stock for "${product.name}". Available: ${product.stock}, Requested: ${item.quantity}`, 400);
        const price = item.price ?? product.selling_price;
        const itemGstRate = typeof item.gstRate === 'number' ? item.gstRate : null;
        orderItems.push({ product_id: product.id, product_name: product.name, product_image: product.images?.[0] || null, quantity: item.quantity, price, total: price * item.quantity, item_gst_rate: itemGstRate });
        subtotal += price * item.quantity;
      }

      let discount = 0;
      if (posDiscount && posDiscount > 0) {
        discount = posDiscountType === 'percentage' ? Math.round((subtotal * posDiscount) / 100) : posDiscount;
        if (discount > subtotal) discount = subtotal;
      }

      const { data: settings } = await supabase.from('site_settings').select('*').limit(1).maybeSingle();
      const billing = settings?.billing_settings || {};
      // gstEnabled: use request override if provided, else fall back to settings
      const enableGst = typeof gstEnabledOverride === 'boolean' ? gstEnabledOverride : (billing?.enableGst ?? false);
      const defaultGstRate = billing?.gstRate ?? 18;
      const afterDiscount = subtotal - discount;
      const discountRatio = subtotal > 0 ? afterDiscount / subtotal : 1;

      // Calculate GST per item (inclusive — extracted from price)
      let totalGstAmount = 0;
      if (enableGst) {
        for (const item of orderItems) {
          const rate = item.item_gst_rate !== null ? item.item_gst_rate : defaultGstRate;
          if (rate > 0) {
            const itemAfterDiscount = item.total * discountRatio;
            totalGstAmount += Math.round(itemAfterDiscount - (itemAfterDiscount * 100) / (100 + rate));
          }
        }
      }
      const gstAmount = totalGstAmount;
      const totalAmount = afterDiscount;

      const timestamp = Date.now().toString(36).toUpperCase();
      const random = uuidv4().slice(0, 6).toUpperCase();
      const orderNumber = `POS-${timestamp}-${random}`;

      const prefix = billing?.invoicePrefix || 'INV';
      const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const todayStart = new Date(new Date().setHours(0, 0, 0, 0)).toISOString();
      const { count: countToday } = await supabase.from('orders').select('*', { count: 'exact', head: true }).eq('is_walk_in', true).gte('created_at', todayStart);
      const invoiceNumber = `${prefix}-${todayStr}-${String((countToday || 0) + 1).padStart(4, '0')}`;

      const { data: order, error } = await supabase.from('orders').insert({
        order_number: orderNumber, user_id: req.user!.userId,
        shipping_address: { fullName: customerName || 'Walk-in Customer', phone: customerPhone || '0000000000', addressLine1: billing?.billingAddress || 'Counter Sale', city: billing?.billingCity || 'Store', state: billing?.billingState || 'Store', pincode: billing?.billingPincode || '000000' },
        payment_method: 'cod', payment_status: 'paid', status: 'delivered',
        subtotal, discount, shipping_fee: 0, total: totalAmount,
        is_walk_in: true, walk_in_customer_name: customerName || 'Walk-in Customer',
        walk_in_customer_phone: customerPhone || '', walk_in_customer_email: customerEmail || '',
        pos_payment_method: paymentMethod, pos_discount: posDiscount || 0, pos_discount_type: posDiscountType || 'fixed',
        gst_amount: gstAmount, gst_rate: enableGst ? defaultGstRate : 0, invoice_number: invoiceNumber,
        notes: notes || 'POS Order',
      }).select('*').single();
      if (error) throw error;

      const itemsInsert = orderItems.map(i => ({ ...i, order_id: order.id }));
      await supabase.from('order_items').insert(itemsInsert);
      await supabase.from('order_status_history').insert([
        { order_id: order.id, status: 'pending', comment: 'POS counter order' },
        { order_id: order.id, status: 'delivered', comment: `Counter sale - paid via ${paymentMethod}` },
      ]);

      for (const item of orderItems) {
        const { data: prod } = await supabase.from('products').select('stock').eq('id', item.product_id).single();
        if (prod) {
          const newStock = Math.max(0, prod.stock - item.quantity);
          await supabase.from('products').update({ stock: newStock, is_active: newStock > 0 }).eq('id', item.product_id);
        }
      }

      notifyOrder(order.order_number, order.total, order.id);

      // Send receipt email if customer email was provided
      if (customerEmail) {
        sendOrderConfirmationEmail(customerEmail, customerName || 'Valued Customer', {
          orderNumber: orderNumber,
          totalAmount: totalAmount,
          items: orderItems.map(i => ({ name: i.product_name, quantity: i.quantity, price: i.price })),
        }).catch((err: any) => {
          logger.error('Failed to send POS receipt email: ' + err?.message);
        });
      }

      const { data: fullOrder } = await supabase.from('orders').select('*, order_items(*)').eq('id', order.id).single();
      const t = transformRow(fullOrder);
      t.items = (fullOrder.order_items || []).map(transformRow);
      delete t.orderItems;

      sendCreated(res, { order: t, billing, gstAmount, gstRate: enableGst ? defaultGstRate : 0, invoiceNumber }, 'POS order created and stock updated');
    } catch (error) { next(error); }
  }

  async getOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;
      const search = req.query.search as string;

      let qb = supabase.from('orders').select('*, order_items(*)', { count: 'exact' }).eq('is_walk_in', true);
      if (search) {
        qb = qb.or(`order_number.ilike.%${search}%,invoice_number.ilike.%${search}%,walk_in_customer_name.ilike.%${search}%,walk_in_customer_phone.ilike.%${search}%`);
      }
      qb = qb.order('created_at', { ascending: false }).range(offset, offset + limit - 1);
      const { data: orders, error, count } = await qb;
      if (error) throw error;

      sendSuccess(res, {
        orders: (orders || []).map((o: any) => { const t = transformRow(o); t.items = (o.order_items || []).map(transformRow); delete t.orderItems; return t; }),
        totalOrders: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
        currentPage: page,
      }, 'POS orders fetched');
    } catch (error) { next(error); }
  }

  async getTodayStats(req: Request, res: Response, next: NextFunction) {
    try {
      const todayStart = new Date(new Date().setHours(0, 0, 0, 0)).toISOString();
      const { data: todayOrders } = await supabase.from('orders').select('total, discount, gst_amount, pos_payment_method').eq('is_walk_in', true).gte('created_at', todayStart);

      const result = { totalOrders: 0, totalRevenue: 0, totalDiscount: 0, totalGst: 0, cashOrders: 0, cardOrders: 0, upiOrders: 0, cashRevenue: 0, cardRevenue: 0, upiRevenue: 0 };
      for (const o of todayOrders || []) {
        result.totalOrders++;
        result.totalRevenue += o.total || 0;
        result.totalDiscount += o.discount || 0;
        result.totalGst += o.gst_amount || 0;
        if (o.pos_payment_method === 'cash') { result.cashOrders++; result.cashRevenue += o.total || 0; }
        if (o.pos_payment_method === 'card') { result.cardOrders++; result.cardRevenue += o.total || 0; }
        if (o.pos_payment_method === 'upi') { result.upiOrders++; result.upiRevenue += o.total || 0; }
      }

      sendSuccess(res, result, 'Today POS stats');
    } catch (error) { next(error); }
  }

  async getBillingInfo(_req: Request, res: Response, next: NextFunction) {
    try {
      const { data: settings } = await supabase.from('site_settings').select('*').limit(1).maybeSingle();
      sendSuccess(res, {
        billing: settings?.billing_settings || {},
        siteName: settings?.site_name || 'AMOHA Mobiles',
        contactPhone: settings?.contact_phone || '',
        contactEmail: settings?.contact_email || '',
        address: settings?.address || '',
      }, 'Billing info fetched');
    } catch (error) { next(error); }
  }
}

export default new PosController();
