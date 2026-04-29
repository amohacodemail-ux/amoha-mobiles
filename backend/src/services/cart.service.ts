import supabase from '../config/supabase';
import { transformRow, toDbRow } from '../utils/transform.util';
import { NotFoundError, BadRequestError, ConflictError } from '../errors/app-error';

const inFlightAddItemLocks = new Set<string>();

function buildAddItemLockKey(userId: string, productId: string, color?: string) {
  return `${userId}:${productId}:${color || ''}`;
}

class CartService {
  async getCart(userId: string) {
    let { data: cart } = await supabase.from('carts').select('*').eq('user_id', userId).maybeSingle();
    if (!cart) {
      const { data: newCart, error } = await supabase
        .from('carts').insert({ user_id: userId, subtotal: 0, tax: 0, shipping_fee: 0, discount: 0, total: 0 })
        .select('*').single();
      if (error) throw error;
      cart = newCart;
    }

    const { data: items } = await supabase
      .from('cart_items').select('*, products(id, name, slug, images, thumbnail, selling_price, original_price, stock, is_active, discount, colors, warranty, brand_id, category_id)')
      .eq('cart_id', cart.id).eq('saved_for_later', false);

    const { data: savedItems } = await supabase
      .from('cart_items').select('*, products(id, name, slug, images, thumbnail, selling_price, original_price, stock, is_active, discount, colors, warranty, brand_id, category_id)')
      .eq('cart_id', cart.id).eq('saved_for_later', true);

    const transformed = transformRow(cart);
    // Map cart-level fields for frontend compatibility
    transformed.totalAmount = transformed.total ?? 0;
    transformed.deliveryCharge = transformed.shippingFee ?? 0;
    transformed.totalItems = (items || []).reduce((s: number, i: any) => s + i.quantity, 0);
    if (transformed.couponCode) {
      transformed.coupon = { code: transformed.couponCode, discount: transformed.discount || 0 };
    }
    transformed.items = (items || []).map((i: any) => {
      const t = transformRow(i);
      if (i.products) {
        const p = transformRow(i.products);
        p.price = i.products.selling_price ?? i.products.original_price ?? 0;
        p.originalPrice = i.products.original_price ?? p.price;
        p.thumbnail = i.products.thumbnail || i.products.images?.[0] || '';
        p.inStock = (i.products.stock ?? 0) > 0;
        t.product = p;
      }
      t.price = t.price || i.products?.selling_price || 0;
      t.totalPrice = t.price * (t.quantity || 1);
      delete t.products;
      return t;
    });
    transformed.savedForLater = (savedItems || []).map((i: any) => {
      const t = transformRow(i);
      if (i.products) {
        const p = transformRow(i.products);
        p.price = i.products.selling_price ?? i.products.original_price ?? 0;
        p.originalPrice = i.products.original_price ?? p.price;
        p.thumbnail = i.products.thumbnail || i.products.images?.[0] || '';
        p.inStock = (i.products.stock ?? 0) > 0;
        t.product = p;
      }
      t.price = t.price || i.products?.selling_price || 0;
      t.totalPrice = t.price * (t.quantity || 1);
      delete t.products;
      return t;
    });
    return transformed;
  }

  async addItem(userId: string, productId: string, quantity: number = 1, color?: string) {
    const lockKey = buildAddItemLockKey(userId, productId, color);
    if (inFlightAddItemLocks.has(lockKey)) {
      throw new ConflictError('Add to cart already in progress for this product');
    }

    inFlightAddItemLocks.add(lockKey);
    try {
      const { data: product } = await supabase.from('products').select('id, stock, is_active, selling_price, original_price').eq('id', productId).single();
      if (!product) throw new NotFoundError('Product');
      if (!product.is_active) throw new BadRequestError('Product is not available');
      if (product.stock < quantity) throw new BadRequestError('Insufficient stock');

      const unitPrice = product.selling_price ?? product.original_price ?? 0;

      let { data: cart } = await supabase.from('carts').select('id').eq('user_id', userId).maybeSingle();
      if (!cart) {
        const { data: newCart } = await supabase
          .from('carts').insert({ user_id: userId, subtotal: 0, tax: 0, shipping_fee: 0, discount: 0, total: 0 })
          .select('id').single();
        cart = newCart!;
      }

      const { data: existing } = await supabase
        .from('cart_items').select('id, quantity').eq('cart_id', cart!.id).eq('product_id', productId).eq('saved_for_later', false).maybeSingle();

      if (existing) {
        const newQty = existing.quantity + quantity;
        await supabase.from('cart_items').update({ quantity: newQty, total_price: unitPrice * newQty }).eq('id', existing.id);
      } else {
        const { error: insertErr } = await supabase.from('cart_items').insert({
          cart_id: cart!.id, product_id: productId, quantity,
          color: color || null, saved_for_later: false,
          price: unitPrice, total_price: unitPrice * quantity
        });
        if (insertErr) throw insertErr;
      }

      await supabase.rpc('recalculate_cart', { p_cart_id: cart!.id });
      return this.getCart(userId);
    } finally {
      inFlightAddItemLocks.delete(lockKey);
    }
  }

