import supabase from '../config/supabase';
import { transformRow, toDbRow } from '../utils/transform.util';
import { NotFoundError, BadRequestError } from '../errors/app-error';
import logger from '../utils/logger.util';

class PosService {
  async createPosOrder(adminId: string, orderData: any) {
    const orderInsert: any = {
      user_id: orderData.userId || null,
      order_number: this.generatePosOrderNumber(),
      shipping_address: orderData.shippingAddress || null,
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

      // Deduct stock
      for (const item of orderData.items) {
        const { data: prod } = await supabase.from('products').select('stock').eq('id', item.productId).single();
        if (prod) {
          await supabase.from('products').update({ stock: Math.max(0, prod.stock - item.quantity) }).eq('id', item.productId);
        }
      }
    }

    await supabase.from('order_status_history').insert([
      { order_id: order.id, status: 'pending', comment: 'POS order created' },
      { order_id: order.id, status: 'delivered', comment: 'POS order - immediate delivery' },
    ]);

    const { data: fullOrder } = await supabase
      .from('orders').select('*, order_items(*)').eq('id', order.id).single();
    const transformed = transformRow(fullOrder);
    transformed.items = (fullOrder.order_items || []).map(transformRow);
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
    const { data, error } = await supabase
      .from('products').select('id, name, sku, barcode, selling_price, original_price, stock, images')
      .eq('barcode', barcode).eq('is_active', true).maybeSingle();
    if (error) throw error;
    if (!data) throw new NotFoundError('Product');
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
