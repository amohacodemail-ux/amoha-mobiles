import apiClient from '@/lib/api-client';
import type { ApiResponse, Coupon, CouponFormData } from '@/types';

const toArray = <T,>(val: unknown, key?: string): T[] => {
  if (Array.isArray(val)) return val as T[];
  if (val && typeof val === 'object' && key && Array.isArray((val as any)[key])) return (val as any)[key];
  return [];
};

export const couponService = {
  getAll: async (): Promise<Coupon[]> => {
    const { data } = await apiClient.get<ApiResponse<any>>('/admin/coupons');
    return toArray<Coupon>(data?.data, 'coupons');
  },
  getById: async (id: string): Promise<Coupon> => {
    const { data } = await apiClient.get<ApiResponse<Coupon>>(`/admin/coupons/${id}`);
    return data.data;
  },
  create: async (payload: CouponFormData): Promise<Coupon> => {
    const { data } = await apiClient.post<ApiResponse<Coupon>>('/admin/coupons', payload);
    return data.data;
  },
  update: async (id: string, payload: Partial<CouponFormData>): Promise<Coupon> => {
    const { data } = await apiClient.put<ApiResponse<Coupon>>(`/admin/coupons/${id}`, payload);
    return data.data;
  },
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/coupons/${id}`);
  },
};
