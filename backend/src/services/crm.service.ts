import supabase from '../config/supabase';
import { transformRow, transformUser } from '../utils/transform.util';
import { NotFoundError } from '../errors/app-error';
import logger from '../utils/logger.util';

/** Compute CRM segment label based on total spend */
function computeSegment(totalSpent: number, totalOrders: number): string {
  if (totalSpent >= 50000) return 'vip';
  if (totalSpent >= 20000) return 'loyal';
  if (totalOrders > 0) return 'regular';
  return 'new';
}

class CrmService {
  async getCustomers(query: any = {}) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const search = query.search || null;
    const segment = query.segment || null;
    const offset = (page - 1) * limit;

    // Step 1: Fetch all non-admin users with order aggregate
    // We fetch all first so we can compute segment and filter
    let qb = supabase.from('users').select('id, name, email, phone, created_at', { count: 'exact' }).eq('role', 'user');
    if (search) qb = qb.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
    qb = qb.order('created_at', { ascending: false });

    const { data: users, error: usersError, count: usersCount } = await qb;
    if (usersError) throw usersError;

    const allUsers = users || [];

    // Step 2: Fetch order stats for all fetched users in one query
    const userIds = allUsers.map((u: any) => u.id);
    let orderStats: Record<string, { totalOrders: number; totalSpent: number; lastOrderDate: string | null }> = {};

    if (userIds.length > 0) {
      const { data: orders } = await supabase
        .from('orders')
        .select('user_id, total, status, created_at')
        .in('user_id', userIds);

      for (const o of orders || []) {
        if (!orderStats[o.user_id]) orderStats[o.user_id] = { totalOrders: 0, totalSpent: 0, lastOrderDate: null };
        orderStats[o.user_id].totalOrders++;
        if (o.status !== 'cancelled') orderStats[o.user_id].totalSpent += (o.total || 0);
        if (!orderStats[o.user_id].lastOrderDate || o.created_at > orderStats[o.user_id].lastOrderDate!) {
          orderStats[o.user_id].lastOrderDate = o.created_at;
        }
      }
    }

    // Step 3: Build customer list with segment, apply segment filter, paginate
    let customers = allUsers.map((u: any) => {
      const stats = orderStats[u.id] || { totalOrders: 0, totalSpent: 0, lastOrderDate: null };
      const seg = computeSegment(stats.totalSpent, stats.totalOrders);
      return {
        _id: u.id,
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        createdAt: u.created_at,
        totalOrders: stats.totalOrders,
        totalSpent: stats.totalSpent,
        lastOrderDate: stats.lastOrderDate,
        segment: seg,
        notesCount: 0,
      };
    });

    // Apply segment filter in-memory (since it depends on computed field)
    if (segment && segment !== 'all') {
      customers = customers.filter((c: any) => c.segment === segment);
    }

    const total = customers.length;
    const paginated = customers.slice(offset, offset + limit);

    return {
      customers: paginated,
      total,
      totalPages: Math.ceil(total / limit),
      page,
    };
  }

  async getCustomerDetails(customerId: string) {
    const { data: user } = await supabase.from('users').select('*').eq('id', customerId).maybeSingle();
    if (!user) throw new NotFoundError('Customer');

    const [ordersRes, notesRes, walletRes] = await Promise.all([
      supabase.from('orders').select('*', { count: 'exact' }).eq('user_id', customerId).order('created_at', { ascending: false }).limit(10),
      supabase.from('crm_notes').select('*').eq('customer_id', customerId).order('created_at', { ascending: false }),
      supabase.from('wallets').select('balance').eq('user_id', customerId).maybeSingle(),
    ]);

    const totalSpent = ordersRes.data?.reduce((sum: number, o: any) => sum + (o.total || 0), 0) || 0;

    return {
      customer: transformUser(user),
      orders: { data: (ordersRes.data || []).map(transformRow), total: ordersRes.count || 0 },
      notes: (notesRes.data || []).map(transformRow),
      totalSpent,
      walletBalance: walletRes.data?.balance || 0,
    };
  }

  async addNote(customerId: string, adminId: string, noteData: any) {
    const { data: user } = await supabase.from('users').select('id').eq('id', customerId).maybeSingle();
    if (!user) throw new NotFoundError('Customer');

    const { data: note, error } = await supabase
      .from('crm_notes').insert({ customer_id: customerId, author_id: adminId, content: noteData.note, type: noteData.type || 'note' })
      .select('*').single();
    if (error) throw error;
    return transformRow(note);
  }

  async updateNote(noteId: string, updates: any) {
    const dbUpdates: any = {};
    if (updates.note) dbUpdates.content = updates.note;
    if (updates.type) dbUpdates.type = updates.type;

    const { data: note, error } = await supabase
      .from('crm_notes').update(dbUpdates).eq('id', noteId).select('*').single();
    if (error) throw error;
    if (!note) throw new NotFoundError('Note');
    return transformRow(note);
  }

  async deleteNote(noteId: string) {
    const { error } = await supabase.from('crm_notes').delete().eq('id', noteId);
    if (error) throw error;
  }

  async getSegmentSummary() {
    // Compute segment summary directly without RPC
    const { data: users } = await supabase.from('users').select('id').eq('role', 'user');
    if (!users || users.length === 0) return [];

    const userIds = users.map((u: any) => u.id);
    const { data: orders } = await supabase
      .from('orders')
      .select('user_id, total, status')
      .in('user_id', userIds);

    // Aggregate per user
    const userStats: Record<string, { totalSpent: number; totalOrders: number }> = {};
    for (const o of orders || []) {
      if (!userStats[o.user_id]) userStats[o.user_id] = { totalSpent: 0, totalOrders: 0 };
      userStats[o.user_id].totalOrders++;
      if (o.status !== 'cancelled') userStats[o.user_id].totalSpent += (o.total || 0);
    }

    // Group by segment
    const segmentMap: Record<string, { count: number; totalRevenue: number }> = {
      vip: { count: 0, totalRevenue: 0 },
      loyal: { count: 0, totalRevenue: 0 },
      regular: { count: 0, totalRevenue: 0 },
      new: { count: 0, totalRevenue: 0 },
    };

    for (const userId of userIds) {
      const stats = userStats[userId] || { totalSpent: 0, totalOrders: 0 };
      const seg = computeSegment(stats.totalSpent, stats.totalOrders);
      segmentMap[seg].count++;
      segmentMap[seg].totalRevenue += stats.totalSpent;
    }

    return Object.entries(segmentMap).map(([segment, data]) => ({
      segment,
      count: data.count,
      totalRevenue: Math.round(data.totalRevenue),
    }));
  }

  // Controller aliases
  async getCustomerProfile(customerId: string) { return this.getCustomerDetails(customerId); }
}

export default new CrmService();
