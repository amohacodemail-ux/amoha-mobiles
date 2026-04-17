import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { WishlistItem, Product } from '@/types';
import { wishlistService } from '@/services/wishlist.service';

const normalizeWishlistItems = (value: unknown): WishlistItem[] => {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is WishlistItem =>
      !!item &&
      typeof item === 'object' &&
      !!(item as WishlistItem).product &&
      typeof (item as WishlistItem).product === 'object',
  );
};

interface WishlistState {
  items: WishlistItem[];
  isLoading: boolean;
  error: string | null;
  fetchWishlist: () => Promise<void>;
  addToWishlist: (productId: string, product?: Product) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,
      error: null,

      fetchWishlist: async () => {
        set({ isLoading: true, error: null });
        try {
          const data = await wishlistService.getAll();
          set({ items: normalizeWishlistItems(data), isLoading: false });
        } catch {
          set({ items: [], isLoading: false });
        }
      },

      addToWishlist: async (productId, product) => {
        set({ error: null });
        const tempId = `temp-${productId}`;

        // Optimistic update: show filled heart instantly using product data from the card
        if (product) {
          const tempItem: WishlistItem = { _id: tempId, product, addedAt: new Date().toISOString() };
          set((state) => ({ items: [...normalizeWishlistItems(state.items), tempItem] }));
        }

        try {
          const newItem = await wishlistService.add(productId);
          // Replace the temp item (or append if no optimistic item) with real server data
          set((state) => {
            const current = normalizeWishlistItems(state.items).filter((i) => i._id !== tempId);
            if (newItem && newItem.product) {
              return { items: [...current, newItem] };
            }
            // API succeeded but no product data — keep optimistic item or re-fetch
            if (product) {
              const tempItem: WishlistItem = { _id: `confirmed-${productId}`, product, addedAt: new Date().toISOString() };
              return { items: [...current, tempItem] };
            }
            return { items: current };
          });
          // If neither optimistic nor response had product data, fetch from server
          if (!product && !newItem?.product) {
            const data = await wishlistService.getAll();
            set({ items: normalizeWishlistItems(data) });
          }
        } catch (err: unknown) {
          // Rollback the optimistic item
          if (product) {
            set((state) => ({
              items: normalizeWishlistItems(state.items).filter((i) => i._id !== tempId),
            }));
          }
          const message =
            (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
            'Please login to add to wishlist.';
          set({ error: message });
          throw new Error(message);
        }
      },

      removeFromWishlist: async (productId) => {
        // Optimistic update: remove immediately from UI
        set((state) => ({
          items: normalizeWishlistItems(state.items).filter(
            (item) => item?.product?._id !== productId,
          ),
        }));
        try {
          await wishlistService.remove(productId);
        } catch {
          // On failure, re-fetch to restore correct state
          try {
            const data = await wishlistService.getAll();
            set({ items: normalizeWishlistItems(data) });
          } catch {
            // ignore
          }
        }
      },

      isInWishlist: (productId) => {
        const items = normalizeWishlistItems(get().items);
        return items.some((item) => item?.product?._id === productId);
      },
      clearWishlist: () => {
        set({ items: [], error: null });
      },    }),
    {
      name: 'amoha-wishlist',
      version: 2,
      partialize: (state) => ({ items: state.items }),
      merge: (persistedState, currentState) => {
        const persisted = (persistedState || {}) as Partial<WishlistState>;
        return {
          ...currentState,
          ...persisted,
          items: normalizeWishlistItems(persisted.items),
        };
      },
      migrate: (persistedState) => {
        const persisted = (persistedState || {}) as Partial<WishlistState>;
        return {
          ...persisted,
          items: normalizeWishlistItems(persisted.items),
        } as WishlistState;
      },
    },
  ),
);
