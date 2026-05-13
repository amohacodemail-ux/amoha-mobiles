import supabase from '../config/supabase';
import { transformRow, toDbRow } from '../utils/transform.util';
import { NotFoundError } from '../errors/app-error';

class ServiceRequestService {
  async getServiceRequests(query: any = {}) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const offset = (page - 1) * limit;

    let qb = supabase.from('service_requests').select('*', { count: 'exact' });
    if (query.userId) qb = qb.eq('user_id', query.userId);
    if (query.status) qb = qb.eq('status', query.status);
    if (query.type) qb = qb.eq('service_type', query.type);
    if (query.search) qb = qb.or(`request_number.ilike.%${query.search}%,description.ilike.%${query.search}%`);
    qb = qb.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    const { data, error, count } = await qb;
    if (error) throw error;
    return {
      requests: (data || []).map(transformRow),
      totalRequests: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
      currentPage: page,
    };
  }

  async getServiceRequestById(id: string) {
    const { data, error } = await supabase.from('service_requests').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    if (!data) throw new NotFoundError('Service request');
    return transformRow(data);
  }

  async createServiceRequest(reqData: any) {
    const ticketNumber = `SR-${Date.now().toString(36).toUpperCase()}`;
    const { data, error } = await supabase
      .from('service_requests').insert({ ...toDbRow(reqData), request_number: ticketNumber }).select('*').single();
    if (error) throw error;
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
  async delete(id: string) { return this.deleteServiceRequest(id); }
  async getStats() {
    const { count: total } = await supabase.from('service_requests').select('*', { count: 'exact', head: true });
    const { count: pending } = await supabase.from('service_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending');
    const { count: inProgress } = await supabase.from('service_requests').select('*', { count: 'exact', head: true }).eq('status', 'in_progress');
    const { count: completed } = await supabase.from('service_requests').select('*', { count: 'exact', head: true }).eq('status', 'completed');
    return { total: total || 0, pending: pending || 0, inProgress: inProgress || 0, completed: completed || 0 };
  }
}

export default new ServiceRequestService();
