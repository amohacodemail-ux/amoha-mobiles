import supabase from '../config/supabase';
import { transformRow, toDbRow } from '../utils/transform.util';
import { NotFoundError, BadRequestError } from '../errors/app-error';
import logger from '../utils/logger.util';

class ReviewService {
  async getReviews(query: any = {}) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const offset = (page - 1) * limit;

    let qb = supabase.from('reviews').select('*, products(id, name, images), service_requests(id, service_type), users:user_id(id, name)', { count: 'exact' });
    if (query.productId) qb = qb.eq('product_id', query.productId);
    if (query.serviceRequestId) qb = qb.eq('service_request_id', query.serviceRequestId);
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
        t.service = r.service_requests ? transformRow(r.service_requests) : null;
        t.user = r.users ? transformRow(r.users) : null;
        delete t.products;
        delete t.service_requests;
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
    const { data: review } = await supabase.from('reviews').select('product_id, service_request_id, review_type').eq('id', reviewId).maybeSingle();
    const { error } = await supabase.from('reviews').delete().eq('id', reviewId);
    if (error) throw error;
    
    // Recalculate product ratings using SQL aggregate
    if (review && review.review_type === 'product' && review.product_id) {
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

  async getUserReviews(userId: string) {
    const { data: reviews, error } = await supabase
      .from('reviews')
      .select('*, products(id, name, slug, images, thumbnail), service_requests(id, service_type, device_brand, device_model)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('[ReviewService] Error fetching user reviews:', error);
      throw new Error(`Failed to fetch user reviews: ${error.message}`);
    }

    return (reviews || []).map((r: any) => {
      const review = transformRow(r);
      if (r.review_type === 'product' && r.products) {
        review.product = {
          name: r.products.name,
          slug: r.products.slug,
          thumbnail: r.products.thumbnail || r.products.images?.[0] || '',
        };
      } else if (r.review_type === 'service' && r.service_requests) {
        review.service = {
          serviceType: r.service_requests.service_type,
          device: `${r.service_requests.device_brand} ${r.service_requests.device_model}`,
        };
      }
      return review;
    });
  }

  async getPublicServiceReviews(limit: number = 10) {
    const { data: reviews, error } = await supabase
      .from('reviews')
      .select('*, users:user_id(name, avatar), service_requests(service_type)')
      .eq('review_type', 'service')
      .eq('is_approved', true) // Admin approval workflow implemented!
      .gte('rating', 4) // Show good reviews
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      logger.error('[ReviewService] Error fetching public service reviews:', error);
      throw new Error('Failed to fetch service reviews');
    }

    return (reviews || []).map((r: any) => ({
      _id: r.id,
      id: r.id,
      rating: r.rating,
      title: r.title,
      text: r.comment, // map comment to text for the UI
      createdAt: r.created_at,
      name: r.users?.name || 'Customer',
      avatar: r.users?.avatar || '',
      serviceType: r.service_requests?.service_type || 'Service',
    }));
  }

  async addServiceReview(serviceRequestId: string, userId: string, reviewData: any) {
    // 1. Verify service request exists and is completed
    const { data: request, error: reqError } = await supabase
      .from('service_requests')
      .select('id, status')
      .eq('id', serviceRequestId)
      .eq('user_id', userId)
      .maybeSingle();

    if (reqError) throw new Error('Failed to fetch service request');
    if (!request) throw new NotFoundError('Service Request');
    if (request.status !== 'completed') {
      throw new BadRequestError('You can only review completed service requests');
    }

    // 2. Check if already reviewed
    const { data: existing } = await supabase
      .from('reviews')
      .select('id')
      .eq('service_request_id', serviceRequestId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      throw new BadRequestError('You have already reviewed this service request');
    }

    // 3. Insert review
    const { data: review, error } = await supabase
      .from('reviews')
      .insert({
        review_type: 'service',
        service_request_id: serviceRequestId,
        user_id: userId,
        rating: reviewData.rating,
        title: reviewData.title || '',
        comment: reviewData.comment,
        is_approved: false, // Default to false for admin approval
      })
      .select('*')
      .single();

    if (error) {
      logger.error('[ReviewService] Error adding service review:', error);
      throw new Error(`Failed to add service review: ${error.message}`);
    }

    return transformRow(review);
  }

  async getServiceStats() {
    const { data: stats, error } = await supabase
      .from('reviews')
      .select('rating')
      .eq('review_type', 'service')
      .eq('is_approved', true);

    if (error) {
      logger.error('[ReviewService] Error fetching service stats:', error);
      throw new Error('Failed to fetch service stats');
    }

    const ratings = stats || [];
    const count = ratings.length;
    const avg = count > 0 ? ratings.reduce((s: number, r: any) => s + r.rating, 0) / count : 0;
    
    return {
      averageRating: Math.round(avg * 10) / 10,
      reviewCount: count,
    };
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
