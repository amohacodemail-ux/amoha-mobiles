import supabase from '../config/supabase';
import { transformRow } from '../utils/transform.util';
import logger from '../utils/logger.util';

class ProductViewService {
  async trackView(productId: string, userId?: string, sessionId?: string, source?: string) {
    const insert: any = { product_id: productId };
    if (userId) insert.user_id = userId;
    if (sessionId) insert.session_id = sessionId;
    if (source) insert.source = source;

    const { error } = await supabase.from('product_views').insert(insert);
    if (error) logger.error('Failed to track product view:', error.message);
  }

  async getProductViews(productId: string, query: any = {}) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const offset = (page - 1) * limit;

    const { data, error, count } = await supabase
      .from('product_views').select('*', { count: 'exact' })
      .eq('product_id', productId)
      .order('viewed_at', { ascending: false }).range(offset, offset + limit - 1);
    if (error) throw error;

    return {
      views: (data || []).map(transformRow),
      pagination: { total: count || 0, page, limit, pages: Math.ceil((count || 0) / limit) },
    };
  }

  async getViewAnalytics(query: any = {}) {
    const startDate = query.startDate || new Date(Date.now() - 30 * 86400000).toISOString();
    const endDate = query.endDate || new Date().toISOString();

    // Most viewed products
    const { data: topProducts } = await supabase
      .from('product_views').select('product_id, products(name)')
      .gte('viewed_at', startDate).lte('viewed_at', endDate);

    const productCounts: Record<string, { productId: string; name: string; views: number }> = {};
    for (const v of topProducts || []) {
      const pid = v.product_id;
      if (!productCounts[pid]) {
        productCounts[pid] = { productId: pid, name: (v as any).products?.name || '', views: 0 };
      }
      productCounts[pid].views++;
    }
    const topList = Object.values(productCounts).sort((a, b) => b.views - a.views).slice(0, 10);

    // Total views count
    const { count: totalViews } = await supabase
      .from('product_views').select('*', { count: 'exact', head: true })
      .gte('viewed_at', startDate).lte('viewed_at', endDate);

    // Unique viewers
    const { data: uniqueData } = await supabase
      .from('product_views').select('user_id')
      .gte('viewed_at', startDate).lte('viewed_at', endDate).not('user_id', 'is', null);
    const uniqueViewers = new Set((uniqueData || []).map((v: any) => v.user_id)).size;

    return { totalViews: totalViews || 0, uniqueViewers, topProducts: topList };
  }

  // Controller aliases
  async getAll(query?: any) {
    const page = parseInt(query?.page) || 1;
    const limit = parseInt(query?.limit) || 20;
    const offset = (page - 1) * limit;
    const search = (query?.search || '').trim();

    let qb = supabase
      .from('product_views')
      .select('*, users:user_id(id, name, email, phone), products:product_id(id, name, slug, thumbnail, selling_price)', { count: 'exact' });

    if (search) {
      const { data: matchUsers } = await supabase.from('users').select('id')
        .or(`name.ilike.%${search}%,email.ilike.%${search}%`);
      const { data: matchProducts } = await supabase.from('products').select('id')
        .ilike('name', `%${search}%`);
      const userIds = (matchUsers || []).map((u: any) => u.id);
      const productIds = (matchProducts || []).map((p: any) => p.id);
      if (userIds.length === 0 && productIds.length === 0) {
        return { items: [], totalItems: 0, totalPages: 0, currentPage: page };
      }
      const filters: string[] = [];
      if (userIds.length > 0) filters.push(`user_id.in.(${userIds.join(',')})`);
      if (productIds.length > 0) filters.push(`product_id.in.(${productIds.join(',')})`);
      qb = qb.or(filters.join(','));
    }

    qb = qb.order('viewed_at', { ascending: false }).range(offset, offset + limit - 1);
    const { data, error, count } = await qb;
    if (error) throw error;

    const items = (data || []).map((row: any) => {
      const t = transformRow(row);
      return {
        _id: t._id,
        viewedAt: t.viewedAt,
        duration: t.duration,
        user: t.users ? { _id: t.users._id, name: t.users.name, email: t.users.email, phone: t.users.phone } : null,
        product: t.products ? { _id: t.products._id, name: t.products.name, slug: t.products.slug, thumbnail: t.products.thumbnail, price: t.products.sellingPrice } : null,
      };
    }).filter((item: any) => item.user && item.product);

    return { items, totalItems: count || 0, totalPages: Math.ceil((count || 0) / limit), currentPage: page };
  }

  async getUserViewSummary(queryOrUserId?: any) {
    if (typeof queryOrUserId === 'string') return this.getViewAnalytics({ userId: queryOrUserId });
    const page = parseInt(queryOrUserId?.page) || 1;
    const limit = parseInt(queryOrUserId?.limit) || 20;
    const search = (queryOrUserId?.search || '').trim();

    const { data, error } = await supabase
      .from('product_views')
      .select('user_id, product_id, viewed_at, users:user_id(id, name, email, phone)');
    if (error) throw error;

    const userMap: Record<string, any> = {};
    for (const v of data || []) {
      const uid = v.user_id;
      const user = (v as any).users;
      if (!userMap[uid]) {
        userMap[uid] = { userId: uid, user: user ? transformRow(user) : null, totalViews: 0, productIds: new Set<string>(), lastViewedAt: v.viewed_at };
      }
      userMap[uid].totalViews++;
      userMap[uid].productIds.add(v.product_id);
      if (new Date(v.viewed_at) > new Date(userMap[uid].lastViewedAt)) userMap[uid].lastViewedAt = v.viewed_at;
    }

    let items = Object.values(userMap).map((u: any) => ({
      userId: u.userId,
      totalViews: u.totalViews,
      uniqueProducts: u.productIds.size,
      lastViewedAt: u.lastViewedAt,
      user: u.user ? { name: u.user.name, email: u.user.email, phone: u.user.phone } : null,
    }));

    if (search) {
      const s = search.toLowerCase();
      items = items.filter((u: any) => u.user?.name?.toLowerCase().includes(s) || u.user?.email?.toLowerCase().includes(s));
    }

    items.sort((a: any, b: any) => new Date(b.lastViewedAt).getTime() - new Date(a.lastViewedAt).getTime());

    const totalItems = items.length;
    const totalPages = Math.ceil(totalItems / limit);
    const paginatedItems = items.slice((page - 1) * limit, page * limit);

    return { items: paginatedItems, totalItems, totalPages, currentPage: page };
  }

  async getUserViews(userId: string, query?: any) {
    const page = parseInt(query?.page) || 1;
    const limit = parseInt(query?.limit) || 20;
    const offset = (page - 1) * limit;
    const { data, error, count } = await supabase
      .from('product_views')
      .select('*, products:product_id(id, name, slug, thumbnail, selling_price)', { count: 'exact' })
      .eq('user_id', userId)
      .order('viewed_at', { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw error;

    const items = (data || []).map((row: any) => {
      const t = transformRow(row);
      return {
        _id: t._id,
        viewedAt: t.viewedAt,
        duration: t.duration,
        product: t.products ? { _id: t.products._id, name: t.products.name, slug: t.products.slug, thumbnail: t.products.thumbnail, price: t.products.sellingPrice } : null,
      };
    });

    return { items, totalItems: count || 0, totalPages: Math.ceil((count || 0) / limit), currentPage: page };
  }
}

export default new ProductViewService();
