import supabase from '../config/supabase';
import { transformRow, toDbRow } from '../utils/transform.util';
import { NotFoundError, BadRequestError } from '../errors/app-error';

class CategoryService {
  async getCategories(query: any = {}) {
    // Include product count via embedded relation
    let qb = supabase.from('categories').select('*, products:products!category_id(count)', { count: 'exact' });
    if (query.search) qb = qb.ilike('name', `%${query.search}%`);
    if (query.isActive !== undefined) qb = qb.eq('is_active', query.isActive === 'true');
    if (query.parentId) qb = qb.eq('parent_id', query.parentId);
    if (query.topLevel === 'true') qb = qb.is('parent_id', null);
    // Exclude auto-generated QA/test categories from public listing
    if (!query.includeTest) {
      qb = qb.not('name', 'ilike', 'PW-Cat-%').not('slug', 'ilike', 'pw-cat-%');
    }
    qb = qb.order('sort_order', { ascending: true });

    if (query.page) {
      const page = parseInt(query.page) || 1;
      const limit = parseInt(query.limit) || 20;
      qb = qb.range((page - 1) * limit, page * limit - 1);
    }

    const { data, error, count } = await qb;
    if (error) throw error;
    const categories = (data || []).map((row: any) => {
      const transformed = transformRow(row);
      // Extract embedded product count
      transformed.productCount = Array.isArray(row.products) && row.products.length > 0
        ? (row.products[0].count ?? 0)
        : 0;
      delete transformed.products;
      return transformed;
    });
    return { categories, total: count || 0 };
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
    // Check for linked products before attempting delete
    const { count, error: countError } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('category_id', id);
    if (countError) throw countError;
    if ((count ?? 0) > 0) {
      throw new BadRequestError(
        `Cannot delete category: ${count} product${count === 1 ? ' is' : 's are'} linked to it. Reassign or delete those products first.`
      );
    }
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) throw error;
    return { message: 'Category deleted successfully' };
  }

  async getCategoryBySlug(slug: string) {
    // Support both UUID-based lookups and slug-based lookups
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const field = uuidRegex.test(slug) ? 'id' : 'slug';
    const { data, error } = await supabase.from('categories').select('*').eq(field, slug).maybeSingle();
    if (error) throw error;
    if (!data) throw new NotFoundError('Category');
    return transformRow(data);
  }

  // Controller aliases
  async getAll(query?: any) { return this.getCategories(query); }
  async getAllAdmin(query?: any) { return this.getCategories({ ...query, includeTest: true }); }
  async getBySlug(slug: string) { return this.getCategoryBySlug(slug); }
  async create(data: any) { return this.createCategory(data); }
  async update(id: string, data: any) { return this.updateCategory(id, data); }
  async delete(id: string) { return this.deleteCategory(id); }
}

export default new CategoryService();
