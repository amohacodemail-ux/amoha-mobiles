'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Product, ProductsResponse, ProductFilters } from '@/types';
import { productService } from '@/services/product.service';

/** Deduplicate a product array by _id, preserving order. */
function dedupeProducts(products: Product[]): Product[] {
  const seen = new Set<string>();
  return products.filter((p) => {
    if (seen.has(p._id)) return false;
    seen.add(p._id);
    return true;
  });
}

export function useProducts(initialFilters?: ProductFilters) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Store filters in a ref so callbacks always read the latest value without
  // needing to be recreated (avoids stale-closure bugs on category pages).
  const filtersRef = useRef<ProductFilters>(initialFilters || {});
  const [filters, setFiltersState] = useState<ProductFilters>(initialFilters || {});
  const [totalPages, setTotalPages] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // Keep ref in sync with state
  const setFilters = useCallback((f: ProductFilters) => {
    filtersRef.current = f;
    setFiltersState(f);
  }, []);

  const fetchProducts = useCallback(async (newFilters?: ProductFilters) => {
    setIsLoading(true);
    setError(null);
    try {
      // Always use the passed filters or the latest ref value — never stale closure
      const appliedFilters = newFilters ?? filtersRef.current;
      const data: ProductsResponse = await productService.getAll(appliedFilters);
      setProducts(dedupeProducts(data.products));
      setTotalPages(data.totalPages);
      setTotalProducts(data.totalProducts);
      setCurrentPage(data.currentPage);
      setHasMore(data.hasMore);
    } catch {
      setError('Failed to fetch products.');
    } finally {
      setIsLoading(false);
    }
  }, []); // no deps — reads from ref

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading) return;
    setIsLoading(true);
    try {
      const nextPage = filtersRef.current.page ? Number(filtersRef.current.page) + 1 : 2;
      const newFilters = { ...filtersRef.current, page: nextPage };
      filtersRef.current = newFilters;
      const data = await productService.getAll(newFilters);
      setProducts((prev) => dedupeProducts([...prev, ...data.products]));
      setCurrentPage(data.currentPage);
      setHasMore(data.hasMore);
      setFiltersState(newFilters);
    } catch {
      setError('Failed to load more products.');
    } finally {
      setIsLoading(false);
    }
  }, [hasMore, isLoading]);

  const updateFilters = useCallback((newFilters: Partial<ProductFilters>) => {
    const updated = { ...filtersRef.current, ...newFilters, page: 1 };
    setFilters(updated);
    fetchProducts(updated);
  }, [fetchProducts, setFilters]);

  const goToPage = useCallback((page: number) => {
    const updated = { ...filtersRef.current, page };
    setFilters(updated);
    fetchProducts(updated);
  }, [fetchProducts, setFilters]);

  useEffect(() => {
    // Fetch on mount using the initial filters (already in ref)
    fetchProducts(filtersRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    products,
    isLoading,
    error,
    filters,
    totalPages,
    totalProducts,
    currentPage,
    hasMore,
    fetchProducts,
    loadMore,
    updateFilters,
    goToPage,
    setFilters,
  };
}
