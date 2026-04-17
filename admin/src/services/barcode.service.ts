import apiClient from '@/lib/api-client';
import type { ApiResponse } from '@/types';

export interface BarcodeProduct {
  _id: string;
  name: string;
  sku: string;
  barcode: string;
  price: number;
  stock: number;
  images: string[];
  thumbnail?: string;
  category?: { name: string };
  brand?: { name: string };
}

export const barcodeService = {
  lookup: async (code: string): Promise<BarcodeProduct> => {
    const { data } = await apiClient.get<ApiResponse<BarcodeProduct>>(
      `/admin/barcode/lookup/${encodeURIComponent(code)}`,
    );
    return data.data;
  },

  stockCheck: async (code: string): Promise<BarcodeProduct> => {
    const { data } = await apiClient.get<ApiResponse<BarcodeProduct>>(
      `/admin/barcode/stock/${encodeURIComponent(code)}`,
    );
    return data.data;
  },

  bulkLookup: async (codes: string[]): Promise<BarcodeProduct[]> => {
    const { data } = await apiClient.post<ApiResponse<BarcodeProduct[]>>(
      '/admin/barcode/bulk-lookup',
      { codes },
    );
    return data.data;
  },

  regenerate: async (productId: string): Promise<BarcodeProduct> => {
    const { data } = await apiClient.post<ApiResponse<BarcodeProduct>>(
      `/admin/barcode/regenerate/${productId}`,
    );
    return data.data;
  },
};
