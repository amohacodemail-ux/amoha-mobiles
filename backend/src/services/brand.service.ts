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

    const { data, error, count } = await qb;
    if (error) throw error;

    // Count active products per brand
    const { data: activeProdRows } = await supabase
      .from('products')
      .select('brand_id')
      .eq('is_active', true);

    const activeCountMap: Record<string, number> = {};
    (activeProdRows || []).forEach((p: any) => {
      if (p.brand_id) {
        activeCountMap[p.brand_id] = (activeCountMap[p.brand_id] || 0) + 1;
      }
    });

    const brands = (data || []).map((row: any) => {
      const transformed = transformRow(row);
      transformed.productCount = activeCountMap[transformed._id] || 0;
      return transformed;
    });

    if (query.page) {
      const page = parseInt(query.page) || 1;
      const limit = parseInt(query.limit) || 20;
      const start = (page - 1) * limit;
      const end = page * limit - 1;
      return { brands: brands.slice(start, end + 1), total: brands.length };
    }

    return { brands, total: brands.length };
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

    // Count linked products for audit log (but don't block deletion)
    const { count } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('brand_id', id);

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

    logger.info(`[DELETE] Brand ${id} (${brand.name}) deleted by admin ${adminId} (had ${count} linked products)`);

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
