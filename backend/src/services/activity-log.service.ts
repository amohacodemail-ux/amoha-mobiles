import supabase from '../config/supabase';
import { transformRow, toDbRow } from '../utils/transform.util';
import logger from '../utils/logger.util';

class ActivityLogService {
  async log(logData: { userId?: string; adminId?: string; action: string; entity: string; entityId?: string; details?: any; ipAddress?: string }) {
    const insert: any = {
      action: logData.action,
      resource: logData.entity,
    };
    if (logData.userId) insert.user_id = logData.userId;
    else if (logData.adminId) insert.user_id = logData.adminId;
    if (logData.entityId) insert.resource_id = logData.entityId;
    if (logData.details) insert.details = typeof logData.details === 'string' ? logData.details : JSON.stringify(logData.details);
    if (logData.ipAddress) insert.ip_address = logData.ipAddress;

    const { error } = await supabase.from('activity_logs').insert(insert);
    if (error) logger.error('Failed to log activity:', error.message);
  }

  async getLogs(query: any = {}) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 50;
    const offset = (page - 1) * limit;

    let qb = supabase.from('activity_logs').select('*, users:user_id(id, name, email)', { count: 'exact' });
    if (query.userId) qb = qb.eq('user_id', query.userId);
    if (query.adminId) qb = qb.eq('user_id', query.adminId);
    if (query.action) qb = qb.eq('action', query.action);
    if (query.resource) qb = qb.eq('resource', query.resource);
    if (query.entity) qb = qb.eq('resource', query.entity);
    if (query.startDate) qb = qb.gte('created_at', query.startDate);
    if (query.endDate) qb = qb.lte('created_at', query.endDate);
    if (query.search) qb = qb.or(`action.ilike.%${query.search}%,resource.ilike.%${query.search}%,details.ilike.%${query.search}%`);
    qb = qb.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    const { data, error, count } = await qb;
    if (error) throw error;
    return {
      logs: (data || []).map((row: any) => {
        const t = transformRow(row);
        if (row.users) {
          t.user = transformRow(row.users);
          delete t.users;
        }
        return t;
      }),
      pagination: { total: count || 0, page, limit, pages: Math.ceil((count || 0) / limit) },
    };
  }

  async getLogsByEntity(entity: string, entityId: string) {
    const { data, error } = await supabase
      .from('activity_logs').select('*')
      .eq('resource', entity).eq('resource_id', entityId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(transformRow);
  }

  // Controller aliases
  async getAll(query: any = {}) { return this.getLogs(query); }
  async getByResource(entity: string, entityId: string) { return this.getLogsByEntity(entity, entityId); }
}

export default new ActivityLogService();

