import supabase from '../config/supabase';
import { transformRow, toDbRow } from '../utils/transform.util';
import { NotFoundError, BadRequestError } from '../errors/app-error';
import inventoryLedger from './inventory-ledger.service';
import logger from '../utils/logger.util';

class PosService {
  async createPosOrder(adminId: string, orderData: any) {
    const orderInsert: any = {
      user_id: orderData.userId || null,
      order_number: this.generatePosOrderNumber(),
      shipping_address: orderData.shippingAddress || {},
      billing_address: orderData.billingAddress || null,
      payment_method: orderData.paymentMethod || 'cash',
      payment_status: 'paid',
      subtotal: orderData.subtotal,
      tax: orderData.tax || 0,
      shipping_fee: 0,
      discount: orderData.discount || 0,
      total: orderData.total,
      coupon_code: orderData.couponCode || null,
      notes: orderData.notes || 'POS Order',
      status: 'delivered',
      is_walk_in: true,
      walk_in_customer_name: orderData.customerName || orderData.walkInCustomerName || null,
      walk_in_customer_phone: orderData.customerPhone || orderData.walkInCustomerPhone || null,
      walk_in_customer_email: orderData.customerEmail || orderData.walkInCustomerEmail || null,
      pos_payment_method: orderData.posPaymentMethod || orderData.paymentMethod || 'cash',
      pos_discount: orderData.posDiscount || orderData.discount || 0,
      pos_discount_type: orderData.posDiscountType || 'fixed',
      gst_amount: orderData.gstAmount || 0,
      gst_rate: orderData.gstRate || 0,
    };

    const { data: order, error } = await supabase.from('orders').insert(orderInsert).select('*').single();
    if (error) throw error;

    // Insert order items
    if (orderData.items?.length) {
      const items = orderData.items.map((item: any) => ({
        order_id: order.id,
        product_id: item.productId,
        product_name: item.productName || item.name,
        product_image: item.productImage || null,
        price: item.price,
        quantity: item.quantity,
        total: item.price * item.quantity,
      }));
      await supabase.from('order_items').insert(items);

      // Deduct stock via inventory ledger — available → sold directly (no reserve step for POS)
      try {
        const saleItems = orderData.items
          .filter((item: any) => item.productId)
          .map((item: any) => ({ productId: item.productId, quantity: item.quantity }));
        if (saleItems.length) {
          await inventoryLedger.markDirectSale(order.id, saleItems, adminId);
        }
      } catch (stockErr: any) {
        logger.warn(`POS stock deduction failed for order ${order.order_number}: ${stockErr.message}`);
      }
    }

    await supabase.from('order_status_history').insert([
      { order_id: order.id, status: 'pending', comment: 'POS order created' },
      { order_id: order.id, status: 'delivered', comment: 'POS order - immediate delivery' },
    ]);

    const { data: fullOrder } = await supabase.from('orders').select('*').eq('id', order.id).single();
    const { data: itemsData } = await supabase.from('order_items').select('*').eq('order_id', order.id);
    const transformed = transformRow(fullOrder);
    transformed.items = (itemsData || []).map(transformRow);
    delete transformed.orderItems;
    return transformed;
  }

  async searchProducts(query: string) {
    const { data, error } = await supabase
      .from('products').select('id, name, sku, barcode, selling_price, original_price, stock, images')
      .eq('is_active', true)
      .or(`name.ilike.%${query}%,sku.ilike.%${query}%,barcode.ilike.%${query}%`)
      .order('name').limit(20);
    if (error) throw error;
    return (data || []).map(transformRow);
  }

  async getProductByBarcode(barcode: string) {
    // No is_active filter — POS counter must be able to scan any product (incl. restocked ones)
    const { data, error } = await supabase
      .from('products').select('id, name, sku, barcode, selling_price, original_price, stock, images')
      .eq('barcode', barcode).maybeSingle();
    if (error) throw error;
    if (!data) {
      // Fallback: try SKU match
      const { data: bySku } = await supabase
        .from('products').select('id, name, sku, barcode, selling_price, original_price, stock, images')
        .eq('sku', barcode).maybeSingle();
      if (!bySku) throw new NotFoundError('Product');
      return transformRow(bySku);
    }
    return transformRow(data);
  }

  private generatePosOrderNumber(): string {
    const now = new Date();
    const y = now.getFullYear().toString().slice(-2);
    const m = (now.getMonth() + 1).toString().padStart(2, '0');
    const d = now.getDate().toString().padStart(2, '0');
    const r = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `POS-${y}${m}${d}-${r}`;
  }
}

export default new PosService();
