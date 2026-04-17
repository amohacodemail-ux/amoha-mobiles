import apiClient from '@/lib/api-client';
import type { ApiResponse, Review, ReviewsResponse, TableFilters } from '@/types';
import { buildQueryString } from '@/lib/utils';

export const reviewService = {
  getAll: async (filters: Partial<TableFilters> = {}): Promise<ReviewsResponse> => {
    const { data } = await apiClient.get<ApiResponse<ReviewsResponse>>(
      `/admin/reviews?${buildQueryString(filters)}`,
    );
    return data.data;
  },
  updateStatus: async (id: string, status: 'approved' | 'rejected'): Promise<Review> => {
    const { data } = await apiClient.patch<ApiResponse<Review>>(`/admin/reviews/${id}/status`, { status });
    return data.data;
  },
  approve: async (id: string): Promise<Review> => {
    const { data } = await apiClient.patch<ApiResponse<Review>>(`/admin/reviews/${id}/approve`);
    return data.data;
  },
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/reviews/${id}`);
  },
};
