import apiClient from '@/lib/api-client';
import type {
  Product,
  ProductsResponse,
  ProductFilters,
  SearchSuggestion,
  HomepageReview,
  ApiResponse,
} from '@/types';

const toArray = <T>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

const normalizeProductsResponse = (value: unknown): ProductsResponse => {
  const data = (value && typeof value === 'object' ? value : {}) as Partial<ProductsResponse>;
  return {
    products: toArray<Product>(data.products),
    totalProducts: Number(data.totalProducts || 0),
    totalPages: Number(data.totalPages || 0),
    currentPage: Number(data.currentPage || 1),
    hasMore: Boolean(data.hasMore),
  };
};

export const productService = {
  getAll: async (filters?: ProductFilters): Promise<ProductsResponse> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            params.set(key, value.join(','));
          } else {
            params.set(key, String(value));
          }
        }
      });
    }
    const { data } = await apiClient.get<ApiResponse<ProductsResponse>>(
      `/products?${params.toString()}`,
    );
    return normalizeProductsResponse(data?.data);
  },

  getBySlug: async (slug: string): Promise<Product> => {
    const { data } = await apiClient.get<ApiResponse<Product>>(
      `/products/${slug}`,
    );
    return data.data;
  },

  getFeatured: async (): Promise<Product[]> => {
    const { data } = await apiClient.get<ApiResponse<Product[]>>(
      '/products/featured',
    );
    return toArray<Product>(data?.data);
  },

  getTrending: async (): Promise<Product[]> => {
    const { data } = await apiClient.get<ApiResponse<Product[]>>(
      '/products/trending',
    );
    return toArray<Product>(data?.data);
  },

  getByCategory: async (
    categorySlug: string,
    filters?: ProductFilters,
  ): Promise<ProductsResponse> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            params.set(key, value.join(','));
          } else {
            params.set(key, String(value));
          }
        }
      });
    }
    const { data } = await apiClient.get<ApiResponse<ProductsResponse>>(
      `/products/category/${categorySlug}?${params.toString()}`,
    );
    return normalizeProductsResponse(data?.data);
  },

  search: async (query: string): Promise<SearchSuggestion[]> => {
    const { data } = await apiClient.get<ApiResponse<SearchSuggestion[]>>(
      `/products/search/suggestions?q=${encodeURIComponent(query)}`,
    );
    return toArray<SearchSuggestion>(data?.data);
  },

  getRelated: async (productId: string): Promise<Product[]> => {
    const { data } = await apiClient.get<ApiResponse<Product[]>>(
      `/products/${productId}/related`,
    );
    return toArray<Product>(data?.data);
  },

  submitReview: async (
    productId: string,
    review: { rating: number; title: string; comment: string },
  ): Promise<void> => {
    await apiClient.post(`/products/${productId}/reviews`, review);
  },

  trackView: async (productId: string): Promise<void> => {
    await apiClient.post('/products/track-view', { productId });
  },

  getTopReviews: async (limit = 8): Promise<HomepageReview[]> => {
    const { data } = await apiClient.get<ApiResponse<HomepageReview[]>>(
      `/products/reviews/top?limit=${limit}`,
    );
    return toArray<HomepageReview>(data?.data);
  },

  getRecentlyViewed: async (limit = 10): Promise<Product[]> => {
    const { data } = await apiClient.get<ApiResponse<Product[]>>(
      `/products/recently-viewed?limit=${limit}`,
    );
    return toArray<Product>(data?.data);
  },
};
