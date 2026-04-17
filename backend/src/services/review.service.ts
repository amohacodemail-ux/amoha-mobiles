import supabase from '../config/supabase';
import { transformRow, toDbRow } from '../utils/transform.util';
import { NotFoundError } from '../errors/app-error';
import logger from '../utils/logger.util';

class ReviewService {
  async getReviews(query: any = {}) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const offset = (page - 1) * limit;

    let qb = supabase.from('reviews').select('*, products(id, name, images), users:user_id(id, name)', { count: 'exact' });
    if (query.productId) qb = qb.eq('product_id', query.productId);
    if (query.userId) qb = qb.eq('user_id', query.userId);
    if (query.rating) qb = qb.eq('rating', parseInt(query.rating));
    if (query.isApproved !== undefined) qb = qb.eq('is_approved', query.isApproved === 'true');
    qb = qb.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    const { data, error, count } = await qb;
    if (error) throw error;

    return {
      reviews: (data || []).map((r: any) => {
        const t = transformRow(r);
        t.product = r.products ? transformRow(r.products) : null;
        t.user = r.users ? transformRow(r.users) : null;
        delete t.products;
        delete t.users;
        return t;
      }),
      pagination: { total: count || 0, page, limit, pages: Math.ceil((count || 0) / limit) },
    };
  }

  async approveReview(reviewId: string) {
    const { data, error } = await supabase
      .from('reviews').update({ is_approved: true }).eq('id', reviewId).select('*').single();
    if (error) throw error;
    if (!data) throw new NotFoundError('Review');
    return transformRow(data);
  }

  async rejectReview(reviewId: string) {
    const { data, error } = await supabase
      .from('reviews').update({ is_approved: false }).eq('id', reviewId).select('*').single();
    if (error) throw error;
    if (!data) throw new NotFoundError('Review');
    return transformRow(data);
  }

  async deleteReview(reviewId: string) {
    const { data: review } = await supabase.from('reviews').select('product_id').eq('id', reviewId).maybeSingle();
    const { error } = await supabase.from('reviews').delete().eq('id', reviewId);
    if (error) throw error;
    // Recalculate product ratings using SQL aggregate (avoids fetching all reviews)
    if (review) {
      const { data: agg } = await supabase
        .from('reviews')
        .select('rating')
        .eq('product_id', review.product_id);
      const ratings = agg || [];
      const count = ratings.length;
      const avg = count > 0 ? ratings.reduce((s: number, r: any) => s + r.rating, 0) / count : 0;
      await supabase.from('products').update({ average_rating: Math.round(avg * 10) / 10, review_count: count }).eq('id', review.product_id);
    }
  }

  // Controller aliases
  async getAll(query?: any) { return this.getReviews(query); }
  async approve(reviewId: string) { return this.approveReview(reviewId); }
  async reject(reviewId: string) { return this.rejectReview(reviewId); }
  async delete(reviewId: string) { return this.deleteReview(reviewId); }
  async getByProduct(productId: string, query?: any) {
    const page = parseInt(query?.page) || 1;
    const limit = parseInt(query?.limit) || 10;
    const offset = (page - 1) * limit;
    const { data, error, count } = await supabase.from('reviews').select('*, users(id, name, avatar)', { count: 'exact' }).eq('product_id', productId).order('created_at', { ascending: false }).range(offset, offset + limit - 1);
    if (error) throw error;
    return { reviews: (data || []).map(transformRow), pagination: { total: count || 0, page, limit } };
  }
}

export default new ReviewService();
