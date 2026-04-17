import supabase from '../config/supabase';
import { transformRow, toDbRow } from '../utils/transform.util';
import { NotFoundError, BadRequestError } from '../errors/app-error';

class CouponService {
  async getCoupons(query: any = {}) {
    let qb = supabase.from('coupons').select('*', { count: 'exact' });
    if (query.search) qb = qb.ilike('code', `%${query.search}%`);
    if (query.isActive !== undefined) qb = qb.eq('is_active', query.isActive === 'true');
    if (query.discountType) qb = qb.eq('discount_type', query.discountType);
    qb = qb.order('created_at', { ascending: false });

    if (query.page) {
      const page = parseInt(query.page) || 1;
      const limit = parseInt(query.limit) || 20;
      qb = qb.range((page - 1) * limit, page * limit - 1);
    }

    const { data, error, count } = await qb;
    if (error) throw error;
    return { coupons: (data || []).map(transformRow), total: count || 0 };
  }

  async getCouponById(id: string) {
    const { data, error } = await supabase.from('coupons').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    if (!data) throw new NotFoundError('Coupon');
    return transformRow(data);
  }

  async getCouponByCode(code: string) {
    const { data, error } = await supabase.from('coupons').select('*').eq('code', code.toUpperCase()).maybeSingle();
    if (error) throw error;
    if (!data) throw new NotFoundError('Coupon');
    return transformRow(data);
  }

  async createCoupon(couponData: any) {
    if (couponData.code) couponData.code = couponData.code.toUpperCase();
    const { data, error } = await supabase.from('coupons').insert(toDbRow(couponData)).select('*').single();
    if (error) throw error;
    return transformRow(data);
  }

  async updateCoupon(id: string, updates: any) {
    if (updates.code) updates.code = updates.code.toUpperCase();
    const { data, error } = await supabase.from('coupons').update(toDbRow(updates)).eq('id', id).select('*').single();
    if (error) throw error;
    if (!data) throw new NotFoundError('Coupon');
    return transformRow(data);
  }

  async deleteCoupon(id: string) {
    const { error } = await supabase.from('coupons').delete().eq('id', id);
    if (error) throw error;
  }

  async validateCoupon(code: string, cartTotal: number) {
    const { data: coupon } = await supabase.from('coupons').select('*').eq('code', code.toUpperCase()).eq('is_active', true).maybeSingle();
    if (!coupon) throw new BadRequestError('Invalid coupon code');

    const now = new Date().toISOString();
    if (coupon.valid_from && coupon.valid_from > now) throw new BadRequestError('Coupon is not yet valid');
    if (coupon.expires_at && coupon.expires_at < now) throw new BadRequestError('Coupon has expired');
    if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) throw new BadRequestError('Coupon usage limit reached');
    if (coupon.min_order_amount && cartTotal < coupon.min_order_amount) {
      throw new BadRequestError(`Minimum purchase amount of ${coupon.min_order_amount} required`);
    }

    let discount = 0;
    if (coupon.discount_type === 'percentage') {
      discount = (cartTotal * coupon.discount) / 100;
      if (coupon.max_discount) discount = Math.min(discount, coupon.max_discount);
    } else {
      discount = Math.min(coupon.discount, cartTotal);
    }

    return { valid: true, coupon: transformRow(coupon), discount, message: 'Coupon applied successfully' };
  }

  async incrementUsage(code: string) {
    const { data: coupon } = await supabase.from('coupons').select('id, used_count').eq('code', code.toUpperCase()).maybeSingle();
    if (coupon) {
      await supabase.from('coupons').update({ used_count: (coupon.used_count || 0) + 1 }).eq('id', coupon.id);
    }
  }

  // Controller aliases
  async getAll(query?: any) { return this.getCoupons(query); }
  async create(data: any) { return this.createCoupon(data); }
  async update(id: string, data: any) { return this.updateCoupon(id, data); }
  async delete(id: string) { return this.deleteCoupon(id); }
  async validate(code: string, cartTotal: number) { return this.validateCoupon(code, cartTotal); }
}

export default new CouponService();
