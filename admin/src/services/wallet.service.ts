import apiClient from '@/lib/api-client';
import type { ApiResponse, WalletsResponse, AdminWallet, TableFilters } from '@/types';
import { buildQueryString } from '@/lib/utils';

export const walletService = {
  getAll: async (filters: Partial<TableFilters> = {}): Promise<WalletsResponse> => {
    const { data } = await apiClient.get<ApiResponse<WalletsResponse>>(
      `/wallet/admin/all?${buildQueryString(filters)}`,
    );
    return data.data;
  },
  credit: async (userId: string, amount: number, description: string): Promise<AdminWallet> => {
    const { data } = await apiClient.post<ApiResponse<AdminWallet>>(
      '/wallet/admin/credit',
      { userId, amount, description },
    );
    return data.data;
  },
};
