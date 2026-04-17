import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product } from '@/types';

interface CompareState {
  items: Product[];
  maxItems: number;
  addToCompare: (product: Product) => void;
  removeFromCompare: (productId: string) => void;
  clearCompare: () => void;
  isInCompare: (productId: string) => boolean;
}

export const useCompareStore = create<CompareState>()(
  persist(
    (set, get) => ({
      items: [],
      maxItems: 4,

      addToCompare: (product) => {
        const { items, maxItems } = get();
        if (items.length >= maxItems) return;
        if (items.some((item) => item._id === product._id)) return;
        set({ items: [...items, product] });
      },

      removeFromCompare: (productId) => {
        set((state) => ({
          items: state.items.filter((item) => item._id !== productId),
        }));
      },

      clearCompare: () => set({ items: [] }),

      isInCompare: (productId) => {
        const items = get().items;
        return Array.isArray(items) && items.some((item) => item._id === productId);
      },
    }),
    {
      name: 'amoha-compare',
      partialize: (state) => ({ items: state.items }),
      onRehydrateStorage: () => (state) => {
        if (state && !Array.isArray(state.items)) {
          state.items = [];
        }
      },
    },
  ),
);
