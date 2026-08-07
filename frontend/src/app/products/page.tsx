'use client';

import { useState, useEffect, useCallback, useTransition, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { HiOutlineChevronRight, HiOutlineViewGrid, HiOutlineSearch, HiOutlineAdjustments } from 'react-icons/hi';
import type { Product, Category, ProductFilters } from '@/types';
import { productService } from '@/services/product.service';
import { categoryService } from '@/services/category.service';
import ListingProductCard from '@/components/ui/ListingProductCard';
import FilterSidebar from '@/components/ui/FilterSidebar';
import Pagination from '@/components/ui/Pagination';
import { ProductGridSkeleton } from '@/components/ui/Skeletons';
import { safeImageSrc } from '@/lib/utils';

const PLACEHOLDER_CATEGORY = '/images/no-category.svg';

const sortOptions = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price_low', label: 'Price: Low to High' },
  { value: 'price_high', label: 'Price: High to Low' },
  { value: 'popular', label: 'Popularity' },
  { value: 'rating', label: 'Highest Rated' },
];

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
  const [gridCols, setGridCols] = useState<3 | 4>(4);
  const [isPending, startTransition] = useTransition();
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

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
    const inStock = searchParams.get('inStock');
    const condition = searchParams.get('condition');
    const discount = searchParams.get('discount');
    if (inStock === 'true') filters.inStock = true;
    if (condition) filters.condition = condition;
    if (discount) filters.discount = Number(discount);

    return filters;
  }, [searchParams]);

  const [filters, setFilters] = useState<ProductFilters>(() => buildFiltersFromParams());
  const [activeCategory, setActiveCategory] = useState<string | null>(
    searchParams.get('category') || null
  );
  const [searchInput, setSearchInput] = useState(filters.search || '');

  useEffect(() => {
    setSearchInput(filters.search || '');
  }, [filters.search]);

  useEffect(() => {
    categoryService.getAll().then((cats) => {
      setCategories(cats.filter((c) => !c.name?.startsWith('PW-Cat-') && !c.slug?.startsWith('pw-cat-')));
    }).catch(() => { });
  }, []);

  const fetchProducts = useCallback(async (newFilters?: ProductFilters) => {
    setIsProductsLoading(true);
    try {
      const appliedFilters = newFilters || filters;
      const data = await productService.getAll({ ...appliedFilters, limit: 12 });
      const seen = new Set<string>();
      const deduped = (data.products || []).filter((p) => {
        if (seen.has(p._id)) return false;
        seen.add(p._id);
        return true;
      });
      setProducts(deduped);
      setTotalPages(data.totalPages);
      setTotalProducts(data.totalProducts);
      setCurrentPage(data.currentPage);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setIsProductsLoading(false);
    }
  }, [filters]);

  const isSelfUpdate = useRef(false);

  useEffect(() => {
    if (isSelfUpdate.current) {
      isSelfUpdate.current = false;
      return;
    }
    const initialFilters = buildFiltersFromParams();
    setFilters(initialFilters);
    setActiveCategory(initialFilters.category || null);
    setIsLoading(true);
    productService.getAll({ ...initialFilters, limit: 12 }).then((data) => {
      const seen = new Set<string>();
      setProducts((data.products || []).filter((p) => {
        if (seen.has(p._id)) return false;
        seen.add(p._id);
        return true;
      }));
      setTotalPages(data.totalPages);
      setTotalProducts(data.totalProducts);
      setCurrentPage(data.currentPage);
    }).catch(() => { }).finally(() => setIsLoading(false));
  }, [searchParams]);

  const syncFiltersToURL = useCallback((newFilters: ProductFilters) => {
    isSelfUpdate.current = true;
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
    if (newFilters.inStock) params.set('inStock', 'true');
    if (newFilters.condition) params.set('condition', newFilters.condition);
    if (newFilters.discount) params.set('discount', String(newFilters.discount));

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
      setSearchInput('');
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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleFilterChange({ search: searchInput || undefined });
  };

  const activeCategoryName = activeCategory
    ? categories.find((c) => c.slug === activeCategory)?.name || activeCategory
    : null;

  return (
    <div className="min-h-screen bg-surface">
      {/* ===== Breadcrumb ===== */}
      <div className="border-b border-border-light bg-white">
        <div className="page-container flex items-center gap-2 py-3 text-xs">
          <Link href="/" className="text-gray-500 transition-colors hover:text-primary-600">Home</Link>
          <HiOutlineChevronRight className="h-3 w-3 text-gray-400" />
          {activeCategoryName ? (
            <>
              <Link href="/products" className="text-gray-500 transition-colors hover:text-primary-600">All Mobiles</Link>
              <HiOutlineChevronRight className="h-3 w-3 text-gray-400" />
              <span className="font-medium text-gray-900">{activeCategoryName}</span>
            </>
          ) : filters.sort === 'popular' ? (
            <span className="font-medium text-gray-900">Featured</span>
          ) : filters.sort === 'newest' ? (
            <span className="font-medium text-gray-900">New Arrivals</span>
          ) : (
            <span className="font-medium text-gray-900">All Mobiles</span>
          )}
        </div>
      </div>

      <div className="page-container py-6 sm:py-8 lg:py-10">
        
        {/* ===== Page Header ===== */}
        <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              {activeCategoryName ? (
                <>{activeCategoryName}</>
              ) : filters.search ? (
                <>Results for &quot;<span className="text-primary-600">{filters.search}</span>&quot;</>
              ) : filters.sort === 'popular' ? (
                <>Featured <span className="text-primary-600">Mobiles</span></>
              ) : filters.sort === 'newest' ? (
                <>New <span className="text-primary-600">Arrivals</span></>
              ) : (
                <>All <span className="text-primary-600">Mobiles</span></>
              )}
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              {isLoading ? (
                <span className="inline-block h-4 w-28 animate-pulse rounded bg-gray-200" />
              ) : (
                <>
                  Showing <span className="font-medium text-gray-900">{totalProducts}</span> premium products
                  {activeCategoryName && <> in <span className="font-medium text-gray-900">{activeCategoryName}</span></>}
                </>
              )}
            </p>
          </div>

          <div className="flex w-full lg:w-auto items-center gap-3">
            <form onSubmit={handleSearchSubmit} className="relative w-full lg:w-80">
              <input
                type="text"
                placeholder="Search premium mobiles..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full rounded-full border border-border-light bg-white px-4 py-2.5 pl-10 text-sm shadow-sm transition-all focus:border-primary-400 focus:outline-none focus:ring-4 focus:ring-primary-500/10"
              />
              <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            </form>
          </div>
        </div>

        {/* ===== Category Chips ===== */}
        {categories.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide md:scrollbar-thin-desktop">
              <button
                onClick={() => handleCategoryFilter(null)}
                className={`flex flex-shrink-0 items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-300 ${!activeCategory
                  ? 'bg-gradient-primary text-white shadow-md shadow-primary-500/30'
                  : 'border border-border-light bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900 shadow-sm'
                  }`}
              >
                All Brands
              </button>
              {categories.map((cat) => (
                <button
                  key={cat._id}
                  onClick={() => handleCategoryFilter(cat.slug)}
                  className={`flex flex-shrink-0 items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-300 ${activeCategory === cat.slug
                    ? 'bg-gradient-primary text-white shadow-md shadow-primary-500/30'
                    : 'border border-border-light bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900 shadow-sm'
                    }`}
                >
                  <div className="relative h-5 w-5 overflow-hidden rounded-full ring-1 ring-black/5 bg-white">
                    <Image
                      src={safeImageSrc(cat.image, PLACEHOLDER_CATEGORY)}
                      alt={cat.name}
                      fill
                      className="object-contain p-0.5"
                      sizes="20px"
                      onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER_CATEGORY; }}
                    />
                  </div>
                  <span className="whitespace-nowrap">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ===== Main Content Area ===== */}
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Vertical Filter Sidebar */}
          <FilterSidebar 
            filters={filters} 
            onFilterChange={handleFilterChange} 
            onClear={handleClearFilters} 
            isOpen={isMobileFilterOpen}
            onClose={() => setIsMobileFilterOpen(false)}
          />

          <div className="flex-1 min-w-0">
            {/* Product Toolbar */}
            <div className="mb-6 flex items-center justify-between rounded-2xl border border-border-light bg-white px-4 py-3 shadow-sm">
              <button
                className="lg:hidden flex items-center gap-2 text-sm font-medium text-gray-700"
                onClick={() => setIsMobileFilterOpen(true)}
              >
                <HiOutlineAdjustments className="h-5 w-5" />
                Filters
              </button>
              
              <div className="hidden lg:block text-sm font-medium text-gray-500">
                Displaying {products.length} products
              </div>

              <div className="flex items-center gap-4 ml-auto lg:ml-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 hidden sm:inline">Sort by:</span>
                  <select 
                    value={filters.sort || 'newest'}
                    onChange={(e) => handleFilterChange({ sort: e.target.value })}
                    className="rounded-lg border border-border-light bg-surface-50 px-3 py-1.5 text-sm font-medium text-gray-900 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400 cursor-pointer"
                  >
                    {sortOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div className="hidden items-center gap-1 border-l border-border-light pl-4 lg:flex">
                  <button
                    onClick={() => setGridCols(3)}
                    className={`rounded-lg p-1.5 transition-all ${gridCols === 3 ? 'bg-primary-50 text-primary-600' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-50'}`}
                    title="3 columns"
                  >
                    <HiOutlineViewGrid className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setGridCols(4)}
                    className={`rounded-lg p-1.5 transition-all ${gridCols === 4 ? 'bg-primary-50 text-primary-600' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-50'}`}
                    title="4 columns"
                  >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 16 16">
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

            {/* Products Grid */}
            {isLoading || isProductsLoading || isPending ? (
              <ProductGridSkeleton count={12} />
            ) : products.length > 0 ? (
              <>
                <div className={`grid grid-cols-2 gap-4 sm:gap-6 ${gridCols === 4 ? 'md:grid-cols-3 xl:grid-cols-4' : 'md:grid-cols-2 xl:grid-cols-3'}`}>
                  {products.map((product, index) => (
                    <div
                      key={product._id}
                      className="animate-fade-in-up"
                      style={{ animationDelay: `${index * 40}ms`, animationFillMode: 'both' }}
                    >
                      <ListingProductCard product={product} />
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-12 flex flex-col items-center gap-4">
                    <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
                    <p className="text-sm font-medium text-gray-500">
                      Page {currentPage} of {totalPages}
                    </p>
                  </div>
                )}
              </>
            ) : (
              /* Empty State */
              <div className="flex flex-col items-center justify-center rounded-3xl border border-border-light bg-white py-24 text-center shadow-sm">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-surface-50 text-gray-300 mb-6 shadow-inner">
                  <HiOutlineViewGrid className="h-10 w-10" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">No products found</h3>
                <p className="mt-2 max-w-md text-base text-gray-500">
                  {filters.search
                    ? `We couldn't find results for "${filters.search}". Try a different search term.`
                    : 'Try adjusting your filters or browse a different category to discover products.'}
                </p>
                <div className="mt-8 flex gap-4">
                  <button
                    onClick={handleClearFilters}
                    className="rounded-full bg-primary-600 px-8 py-3 text-sm font-bold text-white shadow-lg shadow-primary-600/30 transition-all hover:bg-primary-700 hover:shadow-xl hover:-translate-y-0.5"
                  >
                    Clear Filters
                  </button>
                  <Link
                    href="/"
                    className="rounded-full border border-gray-200 bg-white px-8 py-3 text-sm font-bold text-gray-700 transition-all hover:bg-gray-50 hover:shadow-sm"
                  >
                    Go Home
                  </Link>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
