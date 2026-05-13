import supabase from '../config/supabase';
import { transformRow, toDbRow } from '../utils/transform.util';
import { NotFoundError, BadRequestError } from '../errors/app-error';
import activityLog from './activity-log.service';
import logger from '../utils/logger.util';

class BrandService {
  async getBrands(query: any = {}) {
    let qb = supabase.from('brands').select('*', { count: 'exact' });
    if (query.search) qb = qb.ilike('name', `%${query.search}%`);
    if (query.isActive !== undefined) qb = qb.eq('is_active', query.isActive === 'true');
    qb = qb.order('name', { ascending: true });

    if (query.page) {
      const page = parseInt(query.page) || 1;
      const limit = parseInt(query.limit) || 20;
      qb = qb.range((page - 1) * limit, page * limit - 1);
    }

    const { data, error, count } = await qb;
    if (error) throw error;
    return { brands: (data || []).map(transformRow), total: count || 0 };
  }

  async getBrandById(id: string) {
    const { data, error } = await supabase.from('brands').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    if (!data) throw new NotFoundError('Brand');
    return transformRow(data);
  }

  async createBrand(brandData: any) {
    if (!brandData.slug && brandData.name) {
      brandData.slug = brandData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
    if (!brandData.slug && brandData.name) {
      brandData.slug = brandData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
    const { data, error } = await supabase.from('brands').insert(toDbRow(brandData)).select('*').single();
    if (error) throw error;
    return transformRow(data);
  }

  async updateBrand(id: string, updates: any) {
    const { data, error } = await supabase.from('brands').update(toDbRow(updates)).eq('id', id).select('*').single();
    if (error) throw error;
    if (!data) throw new NotFoundError('Brand');
    return transformRow(data);
  }

  async deleteBrand(id: string, adminId?: string, ipAddress?: string) {
    // Fetch brand details for audit log
    const { data: brand, error: fetchError } = await supabase
      .from('brands')
      .select('id, name')
      .eq('id', id)
      .maybeSingle();
    if (fetchError) throw fetchError;
    if (!brand) throw new NotFoundError('Brand');

    // Check for linked products before attempting delete
    const { count, error: countError } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('brand_id', id);
    if (countError) throw countError;
    if ((count ?? 0) > 0) {
      throw new BadRequestError(
        `Cannot delete brand: ${count} product${count === 1 ? ' is' : 's are'} linked to it. Reassign or delete those products first.`
      );
    }
    const { error } = await supabase.from('brands').delete().eq('id', id);
    if (error) throw error;

    // Audit log the deletion
    await activityLog.log({
      adminId,
      action: 'DELETE_BRAND',
      entity: 'brand',
      entityId: id,
      details: {
        brandName: brand.name,
        linkedProducts: count || 0
      },
      ipAddress
    });

    logger.info(`[DELETE] Brand ${id} (${brand.name}) deleted by admin ${adminId}`);

    return { message: 'Brand deleted successfully', brandId: id, brandName: brand.name };
  }

  // Controller aliases
  async getAll(query?: any) { return this.getBrands(query); }
  async getAllAdmin(query?: any) { return this.getBrands(query); }
  async getBySlug(slug: string) { return this.getBrandById(slug); }
  async create(data: any) { return this.createBrand(data); }
  async update(id: string, data: any) { return this.updateBrand(id, data); }
  async delete(id: string, adminId?: string, ipAddress?: string) { return this.deleteBrand(id, adminId, ipAddress); }
}

export default new BrandService();
