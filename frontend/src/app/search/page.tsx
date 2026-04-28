'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ProductGridSkeleton } from '@/components/ui/Skeletons';

function SearchRedirect() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const rawQuery = searchParams.get('q') || '';
  const query = rawQuery.trim().replace(/\s+/g, ' ');

  useEffect(() => {
    if (query) {
      router.replace(`/products?search=${encodeURIComponent(query)}`);
    } else {
      router.replace('/products');
    }
  }, [query, router]);

  return (
    <div className="page-container py-10">
      <ProductGridSkeleton count={8} />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="page-container py-10"><ProductGridSkeleton /></div>}>
      <SearchRedirect />
    </Suspense>
  );
}
