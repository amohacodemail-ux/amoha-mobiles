import apiClient from '@/lib/api-client';
import type { ApiResponse, Category, CategoryFormData } from '@/types';

const toArray = <T,>(val: unknown, key?: string): T[] => {
  if (Array.isArray(val)) return val as T[];
  if (val && typeof val === 'object' && key && Array.isArray((val as any)[key])) return (val as any)[key];
  return [];
};

const normalizeCategory = (category: any): Category => ({
  ...category,
  _id: category?._id || category?.id || category?.slug || category?.name || '',
});

export const categoryService = {
  getAll: async (): Promise<Category[]> => {
    const { data } = await apiClient.get<ApiResponse<any>>('/admin/categories');
    return toArray<any>(data?.data, 'categories').map(normalizeCategory);
  },
  getById: async (id: string): Promise<Category> => {
    const { data } = await apiClient.get<ApiResponse<Category>>(`/admin/categories/${id}`);
    return data.data;
  },
  create: async (payload: CategoryFormData): Promise<Category> => {
    const { data } = await apiClient.post<ApiResponse<Category>>('/admin/categories', payload);
    return data.data;
  },
  update: async (id: string, payload: Partial<CategoryFormData>): Promise<Category> => {
    const { data } = await apiClient.put<ApiResponse<Category>>(`/admin/categories/${id}`, payload);
    return data.data;
  },
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/categories/${id}`);
  },
};