  async updateItemQuantity(userId: string, itemId: string, quantity: number) {
    if (quantity < 1) throw new BadRequestError('Quantity must be at least 1');
    const { data: cart } = await supabase.from('carts').select('id').eq('user_id', userId).maybeSingle();
    if (!cart) throw new NotFoundError('Cart');

    const { data: item } = await supabase.from('cart_items').select('id, product_id, price').eq('id', itemId).eq('cart_id', cart.id).maybeSingle();
    if (!item) throw new NotFoundError('Cart item');

    const { data: product } = await supabase.from('products').select('stock, selling_price, original_price').eq('id', item.product_id).single();
    if (product && product.stock < quantity) throw new BadRequestError('Insufficient stock');

    const unitPrice = item.price || product?.selling_price || product?.original_price || 0;
    await supabase.from('cart_items').update({ quantity, total_price: unitPrice * quantity }).eq('id', itemId);
    await supabase.rpc('recalculate_cart', { p_cart_id: cart.id });
    return this.getCart(userId);
  }

  async removeItem(userId: string, itemId: string) {
    const { data: cart } = await supabase.from('carts').select('id').eq('user_id', userId).maybeSingle();
    if (!cart) throw new NotFoundError('Cart');
    await supabase.from('cart_items').delete().eq('id', itemId).eq('cart_id', cart.id);
    await supabase.rpc('recalculate_cart', { p_cart_id: cart.id });
    return this.getCart(userId);
  }

  async saveForLater(userId: string, itemId: string) {
    const { data: cart } = await supabase.from('carts').select('id').eq('user_id', userId).maybeSingle();
    if (!cart) throw new NotFoundError('Cart');
    await supabase.from('cart_items').update({ saved_for_later: true }).eq('id', itemId).eq('cart_id', cart.id);
    await supabase.rpc('recalculate_cart', { p_cart_id: cart.id });
    return this.getCart(userId);
  }

  async moveToCart(userId: string, itemId: string) {
    const { data: cart } = await supabase.from('carts').select('id').eq('user_id', userId).maybeSingle();
    if (!cart) throw new NotFoundError('Cart');
    await supabase.from('cart_items').update({ saved_for_later: false }).eq('id', itemId).eq('cart_id', cart.id);
    await supabase.rpc('recalculate_cart', { p_cart_id: cart.id });
    return this.getCart(userId);
  }

  async applyCoupon(userId: string, couponCode: string) {
    const { data: cart } = await supabase.from('carts').select('*').eq('user_id', userId).maybeSingle();
    if (!cart) throw new NotFoundError('Cart');

    const { data: coupon } = await supabase
      .from('coupons').select('*').eq('code', couponCode.toUpperCase()).eq('is_active', true).maybeSingle();
    if (!coupon) throw new BadRequestError('Invalid coupon code');

    const now = new Date().toISOString();
    if (coupon.valid_from && coupon.valid_from > now) throw new BadRequestError('Coupon is not yet valid');
    if (coupon.expires_at && coupon.expires_at < now) throw new BadRequestError('Coupon has expired');
    if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) throw new BadRequestError('Coupon usage limit reached');
    if (coupon.min_order_amount && cart.subtotal < coupon.min_order_amount) {
      throw new BadRequestError(`Minimum purchase of ${coupon.min_order_amount} required`);
    }

    let discount = 0;
    if (coupon.discount_type === 'percentage') {
      discount = (cart.subtotal * coupon.discount) / 100;
      if (coupon.max_discount) discount = Math.min(discount, coupon.max_discount);
    } else {
      discount = coupon.discount;
    }

    const total = Math.max(0, cart.subtotal + cart.tax + cart.shipping_fee - discount);
    await supabase.from('carts').update({ coupon_code: couponCode.toUpperCase(), discount, total }).eq('id', cart.id);
    return this.getCart(userId);
  }

  async removeCoupon(userId: string) {
    const { data: cart } = await supabase.from('carts').select('*').eq('user_id', userId).maybeSingle();
    if (!cart) throw new NotFoundError('Cart');
    const total = cart.subtotal + cart.tax + cart.shipping_fee;
    await supabase.from('carts').update({ coupon_code: null, discount: 0, total }).eq('id', cart.id);
    return this.getCart(userId);
  }

  async clearCart(userId: string) {
    const { data: cart } = await supabase.from('carts').select('id').eq('user_id', userId).maybeSingle();
    if (!cart) return;
    await supabase.from('cart_items').delete().eq('cart_id', cart.id).eq('saved_for_later', false);
    await supabase.from('carts').update({ subtotal: 0, tax: 0, discount: 0, total: 0, shipping_fee: 0, coupon_code: null }).eq('id', cart.id);
  }

  // Controller aliases
  async getAccessories(userId: string) {
    // Get products from user's cart, then recommend accessories from the same categories
    const { data: cart } = await supabase.from('carts').select('id').eq('user_id', userId).maybeSingle();
    if (!cart) return [];
    const { data: cartItems } = await supabase.from('cart_items').select('product_id').eq('cart_id', cart.id).eq('saved_for_later', false);
    if (!cartItems?.length) return [];
    const productIds = cartItems.map((i: any) => i.product_id);
    const { data: products } = await supabase.from('products').select('category_id').in('id', productIds);
    if (!products?.length) return [];
    const categoryIds = [...new Set(products.map((p: any) => p.category_id).filter(Boolean))];
    if (!categoryIds.length) return [];
    const { data, error } = await supabase.from('products').select('*').in('category_id', categoryIds).not('id', 'in', `(${productIds.join(',')})`).eq('is_active', true).limit(10);
    if (error) throw error;
    return (data || []).map(transformRow);
  }
  async removeSavedItem(userId: string, itemId: string) {
    const { data: cart } = await supabase.from('carts').select('id').eq('user_id', userId).maybeSingle();
    if (!cart) throw new NotFoundError('Cart');
    const { error } = await supabase.from('cart_items').delete().eq('cart_id', cart.id).eq('id', itemId).eq('saved_for_later', true);
    if (error) throw error;
    return this.getCart(userId);
  }
}

export default new CartService();
