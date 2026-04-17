import supabase from '../config/supabase';
import { transformRow, toDbRow } from '../utils/transform.util';
import { NotFoundError, BadRequestError } from '../errors/app-error';
import inventoryLedger from './inventory-ledger.service';
import logger from '../utils/logger.util';

/** Normalise an order row to match frontend expectations. */
function normalizeOrder(o: any): any {
  if (!o) return o;
  // Map DB field names to what frontend expects
  o.orderStatus = o.status || o.orderStatus || 'pending';
  o.totalAmount = o.total ?? o.totalAmount ?? 0;
  o.deliveryCharge = o.shippingFee ?? o.deliveryCharge ?? 0;
  // Normalize items so each has a `product` sub-object the frontend expects
  if (Array.isArray(o.items)) {
    o.items = o.items.map((item: any) => {
      if (!item.product || typeof item.product === 'string') {
        item.product = {
          _id: item.productId || item.product || '',
          id: item.productId || item.product || '',
          name: item.productName || 'Product',
          slug: item.productSlug || '',
          thumbnail: item.productImage || '',
          images: item.productImage ? [item.productImage] : [],
          price: item.price || 0,
        };
      }
      return item;
    });
  }
  return o;
}

class OrderService {
  async createOrder(userId: string, orderData: any) {
    // If items not provided, derive from user's cart
    let items = orderData.items;
    let subtotal = orderData.subtotal;
    let discount = orderData.discount || 0;
    let shippingFee = orderData.shippingFee || orderData.deliveryCharge || 0;
    let total = orderData.total || orderData.totalAmount;
    let couponCode = orderData.couponCode || null;

    if (!items || items.length === 0) {
      // Fetch cart
      const { data: cart } = await supabase.from('carts').select('*').eq('user_id', userId).maybeSingle();
      if (!cart) throw new BadRequestError('Cart is empty');

      const { data: cartItems } = await supabase
        .from('cart_items').select('*, products(id, name, images, thumbnail, selling_price, original_price)')
        .eq('cart_id', cart.id).eq('saved_for_later', false);
      if (!cartItems || cartItems.length === 0) throw new BadRequestError('Cart is empty');

      items = cartItems.map((ci: any) => ({
        productId: ci.product_id,
        productName: ci.products?.name || 'Product',
        productImage: ci.products?.thumbnail || ci.products?.images?.[0] || null,
        price: ci.products?.selling_price || ci.price || 0,
        quantity: ci.quantity,
        color: ci.color,
      }));
      subtotal = subtotal || cart.subtotal || items.reduce((s: number, i: any) => s + i.price * i.quantity, 0);
      discount = discount || cart.discount || 0;
      shippingFee = shippingFee || cart.shipping_fee || 0;
      total = total || cart.total || (subtotal - discount + shippingFee);
      couponCode = couponCode || cart.coupon_code || null;
    }

    const orderInsert: any = {
      user_id: userId,
      order_number: orderData.orderNumber || this.generateOrderNumber(),
      shipping_address: orderData.shippingAddress,
      billing_address: orderData.billingAddress || orderData.shippingAddress,
      payment_method: orderData.paymentMethod,
      payment_status: orderData.paymentStatus || 'pending',
      razorpay_order_id: orderData.razorpayOrderId || null,
      razorpay_payment_id: orderData.razorpayPaymentId || null,
      subtotal,
      tax: orderData.tax || 0,
      shipping_fee: shippingFee,
      discount,
      total,
      coupon_code: couponCode,
      notes: orderData.notes || null,
      status: 'placed',
    };

    const { data: order, error } = await supabase
      .from('orders').insert(orderInsert).select('*').single();
    if (error) throw error;

    // Insert order items
    if (items && items.length > 0) {
      const orderItems = items.map((item: any) => ({
        order_id: order.id,
        product_id: item.productId,
        product_name: item.productName || item.name,
        product_image: item.productImage || item.image || null,
        price: item.price,
        quantity: item.quantity,
        total: item.price * item.quantity,
      }));
      const { error: itemErr } = await supabase.from('order_items').insert(orderItems);
      if (itemErr) throw itemErr;
    }

    // Insert initial status history
    await supabase.from('order_status_history').insert({
      order_id: order.id, status: 'placed', comment: 'Order placed',
    });

    // Reserve stock via inventory ledger (validates availability)
    try {
      const reserveItems = (items || []).map((item: any) => ({
        productId: item.productId,
        quantity: item.quantity,
      }));
      await inventoryLedger.reserveForOrder(order.id, reserveItems, userId);
    } catch (stockErr: any) {
      // If stock reservation fails, cancel the order and rethrow
      await supabase.from('order_items').delete().eq('order_id', order.id);
      await supabase.from('orders').delete().eq('id', order.id);
      await supabase.from('order_status_history').delete().eq('order_id', order.id);
      throw new BadRequestError(stockErr.message || 'Insufficient stock');
    }

    // Clear user's cart after successful order
    const { data: userCart } = await supabase.from('carts').select('id').eq('user_id', userId).maybeSingle();
    if (userCart) {
      await supabase.from('cart_items').delete().eq('cart_id', userCart.id).eq('saved_for_later', false);
      await supabase.from('carts').update({ subtotal: 0, tax: 0, discount: 0, total: 0, shipping_fee: 0, coupon_code: null }).eq('id', userCart.id);
    }

    return this.getOrderById(order.id);
  }

