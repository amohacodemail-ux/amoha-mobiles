import apiClient from '@/lib/api-client';
import type { ApiResponse } from '@/types';

export interface ProductViewItem {
  _id: string;
  viewedAt: string;
  duration: number;
  user: { _id: string; name: string; email: string; phone: string };
  product: { _id: string; name: string; slug: string; thumbnail: string; price: number };
}

export interface UserViewSummary {
  userId: string;
  totalViews: number;
  uniqueProducts: number;
  lastViewedAt: string;
  user: { name: string; email: string; phone: string };
}

export interface ProductViewsResponse {
  items: ProductViewItem[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
}

export interface UserViewSummaryResponse {
  items: UserViewSummary[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
}

export const productViewService = {
  getAll: async (params: { page?: number; limit?: number; search?: string }): Promise<ProductViewsResponse> => {
    const { data } = await apiClient.get<ApiResponse<ProductViewsResponse>>('/admin/product-views', { params });
    return data.data;
  },

  getUserSummary: async (params: { page?: number; limit?: number; search?: string }): Promise<UserViewSummaryResponse> => {
    const { data } = await apiClient.get<ApiResponse<UserViewSummaryResponse>>('/admin/product-views/user-summary', { params });
    return data.data;
  },

  getUserViews: async (userId: string): Promise<ProductViewItem[]> => {
    const { data } = await apiClient.get<ApiResponse<any>>(`/admin/product-views/user/${userId}`);
    const raw = data?.data;
    return Array.isArray(raw) ? raw : Array.isArray(raw?.items) ? raw.items : [];
  },
};
