'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Categories page redirects to the products page
export default function CategoriesPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/products');
  }, [router]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
    </div>
  );
}
