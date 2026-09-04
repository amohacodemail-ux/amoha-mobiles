import supabase from '../config/supabase';
import { transformRow, toDbRow } from '../utils/transform.util';
import { NotFoundError, BadRequestError } from '../errors/app-error';

class CampaignService {
  private async validateAndSetDates(data: any, existingData?: any) {
    if (!data.couponId && !existingData?.couponId) return data;
    const couponId = data.couponId || existingData?.couponId;
    
    // If explicitly clearing couponId (setting to null or empty)
    if (data.couponId === null || data.couponId === '') {
      data.couponId = null;
      return data;
    }

    const { data: coupon, error } = await supabase
      .from('coupons')
      .select('expires_at, is_active')
      .eq('id', couponId)
      .maybeSingle();

    if (error) throw error;
    if (!coupon) throw new BadRequestError('Selected coupon does not exist');
    if (!coupon.is_active) throw new BadRequestError('Selected coupon is not active');
    
    const now = new Date();
    const expiresAt = new Date(coupon.expires_at);
    
    // If it's a new campaign or we're explicitly changing the coupon, we must check if it's already expired
    if (expiresAt < now && (!existingData || data.couponId)) {
      throw new BadRequestError('This coupon has already expired and cannot be used for a new campaign.');
    }
    
    const startDate = new Date(data.startDate || existingData?.start_date);
    if (startDate >= expiresAt) {
      throw new BadRequestError('Campaign start date must be before the coupon expiry date.');
    }

    data.endDate = coupon.expires_at;
    return data;
  }

  async getCampaigns(query: any = {}) {
    let qb = supabase.from('campaigns').select(`
      *,
      coupon:coupons(id, code, discount, discount_type, min_order_amount, usage_limit),
      created_by_user:users!campaigns_created_by_fkey(id, name, email)
    `, { count: 'exact' });

    if (query.status) qb = qb.eq('status', query.status);
    if (query.search) {
      qb = qb.ilike('name', `%${query.search}%`);
    }

    // Pagination
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '10');
    const offset = (page - 1) * limit;
    qb = qb.range(offset, offset + limit - 1).order('created_at', { ascending: false });

    const { data, error, count } = await qb;
    if (error) throw error;

    return {
      campaigns: (data || []).map(transformRow),
      total: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / limit)
    };
  }

  async getCampaignById(id: string) {
    const { data, error } = await supabase
      .from('campaigns')
      .select(`
        *,
        coupon:coupons(id, code, discount, discount_type, min_order_amount, usage_limit),
        category:categories(id, name, slug)
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new NotFoundError('Campaign');
    return transformRow(data);
  }

  async createCampaign(data: any, adminId?: string) {
    data = await this.validateAndSetDates(data);
    const row = { ...toDbRow(data), created_by: adminId };
    const { data: campaign, error } = await supabase
      .from('campaigns')
      .insert(row)
      .select('*')
      .single();

    if (error) throw error;
    return transformRow(campaign);
  }

  async updateCampaign(id: string, updates: any) {
    const existing = await this.getCampaignById(id);
    updates = await this.validateAndSetDates(updates, existing);
    const { data, error } = await supabase
      .from('campaigns')
      .update(toDbRow(updates))
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    if (!data) throw new NotFoundError('Campaign');
    return transformRow(data);
  }

  async deleteCampaign(id: string) {
    const { data, error: fetchError } = await supabase.from('campaigns').select('id').eq('id', id).maybeSingle();
    if (fetchError) throw fetchError;
    if (!data) throw new NotFoundError('Campaign');

    const { error } = await supabase.from('campaigns').delete().eq('id', id);
    if (error) throw error;

    return { message: 'Campaign deleted successfully', campaignId: id };
  }
}

export default new CampaignService();
