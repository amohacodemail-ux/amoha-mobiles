import supabase from '../config/supabase';
import { transformRow, toDbRow } from '../utils/transform.util';
import { NotFoundError } from '../errors/app-error';

class NotificationService {
  async getNotifications(userId: string, query: any = {}) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const offset = (page - 1) * limit;

    let qb = supabase.from('notifications').select('*', { count: 'exact' }).eq('user_id', userId);
    if (query.isRead !== undefined) qb = qb.eq('is_read', query.isRead === 'true');
    if (query.type) qb = qb.eq('type', query.type);
    qb = qb.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    const { data, error, count } = await qb;
    if (error) throw error;

    // Get unread count
    const { count: unreadCount } = await supabase
      .from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('is_read', false);

    return {
      notifications: (data || []).map(transformRow),
      pagination: { total: count || 0, page, limit, pages: Math.ceil((count || 0) / limit) },
      unreadCount: unreadCount || 0,
    };
  }

  async createNotification(notifData: any) {
    const { data, error } = await supabase.from('notifications').insert(toDbRow(notifData)).select('*').single();
    if (error) throw error;
    return transformRow(data);
  }

  async createBulkNotifications(notifications: any[]) {
    const rows = notifications.map(toDbRow);
    const { data, error } = await supabase.from('notifications').insert(rows).select('*');
    if (error) throw error;
    return (data || []).map(transformRow);
  }

  async markAsRead(notificationId: string, userId: string) {
    const { data, error } = await supabase
      .from('notifications').update({ is_read: true }).eq('id', notificationId).eq('user_id', userId).select('*').single();
    if (error) throw error;
    if (!data) throw new NotFoundError('Notification');
    return transformRow(data);
  }

  async markAllAsRead(userId: string) {
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false);
  }

  async deleteNotification(notificationId: string, userId: string) {
    await supabase.from('notifications').delete().eq('id', notificationId).eq('user_id', userId);
  }

  async deleteAllRead(userId: string) {
    await supabase.from('notifications').delete().eq('user_id', userId).eq('is_read', true);
  }

  // Controller aliases (admin-wide, no userId)
  async getAll(page: number = 1, limit: number = 20, type?: string) {
    const offset = (page - 1) * limit;
    let qb = supabase.from('notifications').select('*', { count: 'exact' });
    if (type) qb = qb.eq('type', type);
    qb = qb.order('created_at', { ascending: false }).range(offset, offset + limit - 1);
    const { data, error, count } = await qb;
    if (error) throw error;
    const { count: unreadCount } = await supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('is_read', false);
    return { notifications: (data || []).map(transformRow), pagination: { total: count || 0, page, limit, pages: Math.ceil((count || 0) / limit) }, unreadCount: unreadCount || 0 };
  }
  async getRecent(limit: number = 10) {
    const { data } = await supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(limit);
    return (data || []).map(transformRow);
  }
  async getUnreadCount() {
    const { count } = await supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('is_read', false);
    return count || 0;
  }
  async markRead(notificationId: string) {
    const { data, error } = await supabase.from('notifications').update({ is_read: true }).eq('id', notificationId).select('*').single();
    if (error) throw error;
    return transformRow(data);
  }
  async markAllRead() { await supabase.from('notifications').update({ is_read: true }).eq('is_read', false); }
  async delete(notificationId: string) { await supabase.from('notifications').delete().eq('id', notificationId); }
  async clearAll() { await supabase.from('notifications').delete().eq('is_read', true); }
  async create(notifData: any) { return this.createNotification(notifData); }
}

export default new NotificationService();
