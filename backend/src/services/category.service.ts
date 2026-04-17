import supabase from '../config/supabase';
import { transformRow, toDbRow } from '../utils/transform.util';
import { NotFoundError } from '../errors/app-error';

class CategoryService {
  async getCategories(query: any = {}) {
    let qb = supabase.from('categories').select('*', { count: 'exact' });
    if (query.search) qb = qb.ilike('name', `%${query.search}%`);
    if (query.isActive !== undefined) qb = qb.eq('is_active', query.isActive === 'true');
    if (query.parentId) qb = qb.eq('parent_id', query.parentId);
    if (query.topLevel === 'true') qb = qb.is('parent_id', null);
    qb = qb.order('sort_order', { ascending: true });

    if (query.page) {
      const page = parseInt(query.page) || 1;
      const limit = parseInt(query.limit) || 20;
      qb = qb.range((page - 1) * limit, page * limit - 1);
    }

    const { data, error, count } = await qb;
    if (error) throw error;
    return { categories: (data || []).map(transformRow), total: count || 0 };
  }

  async getCategoryById(id: string) {
    const { data, error } = await supabase.from('categories').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    if (!data) throw new NotFoundError('Category');
    return transformRow(data);
  }

  async createCategory(catData: any) {
    if (!catData.slug && catData.name) {
      catData.slug = catData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
    if (!catData.slug && catData.name) {
      catData.slug = catData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
    const { data, error } = await supabase.from('categories').insert(toDbRow(catData)).select('*').single();
    if (error) throw error;
    return transformRow(data);
  }

  async updateCategory(id: string, updates: any) {
    const { data, error } = await supabase.from('categories').update(toDbRow(updates)).eq('id', id).select('*').single();
    if (error) throw error;
    if (!data) throw new NotFoundError('Category');
    return transformRow(data);
  }

  async deleteCategory(id: string) {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) throw error;
  }

  // Controller aliases
  async getAll(query?: any) { return this.getCategories(query); }
  async getAllAdmin(query?: any) { return this.getCategories(query); }
  async getBySlug(slug: string) { return this.getCategoryById(slug); }
  async create(data: any) { return this.createCategory(data); }
  async update(id: string, data: any) { return this.updateCategory(id, data); }
  async delete(id: string) { return this.deleteCategory(id); }
}

export default new CategoryService();
