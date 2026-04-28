'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { HiOutlineChevronRight, HiOutlineViewGrid } from 'react-icons/hi';
import type { Category, Product, ProductFilters } from '@/types';
import { categoryService } from '@/services/category.service';
import { productService } from '@/services/product.service';
import ProductCard from '@/components/ui/ProductCard';
import FilterSidebar from '@/components/ui/FilterSidebar';
import Pagination from '@/components/ui/Pagination';
import { ProductGridSkeleton } from '@/components/ui/Skeletons';

const LIMIT = 12;

/** Deduplicate products by _id. */
function dedupeProducts(products: Product[]): Product[] {
  const seen = new Set<string>();
  return products.filter((p) => {
    if (seen.has(p._id)) return false;
    seen.add(p._id);
    return true;
  });
}

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<ProductFilters>({ page: 1, limit: LIMIT });
  const filtersRef = useRef<ProductFilters>({ page: 1, limit: LIMIT });

  const fetchProducts = useCallback(async (extraFilters?: ProductFilters) => {
    if (!slug) return;
    setIsLoading(true);
    try {
      const appliedFilters = extraFilters ?? filtersRef.current;
      const data = await productService.getByCategory(slug, appliedFilters);
      setProducts(dedupeProducts(data.products));
      setTotalPages(data.totalPages);
      setTotalProducts(data.totalProducts);
      setCurrentPage(data.currentPage);
    } catch {
      // silently ignore
    } finally {
      setIsLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    if (!slug) return;
    categoryService.getBySlug(slug).then(setCategory).catch(() => {});
    filtersRef.current = { page: 1, limit: LIMIT };
    setFilters({ page: 1, limit: LIMIT });
    fetchProducts({ page: 1, limit: LIMIT });
  }, [slug, fetchProducts]);

  const updateFilters = (newFilters: Partial<ProductFilters>) => {
    const updated = { ...filtersRef.current, ...newFilters, page: 1 };
    filtersRef.current = updated;
    setFilters(updated);
    fetchProducts(updated);
  };

  const goToPage = (page: number) => {
    const updated = { ...filtersRef.current, page };
    filtersRef.current = updated;
    setFilters(updated);
    fetchProducts(updated);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClearFilters = () => {
    const cleared: ProductFilters = { page: 1, limit: LIMIT };
    filtersRef.current = cleared;
    setFilters(cleared);
    fetchProducts(cleared);
  };

  return (
    <div className="min-h-screen">
      {/* Breadcrumb */}
      <div className="border-b border-gray-200 dark:border-white/5 bg-surface-50/50">
        <div className="page-container flex items-center gap-2 py-3 text-xs text-gray-500">
          <Link href="/" className="hover:text-primary-400">Home</Link>
          <HiOutlineChevronRight className="h-3 w-3" />
          <Link href="/products" className="hover:text-primary-400">All Mobiles</Link>
          <HiOutlineChevronRight className="h-3 w-3" />
          <span className="text-gray-500 dark:text-gray-400">{category?.name || slug}</span>
        </div>
      </div>

      <div className="page-container py-6 sm:py-10">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
              {category?.name || 'Category'}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {category?.description || `${totalProducts} product${totalProducts !== 1 ? 's' : ''} found`}
            </p>
          </div>
        </div>

        {/* Horizontal Filter Bar */}
        <FilterSidebar filters={filters} onFilterChange={updateFilters} onClear={handleClearFilters} />

        {/* Products Grid */}
        <div className="mt-6">
            {isLoading ? (
              <ProductGridSkeleton count={LIMIT} />
            ) : products.length > 0 ? (
              <>
                <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
                  {products.map((product) => (
                    <ProductCard key={product._id} product={product} />
                  ))}
                </div>
                <div className="mt-8">
                  <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={goToPage} />
                </div>
              </>
            ) : (
              <div className="glass-card flex flex-col items-center justify-center py-20 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 dark:bg-white/5">
                  <HiOutlineViewGrid className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">No products in this category</h3>
                <p className="mt-1 text-sm text-gray-500">Check back later or browse other categories.</p>
                <Link href="/products" className="mt-4 rounded-xl bg-primary-600 px-6 py-2.5 text-sm font-semibold text-white">
                  Browse All
                </Link>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
