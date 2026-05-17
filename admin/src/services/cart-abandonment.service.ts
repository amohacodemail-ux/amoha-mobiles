import apiClient from '@/lib/api-client';
import { downloadExcelFromBlob } from '@/lib/excel-export';
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
    await downloadExcelFromBlob(new Blob([response.data as BlobPart]), `abandoned-carts-${new Date().toISOString().split('T')[0]}`);
  },
};
