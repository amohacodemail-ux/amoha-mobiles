import apiClient from '@/lib/api-client';
import type { ApiResponse } from '@/types';

export interface AbandonedCartItem {
  quantity: number;
  color: string;
  price: number;
  totalPrice: number;
  product: { _id: string; name: string; thumbnail: string; price: number };
}

export interface AbandonedCart {
  _id: string;
  updatedAt: string;
  itemCount: number;
  subtotal: number;
  totalAmount: number;
  items: AbandonedCartItem[];
  user: { _id: string; name: string; email: string; phone: string };
}

export interface AbandonedCartsResponse {
  items: AbandonedCart[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
}

export const cartAbandonmentService = {
  getAll: async (params: { page?: number; limit?: number; search?: string; minAge?: number }): Promise<AbandonedCartsResponse> => {
    const { data } = await apiClient.get<ApiResponse<AbandonedCartsResponse>>('/admin/abandoned-carts', { params });
    return data.data;
  },

  downloadCSV: async (minAge?: number): Promise<void> => {
    const response = await apiClient.get('/admin/abandoned-carts/download', {
      params: { minAge },
      responseType: 'blob',
    });
    const blob = new Blob([response.data as BlobPart], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `abandoned-carts-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  },
};
