import supabase from '../config/supabase';
import { transformRow, toDbRow } from '../utils/transform.util';
import { NotFoundError, BadRequestError } from '../errors/app-error';
import inventoryLedger from './inventory-ledger.service';
import logger from '../utils/logger.util';
import { sendReturnRequestEmail, sendReturnStatusEmail } from '../utils/email.util';

class ReturnService {
  async createReturnRequest(userId: string, data: any) {
    const { data: order } = await supabase
      .from('orders').select('*').eq('id', data.orderId).eq('user_id', userId).maybeSingle();
    if (!order) throw new NotFoundError('Order');
    if (!['delivered'].includes(order.status)) throw new BadRequestError('Order is not eligible for return');
    // Fetch items separately (PostgREST join blocked by RLS)
    const { data: returnOrderItems } = await supabase.from('order_items').select('*').eq('order_id', data.orderId);
    const orderItemsList = returnOrderItems || [];

    const returnNumber = `RET-${Date.now().toString(36).toUpperCase()}`;
    // Support both 'type' and 'returnType' from frontend
    const returnType = data.type || data.returnType || 'return';
    // Use order's shipping_address as pickup_address (required NOT NULL)
    const pickupAddress = order.shipping_address || {};
    // Reason must match DB enum; default 'other' for free-text
    const validReasons = ['defective','wrong_item','not_as_described','damaged_in_transit','size_fit_issue','changed_mind','better_price_elsewhere','other'];
    // Derive main reason: from data.reason, first item reason, or 'other'
    const firstItemReason = data.items?.[0]?.reason;
    const reason = validReasons.includes(data.reason) ? data.reason
      : (validReasons.includes(firstItemReason) ? firstItemReason : 'other');

    const { data: returnReq, error } = await supabase
      .from('return_requests').insert({
        user_id: userId,
        order_id: data.orderId,
        return_number: returnNumber,
        reason,
        return_type: returnType,
        status: 'requested',
        description: data.description || '',
        images: data.images || [],
        pickup_address: pickupAddress,
        refund_method: data.refundMethod || 'original_payment',
        refund_amount: 0,
      }).select('*').single();
    if (error) throw error;

    // Insert return items — look up product_id from order_items
    if (data.items?.length) {
      const itemsToInsert: any[] = [];
      for (const item of data.items) {
        let orderItem: any = null;
        // Find the matching order_item
        if (item.orderItemId) {
          orderItem = orderItemsList.find((oi: any) => oi.id === item.orderItemId);
        } else if (item.productId) {
          orderItem = orderItemsList.find((oi: any) => oi.product_id === item.productId);
        }
        if (orderItem) {
          const itemReason = validReasons.includes(item.reason) ? item.reason : reason;
          itemsToInsert.push({
            return_request_id: returnReq.id,
            product_id: orderItem.product_id,
            quantity: item.quantity || 1,
            price: orderItem.price || orderItem.selling_price || 0,
            reason: itemReason,
          });
        }
      }
      if (itemsToInsert.length) await supabase.from('return_request_items').insert(itemsToInsert);
    }

    await supabase.from('return_status_history').insert({
      return_request_id: returnReq.id, status: 'requested', message: 'Return request submitted',
    });

    // Send confirmation email to user
    const { data: user } = await supabase.from('users').select('email, name').eq('id', userId).maybeSingle();
    if (user?.email) {
      sendReturnRequestEmail(user.email, user.name, returnNumber, order.order_number).catch((err: any) => {
        logger.error('Failed to send return request email: ' + err?.message);
      });
    }

    return this.getReturnRequestById(returnReq.id);
  }

  async getReturnRequests(query: any = {}) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const offset = (page - 1) * limit;

    let qb = supabase.from('return_requests').select(
      '*, return_request_items(*, products:product_id(id, name, thumbnail, selling_price)), users:user_id(id, name, email), orders:order_id(id, order_number, total)',
      { count: 'exact' }
    );
    if (query.userId) qb = qb.eq('user_id', query.userId);
    if (query.status && query.status !== 'all') qb = qb.eq('status', query.status);
    if (query.type) qb = qb.eq('return_type', query.type);
    if (query.search) qb = qb.ilike('return_number', `%${query.search}%`);
    qb = qb.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    const { data, error, count } = await qb;
    if (error) throw error;

    const returns = (data || []).map((r: any) => {
      const t = transformRow(r);
      t.items = (r.return_request_items || []).map((item: any) => {
        const ti = transformRow(item);
        if (item.products) { ti.product = transformRow(item.products); delete ti.products; }
        return ti;
      });
      delete t.returnRequestItems;
      if (r.users) { t.user = transformRow(r.users); delete t.users; }
      if (r.orders) {
        t.order = transformRow(r.orders);
        delete t.orders;
      }
      return t;
    });

