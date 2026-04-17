import apiClient from '@/lib/api-client';
import type { ApiResponse, Product, ProductsResponse, TableFilters } from '@/types';
import { buildQueryString } from '@/lib/utils';

export const productService = {
  getAll: async (filters: Partial<TableFilters> = {}): Promise<ProductsResponse> => {
    const { data } = await apiClient.get<ApiResponse<ProductsResponse>>(
      `/admin/products?${buildQueryString(filters)}`,
    );
    return data.data;
  },
  getById: async (id: string): Promise<Product> => {
    const { data } = await apiClient.get<ApiResponse<Product>>(`/admin/products/${id}`);
    return data.data;
  },
  create: async (payload: any): Promise<Product> => {
    const { data } = await apiClient.post<ApiResponse<Product>>('/admin/products', payload);
    return data.data;
  },
  update: async (id: string, payload: any): Promise<Product> => {
    const { data } = await apiClient.put<ApiResponse<Product>>(`/admin/products/${id}`, payload);
    return data.data;
  },
  delete: async (id: string): Promise<string> => {
    const { data } = await apiClient.delete<ApiResponse<null>>(`/admin/products/${id}`);
    return data.message || 'Product removed from catalog';
  },
  updateStock: async (id: string, stock: number): Promise<Product> => {
    const { data } = await apiClient.patch<ApiResponse<Product>>(`/admin/products/${id}/stock`, { stock });
    return data.data;
  },
  bulkCreate: async (products: any[]): Promise<{ created: number; failed: number; errors: { row: number; name: string; error: string }[] }> => {
    const { data } = await apiClient.post<ApiResponse<{ created: number; failed: number; errors: { row: number; name: string; error: string }[] }>>(
      '/products/bulk',
      { products },
    );
    return data.data;
  },
};
