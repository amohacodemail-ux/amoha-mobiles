'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { HiOutlineChevronRight, HiOutlineViewGrid } from 'react-icons/hi';
import type { Category } from '@/types';
import { categoryService } from '@/services/category.service';
import { useProducts } from '@/hooks/useProducts';
import ProductCard from '@/components/ui/ProductCard';
import FilterSidebar from '@/components/ui/FilterSidebar';
import Pagination from '@/components/ui/Pagination';
import { ProductGridSkeleton } from '@/components/ui/Skeletons';

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const [category, setCategory] = useState<Category | null>(null);
  const {
    products, isLoading, filters, totalPages, totalProducts,
    currentPage, updateFilters, goToPage, setFilters, fetchProducts,
  } = useProducts({ category: slug });

  useEffect(() => {
    if (!slug) return;
    categoryService.getBySlug(slug).then(setCategory).catch(() => {});
  }, [slug]);

  const handleClearFilters = () => {
    const cleared = { category: slug, page: 1 };
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
          <Link href="/products" className="hover:text-primary-400">Products</Link>
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
              {category?.description || `${totalProducts} products found`}
            </p>
          </div>
        </div>

        {/* Horizontal Filter Bar */}
        <FilterSidebar filters={filters} onFilterChange={updateFilters} onClear={handleClearFilters} />

        {/* Products Grid */}
        <div className="mt-6">
            {isLoading ? (
              <ProductGridSkeleton count={8} />
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
