import supabase from '../config/supabase';
import { transformRow, toDbRow } from '../utils/transform.util';
import { NotFoundError, BadRequestError } from '../errors/app-error';
import logger from '../utils/logger.util';

class CustomerManagementService {
  // ==================== Customer Profiles & Analytics ====================

  async getCustomers(query: any = {}) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const offset = (page - 1) * limit;

    let qb = supabase.from('users').select(`
      id, name, email, phone, avatar, role, is_verified, is_blocked, created_at,
      customer_segments!customer_segments_user_id_fkey(segment)
    `, { count: 'exact' }).eq('role', 'user');

    if (query.search) {
      qb = qb.or(`name.ilike.%${query.search}%,email.ilike.%${query.search}%,phone.ilike.%${query.search}%`);
    }
    if (query.segment) {
      // Filter by segment via inner join
      qb = qb.eq('customer_segments.segment', query.segment);
    }
    if (query.isBlocked !== undefined) {
      qb = qb.eq('is_blocked', query.isBlocked === 'true');
    }

    const camelToSnake = (s: string) => s.replace(/[A-Z]/g, (l) => `_${l.toLowerCase()}`);
    const sortField = camelToSnake(query.sortBy || 'created_at');
    const sortAsc = query.sortOrder === 'asc';
    qb = qb.order(sortField, { ascending: sortAsc }).range(offset, offset + limit - 1);

    const { data, error, count } = await qb;
    if (error) throw error;

    // Enrich with order stats
    const customers = await Promise.all((data || []).map(async (user: any) => {
      const t = transformRow(user);
      t.segment = user.customer_segments?.[0]?.segment || 'regular';

      // Fetch order stats
      const { data: orders } = await supabase
        .from('orders')
        .select('total, status, created_at')
        .eq('user_id', user.id);

      const orderList = orders || [];
      t.totalOrders = orderList.length;
      t.totalSpent = orderList.reduce((sum: number, o: any) => sum + parseFloat(o.total || '0'), 0);
      t.lastOrderAt = orderList.length > 0 ? orderList.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at : null;

      // Fraud flag count
      const { count: flagCount } = await supabase
        .from('fraud_flags')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_resolved', false);
      t.fraudFlagCount = flagCount || 0;

      delete t.customerSegments;
      delete t.password;
      delete t.refreshToken;
      return t;
    }));

