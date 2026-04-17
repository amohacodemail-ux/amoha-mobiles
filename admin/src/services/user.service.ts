import apiClient from '@/lib/api-client';
import type { ApiResponse, User, UsersResponse, TableFilters } from '@/types';
import { buildQueryString } from '@/lib/utils';

export const userService = {
  getAll: async (filters: Partial<TableFilters> = {}): Promise<UsersResponse> => {
    const { data } = await apiClient.get<ApiResponse<UsersResponse>>(
      `/admin/users?${buildQueryString(filters)}`,
    );
    return data.data;
  },
  getById: async (id: string): Promise<User> => {
    const { data } = await apiClient.get<ApiResponse<User>>(`/admin/users/${id}`);
    return data.data;
  },
  toggleBlock: async (id: string, isBlocked: boolean): Promise<User> => {
    const { data } = await apiClient.patch<ApiResponse<User>>(`/admin/users/${id}/block`, {
      isBlocked,
    });
    return data.data;
  },
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/users/${id}`);
  },
  verifyKyc: async (id: string): Promise<User> => {
    const { data } = await apiClient.patch<ApiResponse<User>>(`/users/${id}/kyc/verify`);
    return data.data;
  },
  rejectKyc: async (id: string, rejectionReason: string): Promise<User> => {
    const { data } = await apiClient.patch<ApiResponse<User>>(`/users/${id}/kyc/reject`, { rejectionReason });
    return data.data;
  },
};
