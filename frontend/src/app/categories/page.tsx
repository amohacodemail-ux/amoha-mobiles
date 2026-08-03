'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MobileCategoryLayout from '@/components/ui/MobileCategoryLayout';

export default function CategoriesPage() {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Initial check
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isMobile === false) {
      router.replace('/products');
    }
  }, [isMobile, router]);

  // Loading state while checking screen size
  if (isMobile === null) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#5264F9] border-t-transparent" />
      </div>
    );
  }

  // If not mobile, we are redirecting to products page
  if (isMobile === false) {
    return null;
  }

  // Render the dedicated mobile category two-panel layout
  return <MobileCategoryLayout />;
}