    return {
      returns,
      pagination: { total: count || 0, page, limit, pages: Math.ceil((count || 0) / limit) },
    };
  }

  async getReturnRequestById(id: string) {
    const { data, error } = await supabase
      .from('return_requests')
      .select('*, return_request_items(*, products:product_id(id, name, thumbnail, selling_price)), return_status_history(*), users:user_id(id, name, email), orders:order_id(id, order_number, total)')
      .eq('id', id).maybeSingle();
    if (error) throw error;
    if (!data) throw new NotFoundError('Return request');

    const transformed = transformRow(data);
    transformed.items = (data.return_request_items || []).map((item: any) => {
      const ti = transformRow(item);
      if (item.products) { ti.product = transformRow(item.products); delete ti.products; }
      return ti;
    });
    transformed.statusHistory = (data.return_status_history || []).map(transformRow);
    delete transformed.returnRequestItems;
    delete transformed.returnStatusHistory;
    if (data.users) { transformed.user = transformRow(data.users); delete transformed.users; }
    if (data.orders) { transformed.order = transformRow(data.orders); delete transformed.orders; }
    return transformed;
  }

  async updateReturnStatus(id: string, status: string, comment?: string, refundAmountOrAdminId?: number | string) {
    const updates: any = { status };
    const refundAmount = typeof refundAmountOrAdminId === 'number' ? refundAmountOrAdminId : undefined;
    if (refundAmount !== undefined) updates.refund_amount = refundAmount;

    const { data: returnReq, error } = await supabase
      .from('return_requests').update(updates).eq('id', id).select('*').single();
    if (error) throw error;
    if (!returnReq) throw new NotFoundError('Return request');

    await supabase.from('return_status_history').insert({
      return_request_id: id, status, message: comment || '',
    });

    // If refund_completed and has refund amount, credit wallet
    if (status === 'refund_completed' && returnReq.refund_amount && returnReq.refund_amount > 0) {
      const walletService = (await import('./wallet.service')).default;
      await walletService.credit(returnReq.user_id, returnReq.refund_amount, `Refund for return ${returnReq.return_number}`, returnReq.id);
    }

    // When item is physically received back → restore stock to available
    if (status === 'received') {
      try {
        const { data: returnItems } = await supabase
          .from('return_request_items')
          .select('product_id, quantity')
          .eq('return_request_id', id);
        for (const item of returnItems || []) {
          if (!item.product_id) continue;
          await inventoryLedger.addStock(
            item.product_id,
            item.quantity,
            `Stock restored - return ${returnReq.return_number}`,
            returnReq.user_id,
          );
        }
      } catch (stockErr: any) {
        logger.error(`[return] Stock restore failed for return ${returnReq.return_number}: ${stockErr.message}`);
      }
    }

    // Send status update email to user
    const { data: user } = await supabase.from('users').select('email, name').eq('id', returnReq.user_id).maybeSingle();
    if (user?.email) {
      sendReturnStatusEmail(user.email, user.name, returnReq.return_number, status, comment).catch((err: any) => {
        logger.error('Failed to send return status email: ' + err?.message);
      });
    }

    return this.getReturnRequestById(id);
  }

  async getReturnStats() {
    const { data, error } = await supabase.from('return_requests').select('status');
    if (error) throw error;
    const rows = data || [];
    const inProgressStatuses = ['approved', 'pickup_scheduled', 'picked_up', 'received', 'inspected', 'refund_initiated', 'replacement_shipped'];
    const completedStatuses = ['refund_completed', 'closed'];
    return {
      total: rows.length,
      pending: rows.filter((r: any) => r.status === 'requested').length,
      approved: rows.filter((r: any) => r.status === 'approved').length,
      inProgress: rows.filter((r: any) => inProgressStatuses.includes(r.status)).length,
      completed: rows.filter((r: any) => completedStatuses.includes(r.status)).length,
    };
  }

  async getUserReturnRequests(userId: string, query: any = {}) {
    return this.getReturnRequests({ ...query, userId });
  }

  // ── Controller-compatible aliases ──────────────────────────────────────────
  async createReturn(userId: string, data: any) { return this.createReturnRequest(userId, data); }
  async getUserReturns(userId: string, page: number, limit: number) {
    return this.getReturnRequests({ page, limit, userId });
  }
  async getReturnById(id: string, _userId?: string) { return this.getReturnRequestById(id); }
  async getAllReturns(query: any = {}) { return this.getReturnRequests(query); }
  async updateStatus(id: string, status: string, message?: string, _adminId?: string) {
    return this.updateReturnStatus(id, status, message);
  }
}

export default new ReturnService();
