'use client';

import { useState, useEffect, useCallback, useTransition } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { HiOutlineChevronRight, HiOutlineViewGrid, HiOutlineX, HiChevronDown } from 'react-icons/hi';
import type { Product, Category, ProductFilters } from '@/types';
import { productService } from '@/services/product.service';
import { categoryService } from '@/services/category.service';
import ProductCard from '@/components/ui/ProductCard';
import FilterSidebar from '@/components/ui/FilterSidebar';
import Pagination from '@/components/ui/Pagination';
import { ProductGridSkeleton } from '@/components/ui/Skeletons';
import { safeImageSrc } from '@/lib/utils';

const PLACEHOLDER_CATEGORY = '/images/no-category.svg';

const sortLabels: Record<string, string> = {
  newest: 'Newest First',
  price_low: 'Price: Low to High',
  price_high: 'Price: High to Low',
  popular: 'Popularity',
  rating: 'Highest Rated',
};

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProductsLoading, setIsProductsLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [gridCols, setGridCols] = useState<3 | 4>(3);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Build initial filters from URL search params
  const buildFiltersFromParams = useCallback((): ProductFilters => {
    const filters: ProductFilters = {};
    const category = searchParams.get('category');
    const sort = searchParams.get('sort');
    const brand = searchParams.get('brand');
    const ram = searchParams.get('ram');
    const storage = searchParams.get('storage');
    const battery = searchParams.get('battery');
    const priceMin = searchParams.get('priceMin');
    const priceMax = searchParams.get('priceMax');
    const rating = searchParams.get('rating');
    const page = searchParams.get('page');
    const search = searchParams.get('search');

    if (category) filters.category = category;
    if (sort) filters.sort = sort;
    if (brand) filters.brand = brand.split(',');
    if (ram) filters.ram = ram.split(',');
    if (storage) filters.storage = storage.split(',');
    if (battery) filters.battery = battery.split(',');
    if (priceMin) filters.priceMin = Number(priceMin);
    if (priceMax) filters.priceMax = Number(priceMax);
    if (rating) filters.rating = Number(rating);
    if (page) filters.page = Number(page);
    if (search) filters.search = search;

    return filters;
  }, [searchParams]);

  const [filters, setFilters] = useState<ProductFilters>(() => buildFiltersFromParams());
  const [activeCategory, setActiveCategory] = useState<string | null>(
    searchParams.get('category') || null
  );

  // Fetch categories on mount
  useEffect(() => {
    categoryService.getAll().then(setCategories).catch(() => {});
  }, []);

  // Fetch products
  const fetchProducts = useCallback(async (newFilters?: ProductFilters) => {
    setIsProductsLoading(true);
    try {
      const appliedFilters = newFilters || filters;
      const data = await productService.getAll({ ...appliedFilters, limit: 12 });
      setProducts(data.products);
      setTotalPages(data.totalPages);
      setTotalProducts(data.totalProducts);
      setCurrentPage(data.currentPage);
    } finally {
      setIsProductsLoading(false);
    }
  }, [filters]);

  // Initial load
  useEffect(() => {
    const initialFilters = buildFiltersFromParams();
    setFilters(initialFilters);
    setActiveCategory(initialFilters.category || null);
    setIsLoading(true);
    productService.getAll({ ...initialFilters, limit: 12 }).then((data) => {
      setProducts(data.products);
      setTotalPages(data.totalPages);
      setTotalProducts(data.totalProducts);
      setCurrentPage(data.currentPage);
    }).catch(() => {}).finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync filters to URL
  const syncFiltersToURL = useCallback((newFilters: ProductFilters) => {
    const params = new URLSearchParams();
    if (newFilters.category) params.set('category', newFilters.category);
    if (newFilters.sort) params.set('sort', newFilters.sort);
    if (newFilters.brand?.length) params.set('brand', newFilters.brand.join(','));
    if (newFilters.ram?.length) params.set('ram', newFilters.ram.join(','));
    if (newFilters.storage?.length) params.set('storage', newFilters.storage.join(','));
    if (newFilters.battery?.length) params.set('battery', newFilters.battery.join(','));
    if (newFilters.priceMin) params.set('priceMin', String(newFilters.priceMin));
    if (newFilters.priceMax) params.set('priceMax', String(newFilters.priceMax));
    if (newFilters.rating) params.set('rating', String(newFilters.rating));
    if (newFilters.page && newFilters.page > 1) params.set('page', String(newFilters.page));
    if (newFilters.search) params.set('search', newFilters.search);

    const qs = params.toString();
    router.replace(qs ? `/products?${qs}` : '/products', { scroll: false });
  }, [router]);

  const handleCategoryFilter = (categorySlug: string | null) => {
    startTransition(() => {
      setActiveCategory(categorySlug);
      const newFilters: ProductFilters = { ...filters, category: categorySlug || undefined, page: 1 };
      setFilters(newFilters);
      syncFiltersToURL(newFilters);
      fetchProducts(newFilters);
    });
  };

  const handleFilterChange = (newFilters: Partial<ProductFilters>) => {
    startTransition(() => {
      const updated = { ...filters, ...newFilters, page: 1 };
      setFilters(updated);
      syncFiltersToURL(updated);
      fetchProducts(updated);
    });
  };

  const handleClearFilters = () => {
    startTransition(() => {
      setActiveCategory(null);
      const cleared: ProductFilters = { page: 1 };
      setFilters(cleared);
      syncFiltersToURL(cleared);
      fetchProducts(cleared);
    });
  };

  const handlePageChange = (page: number) => {
    startTransition(() => {
      const updated = { ...filters, page };
      setFilters(updated);
      syncFiltersToURL(updated);
      fetchProducts(updated);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  };

  const handleSortChange = (sortValue: string) => {
    handleFilterChange({ sort: sortValue });
    setShowSortDropdown(false);
  };

  const activeCategoryName = activeCategory
    ? categories.find((c) => c.slug === activeCategory)?.name || activeCategory
    : null;

  // Build active filter tags for display
  const activeFilterTags: { label: string; onRemove: () => void }[] = [];
  if (filters.brand?.length) {
    filters.brand.forEach((b) =>
      activeFilterTags.push({
        label: b,
        onRemove: () => handleFilterChange({ brand: filters.brand?.filter((x) => x !== b) }),
      })
    );
  }
  if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
    const label = `₹${(filters.priceMin || 0).toLocaleString()} – ₹${(filters.priceMax || 200000).toLocaleString()}`;
    activeFilterTags.push({
      label: `Price: ${label}`,
      onRemove: () => handleFilterChange({ priceMin: undefined, priceMax: undefined }),
    });
  }
  if (filters.rating !== undefined) {
    activeFilterTags.push({
      label: `${filters.rating}★ & above`,
      onRemove: () => handleFilterChange({ rating: undefined }),
    });
  }
  if (filters.ram?.length) {
    filters.ram.forEach((r) =>
      activeFilterTags.push({
        label: `RAM: ${r}`,
        onRemove: () => handleFilterChange({ ram: filters.ram?.filter((x) => x !== r) }),
      })
    );
  }
  if (filters.storage?.length) {
    filters.storage.forEach((s) =>
      activeFilterTags.push({
        label: `Storage: ${s}`,
        onRemove: () => handleFilterChange({ storage: filters.storage?.filter((x) => x !== s) }),
      })
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* ===== Breadcrumb ===== */}
      <div className="border-b border-gray-100 dark:border-white/[0.05]">
        <div className="page-container flex items-center gap-2 py-3 text-xs">
          <Link href="/" className="text-gray-500 transition-colors hover:text-primary-400">Home</Link>
          <HiOutlineChevronRight className="h-3 w-3 text-gray-700" />
          {activeCategoryName ? (
            <>
              <Link href="/products" className="text-gray-500 transition-colors hover:text-primary-400">Products</Link>
              <HiOutlineChevronRight className="h-3 w-3 text-gray-700" />
              <span className="font-medium text-gray-600 dark:text-gray-300">{activeCategoryName}</span>
            </>
          ) : (
            <span className="font-medium text-gray-600 dark:text-gray-300">All Products</span>
          )}
        </div>
      </div>

      {/* ===== Category Chips ===== */}
      {categories.length > 0 && (
        <div className="border-b border-gray-100 dark:border-white/[0.05] bg-gray-50 dark:bg-white/[0.015]">
          <div className="page-container py-4">
            <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-hide md:scrollbar-thin-desktop">
              <button
                onClick={() => handleCategoryFilter(null)}
                className={`flex flex-shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
                  !activeCategory
                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/25'
                    : 'border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.04] text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-white/20 hover:bg-white/[0.08] hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat._id}
                  onClick={() => handleCategoryFilter(cat.slug)}
                  className={`flex flex-shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
                    activeCategory === cat.slug
                      ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/25'
                      : 'border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.04] text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-white/20 hover:bg-white/[0.08] hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <div className="relative h-5 w-5 overflow-hidden rounded-full ring-1 ring-white/10">
                    <Image
                      src={safeImageSrc(cat.image, PLACEHOLDER_CATEGORY)}
                      alt={cat.name}
                      fill
                      className="object-cover"
                      sizes="20px"
                      onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER_CATEGORY; }}
                    />
                  </div>
                  <span className="whitespace-nowrap">{cat.name}</span>
                  {cat.productCount > 0 && (
                    <span className="rounded-full bg-gray-200 dark:bg-white/10 px-1.5 py-0.5 text-[11px] font-semibold">
                      {cat.productCount}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="page-container py-6 sm:py-8 lg:py-10">
        {/* ===== Page Header ===== */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between lg:mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl lg:text-4xl">
              {activeCategoryName ? (
                <>{activeCategoryName}</>
              ) : filters.search ? (
                <>Results for &quot;<span className="gradient-text">{filters.search}</span>&quot;</>
              ) : (
                <>All <span className="gradient-text">Products</span></>
              )}
            </h1>
            <p className="mt-1.5 text-sm text-gray-500">
              {isLoading ? (
                <span className="inline-block h-4 w-28 animate-pulse rounded bg-gray-200 dark:bg-white/10" />
              ) : (
                <>
                  Showing <span className="font-medium text-gray-600 dark:text-gray-300">{totalProducts}</span> product{totalProducts !== 1 ? 's' : ''}
                  {activeCategoryName && <> in <span className="font-medium text-gray-600 dark:text-gray-300">{activeCategoryName}</span></>}
                </>
              )}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Grid toggle – desktop only */}
            <div className="hidden items-center gap-0.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.04] p-1 lg:flex">
              <button
                onClick={() => setGridCols(3)}
                className={`rounded-lg p-2 transition-all ${gridCols === 3 ? 'bg-primary-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
                title="3 columns"
              >
                <HiOutlineViewGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setGridCols(4)}
                className={`rounded-lg p-2 transition-all ${gridCols === 4 ? 'bg-primary-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
                title="4 columns"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 16 16">
                  <rect x="0" y="0" width="3" height="3" rx="0.5" />
                  <rect x="4.33" y="0" width="3" height="3" rx="0.5" />
                  <rect x="8.66" y="0" width="3" height="3" rx="0.5" />
                  <rect x="13" y="0" width="3" height="3" rx="0.5" />
                  <rect x="0" y="4.33" width="3" height="3" rx="0.5" />
                  <rect x="4.33" y="4.33" width="3" height="3" rx="0.5" />
                  <rect x="8.66" y="4.33" width="3" height="3" rx="0.5" />
                  <rect x="13" y="4.33" width="3" height="3" rx="0.5" />
                  <rect x="0" y="8.66" width="3" height="3" rx="0.5" />
                  <rect x="4.33" y="8.66" width="3" height="3" rx="0.5" />
                  <rect x="8.66" y="8.66" width="3" height="3" rx="0.5" />
                  <rect x="13" y="8.66" width="3" height="3" rx="0.5" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* ===== Horizontal Filter Bar ===== */}
        <FilterSidebar filters={filters} onFilterChange={handleFilterChange} onClear={handleClearFilters} />

        {/* ===== Products Grid ===== */}
        <div className="min-w-0">
            {isLoading || isProductsLoading || isPending ? (
              <ProductGridSkeleton count={12} />
            ) : products.length > 0 ? (
              <>
                <div className={`grid grid-cols-2 gap-3 sm:gap-5 ${
                  gridCols === 4 ? 'md:grid-cols-3 lg:grid-cols-4' : 'md:grid-cols-2 lg:grid-cols-3'
                }`}>
                  {products.map((product, index) => (
                    <div
                      key={product._id}
                      className="animate-fade-in"
                      style={{ animationDelay: `${index * 30}ms`, animationFillMode: 'both' }}
                    >
                      <ProductCard product={product} />
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-10 flex flex-col items-center gap-3">
                    <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
                    <p className="text-xs text-gray-600">
                      Page {currentPage} of {totalPages}
                    </p>
                  </div>
                )}
              </>
            ) : (
              /* ===== Empty State ===== */
              <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-100 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.02] py-24 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gray-100 dark:bg-white/5">
                  <HiOutlineViewGrid className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="mt-6 text-xl font-bold text-gray-900 dark:text-white">No products found</h3>
                <p className="mt-2 max-w-sm text-sm text-gray-500">
                  {filters.search
                    ? `We couldn't find results for "${filters.search}". Try a different search term.`
                    : 'Try adjusting your filters or browse a different category to discover products.'}
                </p>
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={handleClearFilters}
                    className="rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-primary-600/25 transition-all hover:shadow-xl hover:shadow-primary-600/30"
                  >
                    Clear All Filters
                  </button>
                  <Link
                    href="/"
                    className="rounded-xl border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-white/5 px-6 py-3 text-sm font-medium text-gray-600 dark:text-gray-300 transition-all hover:border-gray-300 dark:hover:border-white/20 hover:bg-gray-200 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white"
                  >
                    Go Home
                  </Link>
                </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}

