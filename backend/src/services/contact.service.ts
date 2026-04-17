import supabase from '../config/supabase';
import { transformRow, toDbRow } from '../utils/transform.util';
import { NotFoundError } from '../errors/app-error';

class ContactService {
  async getMessages(query: any = {}) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const offset = (page - 1) * limit;

    let qb = supabase.from('contact_messages').select('*', { count: 'exact' });
    if (query.status) qb = qb.eq('status', query.status);
    if (query.search) qb = qb.or(`name.ilike.%${query.search}%,email.ilike.%${query.search}%,subject.ilike.%${query.search}%`);
    qb = qb.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    const { data, error, count } = await qb;
    if (error) throw error;
    return {
      messages: (data || []).map(transformRow),
      pagination: { total: count || 0, page, limit, pages: Math.ceil((count || 0) / limit) },
    };
  }

  async getMessageById(id: string) {
    const { data, error } = await supabase.from('contact_messages').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    if (!data) throw new NotFoundError('Contact message');
    return transformRow(data);
  }

  async createMessage(msgData: any) {
    const { data, error } = await supabase.from('contact_messages').insert(toDbRow(msgData)).select('*').single();
    if (error) throw error;
    return transformRow(data);
  }

  async updateMessageStatus(id: string, status: string, adminNotes?: string) {
    const updates: any = { status };
    if (adminNotes !== undefined) updates.admin_notes = adminNotes;
    const { data, error } = await supabase.from('contact_messages').update(updates).eq('id', id).select('*').single();
    if (error) throw error;
    if (!data) throw new NotFoundError('Contact message');
    return transformRow(data);
  }

  async deleteMessage(id: string) {
    const { error } = await supabase.from('contact_messages').delete().eq('id', id);
    if (error) throw error;
  }

  // Controller aliases
  async create(data: any) { return this.createMessage(data); }
  async getAll(query?: any) { return this.getMessages(query); }
  async markRead(id: string) { return this.updateMessageStatus(id, 'read'); }
  async delete(id: string) { return this.deleteMessage(id); }
  async getUnreadCount() {
    const { count } = await supabase.from('contact_messages').select('*', { count: 'exact', head: true }).eq('status', 'new');
    return count || 0;
  }
}

export default new ContactService();