  async getOrders(query: any = {}) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const offset = (page - 1) * limit;

    let qb = supabase.from('orders').select('*, order_items(*)', { count: 'exact' });

    if (query.userId) qb = qb.eq('user_id', query.userId);
    if (query.status || query.orderStatus) qb = qb.eq('status', query.status || query.orderStatus);
    if (query.paymentStatus) qb = qb.eq('payment_status', query.paymentStatus);
    if (query.source === 'pos') qb = qb.eq('is_walk_in', true);
    else if (query.source === 'online') qb = qb.eq('is_walk_in', false);
    if (query.search) {
      qb = qb.or(`order_number.ilike.%${query.search}%`);
    }
    if (query.startDate) qb = qb.gte('created_at', query.startDate);
    if (query.endDate) qb = qb.lte('created_at', query.endDate);

    qb = qb.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    const { data: orders, error, count } = await qb;
    if (error) throw error;

    // Batch-fetch user data for all orders
    const userIds = [...new Set((orders || []).map((o: any) => o.user_id).filter(Boolean))];
    const usersMap: Record<string, any> = {};
    if (userIds.length > 0) {
      const { data: users } = await supabase.from('users').select('id, name, email, phone').in('id', userIds);
      (users || []).forEach((u: any) => { usersMap[u.id] = transformRow(u); });
    }

