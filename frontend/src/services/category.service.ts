import apiClient from '@/lib/api-client';
import type { Category, Banner, ApiResponse } from '@/types';

const extractArray = <T>(val: unknown, key?: string): T[] => {
  if (Array.isArray(val)) return val as T[];
  if (val && typeof val === 'object') {
    if (key && Array.isArray((val as any)[key])) return (val as any)[key];
    // Try common keys
    for (const k of Object.keys(val as object)) {
      if (Array.isArray((val as any)[k])) return (val as any)[k];
    }
  }
  return [];
};

export const categoryService = {
  getAll: async (): Promise<Category[]> => {
    const { data } = await apiClient.get<ApiResponse<any>>('/categories');
    return extractArray<Category>(data?.data, 'categories');
  },

  getBySlug: async (slug: string): Promise<Category> => {
    const { data } = await apiClient.get<ApiResponse<Category>>(
      `/categories/${slug}`,
    );
    return data.data;
  },
};

export const bannerService = {
  getAll: async (): Promise<Banner[]> => {
    const { data } = await apiClient.get<ApiResponse<any>>('/banners');
    return extractArray<Banner>(data?.data, 'banners');
  },
};
