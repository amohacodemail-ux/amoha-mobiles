import apiClient from '@/lib/api-client';
import type { ApiResponse } from '@/types';

export interface BaseReview {
  id: string;
  rating: number;
  title?: string;
  comment: string; // The backend returns comment but UI may expect text
  createdAt: string;
  isApproved: boolean;
  status?: string;
  // Common fields mapped for UI
  name?: string;
  avatar?: string;
  text?: string;
}

export interface ProductReview extends BaseReview {
  productId: string;
  product?: {
    name: string;
    slug: string;
    thumbnail: string;
  };
}

export interface ServiceReview extends BaseReview {
  serviceRequestId: string;
  service?: {
    serviceType: string;
    device: string;
  };
  serviceType?: string; // from getPublicServiceReviews
}

export type Review = ProductReview | ServiceReview;

export const reviewService = {
  getMyReviews: async (): Promise<Review[]> => {
    const { data } = await apiClient.get<ApiResponse<Review[]>>('/reviews/me');
    return data.data || [];
  },

  getPublicServiceReviews: async (limit = 10): Promise<ServiceReview[]> => {
    const { data } = await apiClient.get<ApiResponse<ServiceReview[]>>(`/reviews/service?limit=${limit}`);
    return data.data || [];
  },

  addServiceReview: async (
    requestId: string,
    review: { rating: number; title?: string; comment: string }
  ): Promise<ServiceReview> => {
    const { data } = await apiClient.post<ApiResponse<ServiceReview>>(`/reviews/service/${requestId}`, review);
    return data.data;
  },

  getServiceStats: async (): Promise<{ averageRating: number; reviewCount: number }> => {
    const { data } = await apiClient.get<ApiResponse<{ averageRating: number; reviewCount: number }>>('/reviews/service/stats');
    return data.data;
  },
};
