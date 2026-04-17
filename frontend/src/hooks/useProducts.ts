'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Product, ProductsResponse, ProductFilters } from '@/types';
import { productService } from '@/services/product.service';

export function useProducts(initialFilters?: ProductFilters) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ProductFilters>(initialFilters || {});
  const [totalPages, setTotalPages] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const fetchProducts = useCallback(async (newFilters?: ProductFilters) => {
    setIsLoading(true);
    setError(null);
    try {
      const appliedFilters = newFilters || filters;
      const data: ProductsResponse = await productService.getAll(appliedFilters);
      setProducts(data.products);
      setTotalPages(data.totalPages);
      setTotalProducts(data.totalProducts);
      setCurrentPage(data.currentPage);
      setHasMore(data.hasMore);
    } catch {
      setError('Failed to fetch products.');
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading) return;
    setIsLoading(true);
    try {
      const data = await productService.getAll({ ...filters, page: currentPage + 1 });
      setProducts((prev) => [...prev, ...data.products]);
      setCurrentPage(data.currentPage);
      setHasMore(data.hasMore);
    } catch {
      setError('Failed to load more products.');
    } finally {
      setIsLoading(false);
    }
  }, [filters, currentPage, hasMore, isLoading]);

  const updateFilters = useCallback((newFilters: Partial<ProductFilters>) => {
    const updated = { ...filters, ...newFilters, page: 1 };
    setFilters(updated);
    fetchProducts(updated);
  }, [filters, fetchProducts]);

  const goToPage = useCallback((page: number) => {
    const updated = { ...filters, page };
    setFilters(updated);
    fetchProducts(updated);
  }, [filters, fetchProducts]);

  useEffect(() => {
    fetchProducts();
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
