import apiClient from '@/lib/api-client';
import type { ApiResponse } from '@/types';

export type BarcodeType = 'EAN13' | 'EAN8' | 'UPCA' | 'CODE128' | 'CODE39';

export interface BarcodeRequirements {
  length: string;
  charset: string;
  example: string;
}

export interface BarcodeTypeInfo {
  type: BarcodeType;
  name: string;
  description: string;
  requirements: BarcodeRequirements;
}

export interface BarcodeValidationResult {
  valid: boolean;
  type?: BarcodeType;
  error?: string;
  formatted?: string;
  requirements?: BarcodeRequirements;
}

export interface BarcodeProduct {
  _id: string;
  name: string;
  sku: string;
  barcode: string;
  barcodeType?: BarcodeType;
  price: number;
  stock: number;
  images: string[];
  thumbnail?: string;
  category?: { name: string };
  brand?: { name: string };
}

export interface BarcodeGenerateOptions {
  type?: BarcodeType;
  value?: string;
  prefix?: string;
}

export interface BulkGenerateResult {
  results: (BarcodeProduct | null)[];
  summary: {
    total: number;
    success: number;
    failed: number;
  };
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

  regenerate: async (
    productId: string,
    options?: BarcodeGenerateOptions
  ): Promise<BarcodeProduct> => {
    const { data } = await apiClient.post<ApiResponse<BarcodeProduct>>(
      `/admin/barcode/regenerate/${productId}`,
      options || {},
    );
    return data.data;
  },

  validate: async (
    barcode: string,
    type?: BarcodeType,
    excludeProductId?: string
  ): Promise<BarcodeValidationResult> => {
    const { data } = await apiClient.post<ApiResponse<BarcodeValidationResult>>(
      '/admin/barcode/validate',
      { barcode, type, excludeProductId }
    );
    return data.data;
  },

  getTypes: async (): Promise<BarcodeTypeInfo[]> => {
    const { data } = await apiClient.get<ApiResponse<BarcodeTypeInfo[]>>(
      '/admin/barcode/types'
    );
    return data.data;
  },

  bulkGenerate: async (
    productIds: string[],
    type?: BarcodeType
  ): Promise<BulkGenerateResult> => {
    const { data } = await apiClient.post<ApiResponse<BulkGenerateResult>>(
      '/admin/barcode/bulk-generate',
      { productIds, type }
    );
    return data.data;
  },
};
