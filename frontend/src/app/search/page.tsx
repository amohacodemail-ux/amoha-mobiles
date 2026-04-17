'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useProducts } from '@/hooks/useProducts';
import ProductCard from '@/components/ui/ProductCard';
import Pagination from '@/components/ui/Pagination';
import { ProductGridSkeleton } from '@/components/ui/Skeletons';
import Link from 'next/link';

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const {
    products,
    isLoading,
    totalProducts,
    totalPages,
    currentPage,
    goToPage,
    fetchProducts,
  } = useProducts({ search: query });

  useEffect(() => {
    if (query) fetchProducts({ search: query, page: 1 });
  }, [query, fetchProducts]);

  return (
    <div className="page-container py-6 sm:py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
          Search Results
        </h1>
        {query && (
          <p className="mt-1 text-sm text-gray-500">
            {isLoading
              ? 'Searching...'
              : `${totalProducts} result${totalProducts !== 1 ? 's' : ''} for "${query}"`}
          </p>
        )}
      </div>

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
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">No results found</h3>
          <p className="mt-1 max-w-md text-sm text-gray-500">
            We couldn&apos;t find any mobiles matching &quot;{query}&quot;. Try different keywords.
          </p>
          <Link
            href="/products"
            className="mt-6 rounded-xl bg-primary-600 px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-primary-500"
          >
            Browse All Mobiles
          </Link>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="page-container py-10"><ProductGridSkeleton /></div>}>
      <SearchContent />
    </Suspense>
  );
}
