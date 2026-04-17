import apiClient from '@/lib/api-client';
import type { WishlistItem, ApiResponse } from '@/types';

const normalizeWishlistItems = (payload: unknown): WishlistItem[] => {
  if (Array.isArray(payload)) return payload as WishlistItem[];
  if (
    payload &&
    typeof payload === 'object' &&
    Array.isArray((payload as { items?: unknown }).items)
  ) {
    return (payload as { items: WishlistItem[] }).items;
  }
  return [];
};

export const wishlistService = {
  getAll: async (): Promise<WishlistItem[]> => {
    const { data } = await apiClient.get<ApiResponse<WishlistItem[]>>('/wishlist');
    return normalizeWishlistItems(data.data);
  },

  // Returns the newly added WishlistItem (backend now returns single item, not full list)
  add: async (productId: string): Promise<WishlistItem | null> => {
    const { data } = await apiClient.post<ApiResponse<WishlistItem>>('/wishlist', { productId });
    const item = data.data;
    if (item && typeof item === 'object' && 'product' in item) return item as WishlistItem;
    return null;
  },

  remove: async (productId: string): Promise<void> => {
    await apiClient.delete(`/wishlist/${productId}`);
  },

  check: async (productId: string): Promise<boolean> => {
    const { data } = await apiClient.get<ApiResponse<{ isInWishlist: boolean }>>(
      `/wishlist/check/${productId}`,
    );
    return data.data.isInWishlist;
  },
};
