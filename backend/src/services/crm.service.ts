import supabase from '../config/supabase';
import { transformRow } from '../utils/transform.util';
import { NotFoundError, ConflictError, BadRequestError } from '../errors/app-error';
import logger from '../utils/logger.util';
import { hashPassword } from '../utils/password.util';
import crypto from 'crypto';

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

    // When segment filtering is active, we must compute segments from order data,
    // so cap the scan to a reasonable number of users (500) instead of unbounded.
    const fetchLimit = segment && segment !== 'all' ? 500 : limit;
    const offset = segment && segment !== 'all' ? 0 : (page - 1) * limit;

    let qb = supabase.from('users').select('id, name, email, phone, created_at', { count: 'exact' }).eq('role', 'user');
    if (search) qb = qb.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
    qb = qb.order('created_at', { ascending: false }).range(offset, offset + fetchLimit - 1);

    const { data: users, error: usersError, count: usersCount } = await qb;
    if (usersError) throw usersError;

    const allUsers = users || [];

    // Batch fetch order stats and note counts for all fetched users
    const userIds = allUsers.map((u: any) => u.id);
    const orderStats: Record<string, { totalOrders: number; totalSpent: number; lastOrderDate: string | null }> = {};
    const noteCounts: Record<string, number> = {};

    if (userIds.length > 0) {
      const [ordersResult, notesResult] = await Promise.all([
        supabase.from('orders').select('user_id, total, status, created_at').in('user_id', userIds),
        supabase.from('crm_notes').select('customer_id').in('customer_id', userIds),
      ]);

      for (const o of ordersResult.data || []) {
        if (!orderStats[o.user_id]) orderStats[o.user_id] = { totalOrders: 0, totalSpent: 0, lastOrderDate: null };
        orderStats[o.user_id].totalOrders++;
        if (o.status !== 'cancelled') orderStats[o.user_id].totalSpent += (o.total || 0);
        if (!orderStats[o.user_id].lastOrderDate || o.created_at > orderStats[o.user_id].lastOrderDate!) {
          orderStats[o.user_id].lastOrderDate = o.created_at;
        }
      }

      for (const n of notesResult.data || []) {
        noteCounts[n.customer_id] = (noteCounts[n.customer_id] || 0) + 1;
      }
    }

    // Build customer list with computed segment
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
        notesCount: noteCounts[u.id] || 0,
      };
    });

    // Apply segment filter if needed, then paginate
    if (segment && segment !== 'all') {
      customers = customers.filter((c: any) => c.segment === segment);
      const total = customers.length;
      const paginated = customers.slice((page - 1) * limit, (page - 1) * limit + limit);
      return { customers: paginated, total, totalPages: Math.ceil(total / limit), page };
    }

    return {
      customers,
      total: usersCount || allUsers.length,
      totalPages: Math.ceil((usersCount || allUsers.length) / limit),
      page,
    };
  }

  async getCustomerDetails(customerId: string) {
    const { data: user } = await supabase.from('users').select('*').eq('id', customerId).maybeSingle();
    if (!user) throw new NotFoundError('Customer');

    const [ordersRes, notesRes] = await Promise.all([
      supabase
        .from('orders')
        .select('id, order_number, total, status, created_at', { count: 'exact' })
        .eq('user_id', customerId)
        .order('created_at', { ascending: false })
        .limit(10),
      supabase
        .from('crm_notes')
        .select('id, type, content, created_at, author:author_id(id, name)')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false }),
    ]);

    const totalOrders = ordersRes.count || (ordersRes.data?.length ?? 0);
    const totalSpent = ordersRes.data?.reduce((sum: number, o: any) => sum + (o.total || 0), 0) || 0;
    const avgOrderValue = totalOrders > 0 ? Math.round(totalSpent / totalOrders) : 0;
    const segment = computeSegment(totalSpent, totalOrders);

    const recentOrders = (ordersRes.data || []).map((o: any) => ({
      _id: o.id,
      orderNumber: o.order_number || o.id,
      totalAmount: o.total || 0,
      status: o.status,
      createdAt: o.created_at,
    }));

    const notes = (notesRes.data || []).map((n: any) => ({
      _id: n.id,
      type: n.type || 'note',
      content: n.content || '',
      author: n.author ? { _id: n.author.id, name: n.author.name } : { _id: '', name: 'Admin' },
      createdAt: n.created_at,
    }));

    return {
      customer: {
        _id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone || null,
        createdAt: user.created_at,
        avatar: user.avatar || null,
      },
      stats: { totalOrders, totalSpent, avgOrderValue, segment },
      recentOrders,
      notes,
    };
  }

  async addNote(customerId: string, adminId: string, noteData: any) {
    const { data: user } = await supabase.from('users').select('id').eq('id', customerId).maybeSingle();
    if (!user) throw new NotFoundError('Customer');

    const content = noteData.content || noteData.note || '';
    const { data: note, error } = await supabase
      .from('crm_notes')
      .insert({ customer_id: customerId, author_id: adminId, content, type: noteData.type || 'note' })
      .select('id, type, content, created_at, author:author_id(id, name)')
      .single();
    if (error) throw error;
    return {
      _id: note.id,
      type: note.type || 'note',
      content: note.content || '',
      author: (note as any).author
        ? { _id: (note as any).author.id, name: (note as any).author.name }
        : { _id: adminId, name: 'Admin' },
      createdAt: note.created_at,
    };
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

  async createCustomer(data: {
    name: string;
    phone: string;
    email?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    notes?: string;
    tags?: string;
  }) {
    const name = (data.name || '').trim();
    const phone = (data.phone || '').trim();

    if (!name) throw new BadRequestError('Full name is required');
    if (!phone) throw new BadRequestError('Phone number is required');
    if (!/^\d{10}$/.test(phone)) throw new BadRequestError('Phone must be exactly 10 digits');

    if (data.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email.trim())) throw new BadRequestError('Invalid email format');
    }

    // Duplicate phone check
    const { data: existingPhone } = await supabase
      .from('users').select('id').eq('phone', phone).maybeSingle();
    if (existingPhone) throw new ConflictError('User with this phone number already exists');

    // Duplicate email check (only if email provided)
    if (data.email?.trim()) {
      const { data: existingEmail } = await supabase
        .from('users').select('id').eq('email', data.email.trim().toLowerCase()).maybeSingle();
      if (existingEmail) throw new ConflictError('User with this email already exists');
    }

    // Random temp password (user can reset via forgot-password)
    const tempPassword = await hashPassword(crypto.randomBytes(16).toString('hex'));

    const insertData: any = {
      name,
      phone,
      // Use phone-based placeholder when no email — empty string '' collides with existing users
      email: data.email?.trim() ? data.email.trim().toLowerCase() : `${phone}@noemail.local`,
      role: 'user',
      is_verified: true,
      password: tempPassword,
    };

    const { data: user, error } = await supabase
      .from('users').insert(insertData).select('id, name, email, phone, created_at').single();
    if (error) {
      if (error.code === '23505') throw new ConflictError('User with this phone or email already exists');
      logger.error('[CrmService] createCustomer error:', error);
      throw error;
    }

    // Add initial CRM note if provided
    if (data.notes?.trim()) {
      await supabase.from('crm_notes').insert({
        customer_id: user.id,
        author_id: user.id,
        content: data.notes.trim(),
        type: 'note',
      }).select('id').single();
    }

    return {
      _id: user.id,
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      createdAt: user.created_at,
      segment: 'new',
      totalOrders: 0,
      totalSpent: 0,
      notesCount: data.notes ? 1 : 0,
    };
  }

  // Controller aliases
  async getCustomerProfile(customerId: string) { return this.getCustomerDetails(customerId); }
}

export default new CrmService();