    return {
      customers,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
      currentPage: page,
    };
  }

  async getCustomerDetail(userId: string) {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, phone, avatar, role, is_verified, is_blocked, created_at')
      .eq('id', userId)
      .maybeSingle();
    if (error) throw error;
    if (!user) throw new NotFoundError('Customer');

    const customer = transformRow(user);

    // Segment
    const { data: segData } = await supabase.from('customer_segments').select('segment').eq('user_id', userId).maybeSingle();
    customer.segment = segData?.segment || 'regular';

    // Tags
    const { data: tags } = await supabase.from('customer_tags').select('*').eq('user_id', userId);
    customer.tags = (tags || []).map(transformRow);

    // Notes
    const { data: notes } = await supabase
      .from('customer_notes')
      .select('*, admin:admin_id(id, name)')
      .eq('user_id', userId)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false });
    customer.notes = (notes || []).map(transformRow);

    // Fraud flags
    const { data: flags } = await supabase
      .from('fraud_flags')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    customer.fraudFlags = (flags || []).map(transformRow);

    // Order history
    const { data: orders } = await supabase
      .from('orders')
      .select('id, order_number, total, status, payment_status, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);
    customer.orders = (orders || []).map(transformRow);

    // Addresses
    const { data: addresses } = await supabase.from('addresses').select('*').eq('user_id', userId);
    customer.addresses = (addresses || []).map(transformRow);

    // Aggregate stats
    const orderList = customer.orders || [];
    customer.totalOrders = orderList.length;
    customer.totalSpent = orderList.reduce((sum: number, o: any) => sum + parseFloat(o.total || '0'), 0);
    customer.avgOrderValue = customer.totalOrders > 0 ? Math.round(customer.totalSpent / customer.totalOrders) : 0;
    customer.cancelledOrders = orderList.filter((o: any) => o.status === 'cancelled').length;
    customer.returnedOrders = orderList.filter((o: any) => o.status === 'returned').length;
    customer.lastOrderAt = orderList.length > 0 ? orderList[0].createdAt : null;

    return customer;
  }

  // ==================== Segmentation ====================

  async updateSegment(userId: string, segment: string, assignedBy: string) {
    const { data: existing } = await supabase
      .from('customer_segments')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from('customer_segments')
        .update({ segment, assigned_by: assignedBy, assigned_at: new Date().toISOString() })
        .eq('user_id', userId);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('customer_segments')
        .insert({ user_id: userId, segment, assigned_by: assignedBy });
      if (error) throw error;
    }
    return { userId, segment };
  }

  async autoSegmentCustomers() {
    // Auto-segment based on rules
    const { data: users } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'user');

    let updated = 0;
    for (const user of (users || [])) {
      const { data: orders } = await supabase
        .from('orders')
        .select('total, created_at')
        .eq('user_id', user.id)
        .neq('status', 'cancelled');

      const orderList = orders || [];
      const totalSpent = orderList.reduce((sum: number, o: any) => sum + parseFloat(o.total || '0'), 0);
      const orderCount = orderList.length;
      const lastOrder = orderList.length > 0
        ? new Date(orderList.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at)
        : null;

      let segment = 'regular';
      const daysSinceLastOrder = lastOrder ? Math.floor((Date.now() - lastOrder.getTime()) / (1000 * 60 * 60 * 24)) : 999;

      if (totalSpent >= 50000 || orderCount >= 10) {
        segment = 'vip';
      } else if (orderCount >= 5) {
        segment = 'frequent';
      } else if (daysSinceLastOrder > 90 && orderCount > 0) {
        segment = 'inactive';
      } else if (orderCount === 0) {
        segment = 'new';
      }

      // Upsert
      const { data: existing } = await supabase.from('customer_segments').select('id, segment').eq('user_id', user.id).maybeSingle();
      if (existing) {
        if (existing.segment !== segment) {
          await supabase.from('customer_segments').update({ segment, assigned_at: new Date().toISOString() }).eq('user_id', user.id);
          updated++;
        }
      } else {
        await supabase.from('customer_segments').insert({ user_id: user.id, segment });
        updated++;
      }
    }

    return { totalProcessed: (users || []).length, updated };
  }

  // ==================== Tags ====================

  async addTag(userId: string, tag: string, createdBy: string) {
    const { data, error } = await supabase
      .from('customer_tags')
      .insert({ user_id: userId, tag, created_by: createdBy })
      .select('*')
      .single();
    if (error) {
      if (error.code === '23505') throw new BadRequestError('Tag already exists for this customer');
      throw error;
    }
    return transformRow(data);
  }

  async removeTag(userId: string, tagId: string) {
    const { error } = await supabase.from('customer_tags').delete().eq('id', tagId).eq('user_id', userId);
    if (error) throw error;
  }

  // ==================== Notes ====================

  async addNote(userId: string, adminId: string, noteData: any) {
    const dbData = toDbRow({
      userId,
      adminId,
      note: noteData.note,
      type: noteData.type || 'note',
      isPinned: noteData.isPinned || false,
    });
    const { data, error } = await supabase.from('customer_notes').insert(dbData).select('*').single();
    if (error) throw error;
    return transformRow(data);
  }

  async updateNote(noteId: string, updates: any) {
    const dbUpdates = toDbRow(updates);
    dbUpdates.updated_at = new Date().toISOString();
    const { data, error } = await supabase.from('customer_notes').update(dbUpdates).eq('id', noteId).select('*').single();
    if (error) throw error;
    return transformRow(data);
  }

  async deleteNote(noteId: string) {
    const { error } = await supabase.from('customer_notes').delete().eq('id', noteId);
    if (error) throw error;
  }

  // ==================== Fraud Detection ====================

  async getFraudFlags(query: any = {}) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const offset = (page - 1) * limit;

    let qb = supabase
      .from('fraud_flags')
      .select('*, user:user_id(id, name, email)', { count: 'exact' });

    if (query.isResolved !== undefined) qb = qb.eq('is_resolved', query.isResolved === 'true');
    if (query.severity) qb = qb.eq('severity', query.severity);
    if (query.flagType) qb = qb.eq('flag_type', query.flagType);

    qb = qb.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    const { data, error, count } = await qb;
    if (error) throw error;

    return {
      flags: (data || []).map(transformRow),
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
      currentPage: page,
    };
  }

  async createFraudFlag(data: any) {
    const dbData = toDbRow(data);
    const { data: flag, error } = await supabase.from('fraud_flags').insert(dbData).select('*').single();
    if (error) throw error;
    return transformRow(flag);
  }

  async resolveFraudFlag(flagId: string, resolvedBy: string, resolutionNote: string) {
    const { data, error } = await supabase.from('fraud_flags').update({
      is_resolved: true,
      resolved_by: resolvedBy,
      resolved_at: new Date().toISOString(),
      resolution_note: resolutionNote,
    }).eq('id', flagId).select('*').single();
    if (error) throw error;
    return transformRow(data);
  }

  async runFraudDetection() {
    // Rules-based fraud detection
    const flagsCreated: any[] = [];

    // Rule 1: Users with high return rate
    const { data: users } = await supabase.from('users').select('id').eq('role', 'user');
    for (const user of (users || [])) {
      const { data: orders } = await supabase
        .from('orders')
        .select('status')
        .eq('user_id', user.id);

      const totalOrders = (orders || []).length;
      const returnedOrders = (orders || []).filter((o: any) => o.status === 'returned').length;

      if (totalOrders >= 3 && returnedOrders / totalOrders > 0.5) {
        // Check if flag already exists
        const { data: existing } = await supabase
          .from('fraud_flags')
          .select('id')
          .eq('user_id', user.id)
          .eq('flag_type', 'excessive_returns')
          .eq('is_resolved', false)
          .maybeSingle();

        if (!existing) {
          const flag = await this.createFraudFlag({
            userId: user.id,
            flagType: 'excessive_returns',
            severity: returnedOrders / totalOrders > 0.7 ? 'high' : 'medium',
            description: `Return rate: ${Math.round((returnedOrders / totalOrders) * 100)}% (${returnedOrders}/${totalOrders} orders)`,
            autoDetected: true,
          });
          flagsCreated.push(flag);
        }
      }

      // Rule 2: Multiple cancelled orders recently
      const { data: recentOrders } = await supabase
        .from('orders')
        .select('status, created_at')
        .eq('user_id', user.id)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      const recentCancelled = (recentOrders || []).filter((o: any) => o.status === 'cancelled').length;
      if (recentCancelled >= 5) {
        const { data: existing } = await supabase
          .from('fraud_flags')
          .select('id')
          .eq('user_id', user.id)
          .eq('flag_type', 'suspicious_activity')
          .eq('is_resolved', false)
          .maybeSingle();

        if (!existing) {
          const flag = await this.createFraudFlag({
            userId: user.id,
            flagType: 'suspicious_activity',
            severity: recentCancelled >= 8 ? 'critical' : 'high',
            description: `${recentCancelled} cancelled orders in the last 30 days`,
            autoDetected: true,
          });
          flagsCreated.push(flag);
        }
      }
    }

    return { flagsCreated: flagsCreated.length, flags: flagsCreated };
  }

  // ==================== Dashboard Stats ====================

  async getDashboardStats() {
    const { count: totalCustomers } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'user');
    const { count: newThisMonth } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'user')
      .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());

    // Segment counts
    const { data: segments } = await supabase.from('customer_segments').select('segment');
    const segmentCounts: Record<string, number> = { vip: 0, frequent: 0, regular: 0, inactive: 0, new: 0 };
    for (const s of (segments || [])) {
      segmentCounts[s.segment] = (segmentCounts[s.segment] || 0) + 1;
    }

    // Active fraud flags
    const { count: activeFraudFlags } = await supabase
      .from('fraud_flags')
      .select('*', { count: 'exact', head: true })
      .eq('is_resolved', false);

    // Blocked users
    const { count: blockedUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'user')
      .eq('is_blocked', true);

    return {
      totalCustomers: totalCustomers || 0,
      newThisMonth: newThisMonth || 0,
      segmentCounts,
      activeFraudFlags: activeFraudFlags || 0,
      blockedUsers: blockedUsers || 0,
    };
  }

  async getBehaviorAnalytics(userId: string) {
    // Order frequency over time
    const { data: orders } = await supabase
      .from('orders')
      .select('total, status, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    const orderList = (orders || []).map(transformRow);

    // Group by month
    const monthlyData: Record<string, { orders: number; spent: number }> = {};
    for (const o of orderList) {
      const month = new Date(o.createdAt).toISOString().slice(0, 7);
      if (!monthlyData[month]) monthlyData[month] = { orders: 0, spent: 0 };
      monthlyData[month].orders++;
      monthlyData[month].spent += parseFloat(o.total || '0');
    }

    // Product views
    const { data: views } = await supabase
      .from('product_views')
      .select('product_id, viewed_at')
      .eq('user_id', userId)
      .order('viewed_at', { ascending: false })
      .limit(20);

    return {
      orderHistory: monthlyData,
      recentViews: (views || []).map(transformRow),
      totalOrders: orderList.length,
      totalSpent: orderList.reduce((sum: number, o: any) => sum + parseFloat(o.total || '0'), 0),
    };
  }
}

export default new CustomerManagementService();
