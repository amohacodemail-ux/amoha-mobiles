import apiClient from '@/lib/api-client';
import { ApiResponse, ReturnRequest, ReturnReason, ReturnType } from '@/types';

const returnService = {
  create: async (data: {
    orderId: string;
    items: { orderItemId?: string; productId?: string; quantity: number; reason: ReturnReason }[];
    type: ReturnType;
    description: string;
    images?: string[];
    refundMethod?: string;
  }) => {
    const res = await apiClient.post<ApiResponse<ReturnRequest>>('/returns', data);
    return res.data.data;
  },

  getAll: async (page = 1, limit = 10) => {
    const res = await apiClient.get<ApiResponse<any>>(`/returns?page=${page}&limit=${limit}`);
    const raw = res.data.data;
    // Backend returns { returns, pagination } — normalise
    if (raw.returns !== undefined) {
      return { items: raw.returns as ReturnRequest[], totalItems: raw.pagination?.total ?? 0, totalPages: raw.pagination?.pages ?? 1, currentPage: raw.pagination?.page ?? 1 };
    }
    return raw as { items: ReturnRequest[]; totalItems: number; totalPages: number; currentPage: number };
  },

  getById: async (id: string) => {
    const res = await apiClient.get<ApiResponse<ReturnRequest>>(`/returns/${id}`);
    return res.data.data;
  },
};

export default returnService;
