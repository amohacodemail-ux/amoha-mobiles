import supabase from '../config/supabase';
import { transformRow, toDbRow } from '../utils/transform.util';
import { NotFoundError } from '../errors/app-error';

class ServiceRequestService {
  async getServiceRequests(query: any = {}) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const offset = (page - 1) * limit;

    let qb = supabase.from('service_requests').select('*, users!user_id(id, name, email, phone), assigned_user:users!assigned_to(id, name, email, phone)', { count: 'exact' });
    if (query.userId) qb = qb.eq('user_id', query.userId);
    if (query.assignedTo) qb = qb.eq('assigned_to', query.assignedTo);
    if (query.status) qb = qb.eq('status', query.status);
    if (query.type) qb = qb.eq('service_type', query.type);
    if (query.search) qb = qb.or(`request_number.ilike.%${query.search}%,description.ilike.%${query.search}%`);
    qb = qb.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    const { data, error, count } = await qb;
    if (error) throw error;
    return {
      requests: (data || []).map((row: any) => {
        const t = transformRow(row);
        if (row.users) {
          t.user = transformRow(row.users);
          delete t.users;
        }
        if (row.assigned_user) {
          t.assignedUser = transformRow(row.assigned_user);
          delete t.assigned_user;
        }
        return t;
      }),
      totalRequests: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
      currentPage: page,
    };
  }

  async getServiceRequestById(id: string) {
    const { data, error } = await supabase.from('service_requests').select('*, users!user_id(id, name, email, phone), assigned_user:users!assigned_to(id, name, email, phone)').eq('id', id).maybeSingle();
    if (error) throw error;
    if (!data) throw new NotFoundError('Service request');
    const t = transformRow(data);
    if (data.users) { t.user = transformRow(data.users); }
    if (data.assigned_user) { t.assignedUser = transformRow(data.assigned_user); }
    return t;
  }

  async createServiceRequest(reqData: any) {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    const datePrefix = `SR-${dd}${mm}${yyyy}-`;

    const { data: latestReq } = await supabase
      .from('service_requests')
      .select('request_number')
      .ilike('request_number', `${datePrefix}%`)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    let nextNumber = 1;
    if (latestReq && latestReq.request_number) {
      const parts = latestReq.request_number.split('-');
      if (parts.length === 3) {
        nextNumber = parseInt(parts[2], 10) + 1;
      }
    }
    const ticketNumber = `${datePrefix}${String(nextNumber).padStart(3, '0')}`;
    const dbRow: any = { ...toDbRow(reqData), request_number: ticketNumber, status: reqData.status || 'new_request' };
    // Remove user_id if null/undefined to avoid FK violation on anonymous requests
    if (!dbRow.user_id) delete dbRow.user_id;
    const { data, error } = await supabase
      .from('service_requests').insert(dbRow).select('*').single();
    if (error) {
      const logger = (await import('../utils/logger.util')).default;
      logger.error('[service-request] create error:', error);
      throw error;
    }
    return transformRow(data);
  }

  async updateServiceRequest(id: string, updates: any) {
    const { data, error } = await supabase.from('service_requests').update(toDbRow(updates)).eq('id', id).select('*').single();
    if (error) throw error;
    if (!data) throw new NotFoundError('Service request');
    return transformRow(data);
  }

  async deleteServiceRequest(id: string) {
    // Delete linked service request items first
    await supabase.from('service_request_items').delete().eq('service_request_id', id);
    // Then delete the service request
    const { error } = await supabase.from('service_requests').delete().eq('id', id);
    if (error) throw error;
  }

  // Controller aliases
  async create(data: any) { return this.createServiceRequest(data); }
  async getByUser(userId: string, query?: any) { return this.getServiceRequests({ ...query, userId }); }
  async getAll(query?: any) { return this.getServiceRequests(query); }
  async getById(id: string) { return this.getServiceRequestById(id); }
  async updateStatus(id: string, statusOrUpdates: any, adminNotes?: string, finalPrice?: number) {
    if (typeof statusOrUpdates === 'string') {
      return this.updateServiceRequest(id, { status: statusOrUpdates, admin_notes: adminNotes, final_price: finalPrice });
    }
    return this.updateServiceRequest(id, statusOrUpdates);
  }
  async updateBilling(id: string, billingUpdates: any) {
    return this.updateServiceRequest(id, billingUpdates);
  }
  async delete(id: string) { return this.deleteServiceRequest(id); }
  async getStats(assignedTo?: string) {
    let baseQuery = supabase.from('service_requests').select('*', { count: 'exact', head: true });
    if (assignedTo) baseQuery = (baseQuery as any).eq('assigned_to', assignedTo);

    const { count: total } = await baseQuery;

    let pendingQuery = supabase.from('service_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending');
    if (assignedTo) pendingQuery = (pendingQuery as any).eq('assigned_to', assignedTo);
    const { count: pending } = await pendingQuery;

    let inProgressQuery = supabase.from('service_requests').select('*', { count: 'exact', head: true }).eq('status', 'in_progress');
    if (assignedTo) inProgressQuery = (inProgressQuery as any).eq('assigned_to', assignedTo);
    const { count: inProgress } = await inProgressQuery;

    let completedQuery = supabase.from('service_requests').select('*', { count: 'exact', head: true }).eq('status', 'completed');
    if (assignedTo) completedQuery = (completedQuery as any).eq('assigned_to', assignedTo);
    const { count: completed } = await completedQuery;

    return { total: total || 0, pending: pending || 0, inProgress: inProgress || 0, completed: completed || 0 };
  }
}

export default new ServiceRequestService();
