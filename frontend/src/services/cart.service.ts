import apiClient from '@/lib/api-client';
import type { Cart, ApiResponse, AppliedCoupon, Product } from '@/types';

export const cartService = {
  get: async (): Promise<Cart> => {
    const { data } = await apiClient.get<ApiResponse<Cart>>('/cart');
    return data.data;
  },

  addItem: async (
    productId: string,
    quantity: number = 1,
    color?: string,
  ): Promise<Cart> => {
    const { data } = await apiClient.post<ApiResponse<Cart>>('/cart/add', {
      productId,
      quantity,
      color,
    });
    return data.data;
  },

  updateQuantity: async (
    itemId: string,
    quantity: number,
  ): Promise<Cart> => {
    const { data } = await apiClient.put<ApiResponse<Cart>>(
      `/cart/item/${itemId}`,
      { quantity },
    );
    return data.data;
  },

  removeItem: async (itemId: string): Promise<Cart> => {
    const { data } = await apiClient.delete<ApiResponse<Cart>>(
      `/cart/item/${itemId}`,
    );
    return data.data;
  },

  clear: async (): Promise<void> => {
    await apiClient.delete('/cart/clear');
  },

  applyCoupon: async (code: string): Promise<AppliedCoupon> => {
    const { data } = await apiClient.post<ApiResponse<AppliedCoupon>>(
      '/cart/coupon',
      { code },
    );
    return data.data;
  },

  removeCoupon: async (): Promise<Cart> => {
    const { data } = await apiClient.delete<ApiResponse<Cart>>('/cart/coupon');
    return data.data;
  },

  getAccessories: async (): Promise<Product[]> => {
    const { data } = await apiClient.get<ApiResponse<Product[]>>('/cart/accessories');
    return data.data;
  },

  saveForLater: async (itemId: string): Promise<Cart> => {
    const { data } = await apiClient.post<ApiResponse<Cart>>(`/cart/save-for-later/${itemId}`);
    return data.data;
  },

  moveToCart: async (itemId: string): Promise<Cart> => {
    const { data } = await apiClient.post<ApiResponse<Cart>>(`/cart/move-to-cart/${itemId}`);
    return data.data;
  },

  removeSavedItem: async (itemId: string): Promise<Cart> => {
    const { data } = await apiClient.delete<ApiResponse<Cart>>(`/cart/saved/${itemId}`);
    return data.data;
  },
};
