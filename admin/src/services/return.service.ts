import apiClient from '@/lib/api-client';
import type { ApiResponse, ReturnRequest, ReturnsResponse, ReturnStats, ReturnStatus, TableFilters } from '@/types';
import { buildQueryString } from '@/lib/utils';

export const returnService = {
  getAll: async (filters: Partial<TableFilters> = {}): Promise<ReturnsResponse> => {
    const { data } = await apiClient.get<ApiResponse<any>>(
      `/returns/admin/all?${buildQueryString(filters)}`,
    );
    const raw = data.data;
    // Backend returns { returns, pagination } — normalise to ReturnsResponse shape
    if (raw.returns !== undefined) {
      return {
        items: raw.returns,
        totalItems: raw.pagination?.total ?? 0,
        totalPages: raw.pagination?.pages ?? 1,
        currentPage: raw.pagination?.page ?? 1,
      };
    }
    return raw as ReturnsResponse;
  },
  getStats: async (): Promise<ReturnStats> => {
    const { data } = await apiClient.get<ApiResponse<ReturnStats>>('/returns/admin/stats');
    return data.data;
  },
  updateStatus: async (id: string, status: ReturnStatus, message?: string): Promise<ReturnRequest> => {
    const { data } = await apiClient.patch<ApiResponse<ReturnRequest>>(
      `/returns/admin/${id}/status`,
      { status, message },
    );
    return data.data;
  },
};
