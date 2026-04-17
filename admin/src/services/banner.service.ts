import apiClient from '@/lib/api-client';
import type { ApiResponse, Banner, BannerFormData } from '@/types';

const toArray = <T,>(val: unknown, key?: string): T[] => {
  if (Array.isArray(val)) return val as T[];
  if (val && typeof val === 'object' && key && Array.isArray((val as any)[key])) return (val as any)[key];
  return [];
};

export const bannerService = {
  getAll: async (): Promise<Banner[]> => {
    const { data } = await apiClient.get<ApiResponse<any>>('/admin/banners');
    return toArray<Banner>(data?.data, 'banners');
  },
  create: async (payload: BannerFormData): Promise<Banner> => {
    const { data } = await apiClient.post<ApiResponse<Banner>>('/admin/banners', payload);
    return data.data;
  },
  update: async (id: string, payload: Partial<BannerFormData>): Promise<Banner> => {
    const { data } = await apiClient.put<ApiResponse<Banner>>(`/admin/banners/${id}`, payload);
    return data.data;
  },
  toggleActive: async (id: string, isActive: boolean): Promise<Banner> => {
    const { data } = await apiClient.patch<ApiResponse<Banner>>(`/admin/banners/${id}/toggle`, { isActive });
    return data.data;
  },
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/banners/${id}`);
  },
};