    const totalOrders = count || 0;
    const totalPages = Math.ceil(totalOrders / limit);
    return {
      orders: (orders || []).map((o: any) => {
        const t = transformRow(o);
        t.items = (o.order_items || []).map(transformRow);
        t.user = usersMap[o.user_id] || { _id: o.user_id, name: 'Unknown', email: '' };
        delete t.orderItems;
        return normalizeOrder(t);
      }),
      totalOrders,
      totalPages,
      currentPage: page,
      pagination: { total: totalOrders, page, limit, pages: totalPages },
    };
  }

  async getOrderById(orderId: string) {
    const { data: order, error } = await supabase
      .from('orders').select('*, order_items(*), order_status_history(*)').eq('id', orderId).maybeSingle();
    if (error) throw error;
    if (!order) throw new NotFoundError('Order');

    // Get user info
    const { data: user } = await supabase.from('users').select('id, name, email, phone').eq('id', order.user_id).maybeSingle();

    const transformed = transformRow(order);
    transformed.items = (order.order_items || []).map(transformRow);
    transformed.statusHistory = (order.order_status_history || []).map(transformRow);
    transformed.user = user ? transformRow(user) : null;
    delete transformed.orderItems;
    delete transformed.orderStatusHistory;
    return normalizeOrder(transformed);
  }

  async getUserOrders(userId: string, query: any = {}) {
    return this.getOrders({ ...query, userId });
  }

  async updateOrderStatus(orderId: string, status: string, comment?: string) {
    const { data: order, error } = await supabase
      .from('orders').update({ status }).eq('id', orderId).select('*, order_items(*)').single();
    if (error) throw error;
    if (!order) throw new NotFoundError('Order');

    await supabase.from('order_status_history').insert({
      order_id: orderId, status, comment: comment || null,
    });

    // When delivered: move reserved → sold
    if (status === 'delivered' && order.order_items) {
      const soldItems = order.order_items.map((item: any) => ({
        productId: item.product_id,
        quantity: item.quantity,
      }));
      await inventoryLedger.markSoldForOrder(orderId, soldItems);
    }

    // When cancelled at this stage: move reserved → available
    if (status === 'cancelled' && order.order_items) {
      const unreserveItems = order.order_items.map((item: any) => ({
        productId: item.product_id,
        quantity: item.quantity,
      }));
      await inventoryLedger.unreserveForOrder(orderId, unreserveItems);
    }

    return this.getOrderById(orderId);
  }

  async updatePaymentStatus(orderId: string, paymentData: any) {
    const updates: any = { payment_status: paymentData.paymentStatus };
    if (paymentData.razorpayPaymentId) updates.razorpay_payment_id = paymentData.razorpayPaymentId;
    if (paymentData.razorpayOrderId) updates.razorpay_order_id = paymentData.razorpayOrderId;

    const { data: order, error } = await supabase
      .from('orders').update(updates).eq('id', orderId).select('*').single();
    if (error) throw error;
    if (!order) throw new NotFoundError('Order');
    return this.getOrderById(orderId);
  }

  async cancelOrder(orderId: string, userId?: string) {
    let qb = supabase.from('orders').select('*, order_items(*)').eq('id', orderId);
    if (userId) qb = qb.eq('user_id', userId);
    const { data: order } = await qb.maybeSingle();
    if (!order) throw new NotFoundError('Order');
    if (!['pending', 'placed', 'confirmed'].includes(order.status)) {
      throw new BadRequestError('Order cannot be cancelled at this stage');
    }

    // Restore stock via inventory ledger
    const unreserveItems = (order.order_items || []).map((item: any) => ({
      productId: item.product_id,
      quantity: item.quantity,
    }));
    await inventoryLedger.unreserveForOrder(orderId, unreserveItems);

    await supabase.from('orders').update({ status: 'cancelled' }).eq('id', orderId);
    await supabase.from('order_status_history').insert({ order_id: orderId, status: 'cancelled', comment: 'Order cancelled' });

    return this.getOrderById(orderId);
  }

  private generateOrderNumber(): string {
    const now = new Date();
    const y = now.getFullYear().toString().slice(-2);
    const m = (now.getMonth() + 1).toString().padStart(2, '0');
    const d = now.getDate().toString().padStart(2, '0');
    const r = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `ORD-${y}${m}${d}-${r}`;
  }

  // Controller aliases
  async create(userId: string, data: any) { return this.createOrder(userId, data); }
  async getAll(query?: any) { return this.getOrders(query); }
  async getAllOrders(query?: any) { return this.getOrders(query); }
  async getById(id: string) { return this.getOrderById(id); }
  async cancel(orderId: string) { return this.cancelOrder(orderId); }
  async trackOrder(orderId: string) {
    const { data, error } = await supabase.from('order_status_history').select('*').eq('order_id', orderId).order('created_at', { ascending: true });
    if (error) throw error;
    const order = await this.getOrderById(orderId);
    return { order, statusHistory: (data || []).map(transformRow) };
  }
}

export default new OrderService();
