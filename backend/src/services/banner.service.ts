import supabase from '../config/supabase';
import { transformRow, toDbRow } from '../utils/transform.util';
import { NotFoundError } from '../errors/app-error';

/** Maps DB sort_order → order for frontend/admin compatibility */
function normalizeBanner(row: any): any {
  const r = transformRow(row);
  if (r && 'sortOrder' in r) {
    r.order = r.sortOrder;
    delete r.sortOrder;
  }
  return r;
}

/** Maps order → sort_order before writing to DB */
function toBannerDbRow(data: any): any {
  const d = { ...data };
  if ('order' in d) {
    d.sortOrder = d.order;
    delete d.order;
  }
  return toDbRow(d);
}

class BannerService {
  async getBanners(query: any = {}) {
    let qb = supabase.from('banners').select('*', { count: 'exact' });
    if (query.isActive !== undefined) qb = qb.eq('is_active', query.isActive === 'true');
    if (query.position) qb = qb.eq('position', query.position);
    qb = qb.order('sort_order', { ascending: true });

    const { data, error, count } = await qb;
    if (error) throw error;
    return { banners: (data || []).map(normalizeBanner), total: count || 0 };
  }

  async getBannerById(id: string) {
    const { data, error } = await supabase.from('banners').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    if (!data) throw new NotFoundError('Banner');
    return normalizeBanner(data);
  }

  async createBanner(bannerData: any) {
    const { data, error } = await supabase.from('banners').insert(toBannerDbRow(bannerData)).select('*').single();
    if (error) throw error;
    return normalizeBanner(data);
  }

  async updateBanner(id: string, updates: any) {
    const { data, error } = await supabase.from('banners').update(toBannerDbRow(updates)).eq('id', id).select('*').single();
    if (error) throw error;
    if (!data) throw new NotFoundError('Banner');
    return normalizeBanner(data);
  }

  async deleteBanner(id: string) {
    const { error } = await supabase.from('banners').delete().eq('id', id);
    if (error) throw error;
  }

  // Controller aliases
  async getAll(query?: any) { return this.getBanners(query); }
  async getAllAdmin(query?: any) { return this.getBanners({ ...query }); }
  async create(data: any) { return this.createBanner(data); }
  async update(id: string, data: any) { return this.updateBanner(id, data); }
  async delete(id: string) { return this.deleteBanner(id); }
  async toggleActive(id: string, isActive: boolean) { return this.updateBanner(id, { isActive }); }
}

export default new BannerService();
