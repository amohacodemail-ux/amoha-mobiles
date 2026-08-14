import apiClient from '@/lib/api-client';
import type { ApiResponse } from '@/types';

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  image_url?: string;
}

export const brandService = {
  getAll: async (): Promise<Brand[]> => {
    try {
      const { data } = await apiClient.get<ApiResponse<Brand[]>>('/brands');
      const brands = data?.data;
      if (Array.isArray(brands)) return brands;
      // Depending on the backend response structure, it could be nested
      if (brands && typeof brands === 'object' && 'brands' in brands) {
        return (brands as any).brands;
      }
      return [];
    } catch (error) {
      console.error('Failed to fetch brands:', error);
      return [];
    }
  },
};
