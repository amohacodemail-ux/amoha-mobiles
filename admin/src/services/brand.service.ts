import apiClient from '@/lib/api-client';
import type { ApiResponse, Brand, BrandFormData } from '@/types';

const toArray = <T,>(val: unknown, key?: string): T[] => {
  if (Array.isArray(val)) return val as T[];
  if (val && typeof val === 'object' && key && Array.isArray((val as any)[key])) return (val as any)[key];
  return [];
};

const normalizeBrand = (brand: any): Brand => ({
  ...brand,
  _id: brand?._id || brand?.id || brand?.slug || brand?.name || '',
});

export const brandService = {
  getAll: async (): Promise<Brand[]> => {
    const { data } = await apiClient.get<ApiResponse<any>>('/admin/brands');
    return toArray<any>(data?.data, 'brands').map(normalizeBrand);
  },
  getById: async (id: string): Promise<Brand> => {
    const { data } = await apiClient.get<ApiResponse<Brand>>(`/admin/brands/${id}`);
    return data.data;
  },
  create: async (payload: BrandFormData): Promise<Brand> => {
    const { data } = await apiClient.post<ApiResponse<Brand>>('/admin/brands', payload);
    return data.data;
  },
  update: async (id: string, payload: Partial<BrandFormData>): Promise<Brand> => {
    const { data } = await apiClient.put<ApiResponse<Brand>>(`/admin/brands/${id}`, payload);
    return data.data;
  },
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/brands/${id}`);
  },
};
