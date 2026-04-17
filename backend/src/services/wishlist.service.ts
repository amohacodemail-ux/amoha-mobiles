import supabase from '../config/supabase';
import { transformRow } from '../utils/transform.util';
import { NotFoundError, BadRequestError } from '../errors/app-error';

class WishlistService {
  async getWishlist(userId: string) {
    let { data: wishlist } = await supabase.from('wishlists').select('*').eq('user_id', userId).maybeSingle();
    if (!wishlist) {
      const { data: newWl, error } = await supabase
        .from('wishlists').insert({ user_id: userId }).select('*').single();
      if (error) throw error;
      wishlist = newWl;
    }

    const { data: items } = await supabase
      .from('wishlist_items').select('*, products(id, name, slug, images, thumbnail, selling_price, original_price, stock, is_active, discount, colors, warranty, brand_id, category_id)')
      .eq('wishlist_id', wishlist.id).order('added_at', { ascending: false });

    const transformed = transformRow(wishlist);
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
      delete t.products;
      return t;
    });
    return transformed;
  }

  async addItem(userId: string, productId: string) {
    let { data: wishlist } = await supabase.from('wishlists').select('id').eq('user_id', userId).maybeSingle();
    if (!wishlist) {
      const { data: newWl, error } = await supabase.from('wishlists').insert({ user_id: userId }).select('id').single();
      if (error) throw error;
      wishlist = newWl!;
    }

    const { data: existing } = await supabase
      .from('wishlist_items').select('id').eq('wishlist_id', wishlist.id).eq('product_id', productId).maybeSingle();
    if (existing) throw new BadRequestError('Product already in wishlist');

    const { data: newItem, error: insertErr } = await supabase
      .from('wishlist_items')
      .insert({ wishlist_id: wishlist.id, product_id: productId })
      .select('*, products(id, name, slug, images, thumbnail, selling_price, original_price, stock, is_active, discount, colors, warranty, brand_id, category_id)')
      .single();
    if (insertErr) throw insertErr;

    const t = transformRow(newItem);
    if (newItem.products) {
      const p = transformRow(newItem.products);
      p.price = newItem.products.selling_price ?? newItem.products.original_price ?? 0;
      p.originalPrice = newItem.products.original_price ?? p.price;
      p.thumbnail = newItem.products.thumbnail || newItem.products.images?.[0] || '';
      p.inStock = (newItem.products.stock ?? 0) > 0;
      t.product = p;
    }
    delete t.products;
    return t;
  }

  async removeItem(userId: string, productId: string) {
    const { data: wishlist } = await supabase.from('wishlists').select('id').eq('user_id', userId).maybeSingle();
    if (!wishlist) throw new NotFoundError('Wishlist');
    await supabase.from('wishlist_items').delete().eq('wishlist_id', wishlist.id).eq('product_id', productId);
    return this.getWishlist(userId);
  }

  async clearWishlist(userId: string) {
    const { data: wishlist } = await supabase.from('wishlists').select('id').eq('user_id', userId).maybeSingle();
    if (!wishlist) return;
    await supabase.from('wishlist_items').delete().eq('wishlist_id', wishlist.id);
  }

  async isInWishlist(userId: string, productId: string) {
    const { data: wishlist } = await supabase.from('wishlists').select('id').eq('user_id', userId).maybeSingle();
    if (!wishlist) return false;
    const { data } = await supabase
      .from('wishlist_items').select('id').eq('wishlist_id', wishlist.id).eq('product_id', productId).maybeSingle();
    return !!data;
  }

  // Controller aliases
  async getAll(userId: string) { return this.getWishlist(userId); }
  async add(userId: string, productId: string) { return this.addItem(userId, productId); }
  async remove(userId: string, productId: string) { return this.removeItem(userId, productId); }
  async check(userId: string, productId: string) { return this.isInWishlist(userId, productId); }
}

export default new WishlistService();
