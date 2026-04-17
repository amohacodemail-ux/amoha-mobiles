import supabase from '../config/supabase';
import { transformRow } from '../utils/transform.util';
import logger from '../utils/logger.util';

class CartAbandonmentService {
  async getAbandonedCarts(query: any = {}) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const offset = (page - 1) * limit;
    const minAgeMinutes = query.minAge !== undefined ? parseInt(query.minAge) : (query.hours !== undefined ? parseInt(query.hours) * 60 : 0);
    const search = (query.search || '').trim();

    let qb = supabase
      .from('carts').select('*, cart_items!inner(*, products(id, name, images, selling_price))', { count: 'exact' })
      .gt('total', 0);

    if (minAgeMinutes > 0) {
      const cutoff = new Date(Date.now() - minAgeMinutes * 60000).toISOString();
      qb = qb.lt('updated_at', cutoff);
    }

    if (search) {
      const { data: users } = await supabase
        .from('users').select('id')
        .or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
      const userIdFilter = (users || []).map((u: any) => u.id);
      if (userIdFilter.length === 0) {
        return { items: [], totalItems: 0, totalPages: 0, currentPage: page };
      }
      qb = qb.in('user_id', userIdFilter);
    }
    qb = qb.order('updated_at', { ascending: false }).range(offset, offset + limit - 1);

    const { data: carts, error, count } = await qb;
    if (error) throw error;

    // Batch fetch user info for all carts (avoid N+1)
    const cartUserIds = [...new Set((carts || []).map((c: any) => c.user_id).filter(Boolean))];
    const userMap: Record<string, any> = {};
    if (cartUserIds.length > 0) {
      const { data: users } = await supabase.from('users').select('id, name, email, phone').in('id', cartUserIds);
      for (const u of users || []) {
        userMap[u.id] = transformRow(u);
      }
    }

    const result = (carts || []).map((cart: any) => {
      const t = transformRow(cart);
      t.items = (cart.cart_items || []).map((i: any) => {
        const ti = transformRow(i);
        ti.product = i.products ? transformRow(i.products) : null;
        delete ti.products;
        return ti;
      });
      delete t.cartItems;
      t.user = userMap[cart.user_id] || null;
      // Normalize field names for admin panel compatibility
      t.itemCount = t.totalItems ?? (cart.cart_items || []).length;
      t.totalAmount = t.total ?? 0;
      return t;
    });

    return {
      items: result,
      totalItems: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
      currentPage: page,
    };
  }

  async getAbandonmentStats() {
    const now = new Date();
    const day = new Date(now.getTime() - 86400000).toISOString();
    const week = new Date(now.getTime() - 7 * 86400000).toISOString();

    const { count: last24h } = await supabase
      .from('carts').select('*', { count: 'exact', head: true })
      .lt('updated_at', day).gt('total', 0);

    const { count: lastWeek } = await supabase
      .from('carts').select('*', { count: 'exact', head: true })
      .lt('updated_at', week).gt('total', 0);

    const { data: valueSums } = await supabase
      .from('carts').select('total').lt('updated_at', day).gt('total', 0);
    const totalValue = (valueSums || []).reduce((s: number, c: any) => s + (c.total || 0), 0);

    return { last24h: last24h || 0, lastWeek: lastWeek || 0, totalAbandonedValue: totalValue };
  }

  async getAbandonedCartsCSV(minAge: number = 0) {
    const cutoff = new Date(Date.now() - minAge * 3600000).toISOString();
    const { data } = await supabase.from('carts').select('*, users:user_id(name, email, phone)').lt('updated_at', cutoff).gt('total', 0).order('updated_at', { ascending: false });
    const rows = (data || []).map((c: any) => {
      const u = c.users || {};
      return `"${u.name || ''}","${u.email || ''}","${u.phone || ''}",${c.total},${c.total_items},"${c.updated_at}"`;
    });
    return `Name,Email,Phone,CartValue,Items,LastUpdated\n${rows.join('\n')}`;
  }
}

export default new CartAbandonmentService();
