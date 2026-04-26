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
    const { data } = await apiClient.get<ApiResponse<any>>(
      `/admin/barcode/stock/${encodeURIComponent(code)}`,
    );
    // Handle both old nested { product, stock } response and new flat product response
    const result = data.data;
    return (result?.product ?? result) as BarcodeProduct;
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
