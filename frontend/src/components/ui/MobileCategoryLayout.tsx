'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { HiChevronLeft, HiOutlineCollection } from 'react-icons/hi';
import type { Category, Product, ProductFilters } from '@/types';
import { categoryService } from '@/services/category.service';
import { productService } from '@/services/product.service';
import ListingProductCard from '@/components/ui/ListingProductCard';
import { safeImageSrc } from '@/lib/utils';

const PLACEHOLDER_CATEGORY = '/images/no-category.svg';

interface SubcategoryDef {
  id: string;
  name: string;
  image?: string;
  filters: ProductFilters;
}

// Map generic subcategories. We derive these on the frontend to avoid backend changes.
const getSubcategoriesForCategory = (categorySlug: string): SubcategoryDef[] => {
  // We can return dynamic subcategories based on the category slug if needed.
  // For now, returning a solid list for all categories to match the requested design.
  return [
    { id: 'new', name: 'New Devices', filters: { condition: 'new' } },
    { id: 'used', name: 'Used Devices', filters: { condition: 'used' } },
    { id: 'refurbished', name: 'Refurbished', filters: { condition: 'refurbished' } },
    { id: 'premium', name: 'Premium', filters: { priceMin: 50000 } },
    { id: 'budget', name: 'Budget', filters: { priceMax: 15000 } },
    { id: 'all', name: 'View All', filters: {} },
  ];
};

export default function MobileCategoryLayout() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [activeSubcategory, setActiveSubcategory] = useState<SubcategoryDef | null>(null);
  
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  // Fetch Categories
  useEffect(() => {
    categoryService.getAll().then((cats) => {
      const validCats = cats.filter((c) => !c.name?.startsWith('PW-Cat-') && !c.slug?.startsWith('pw-cat-'));
      setCategories(validCats);
      if (validCats.length > 0) {
        setActiveCategory(validCats[0]);
      }
    }).catch(console.error)
      .finally(() => setIsLoadingCategories(false));
  }, []);

  // Fetch Products when a subcategory is tapped
  const handleSubcategorySelect = useCallback(async (subcat: SubcategoryDef) => {
    if (!activeCategory) return;
    setActiveSubcategory(subcat);
    setIsLoadingProducts(true);
    try {
      const data = await productService.getByCategory(activeCategory.slug, { ...subcat.filters, limit: 20 });
      setProducts(data.products || []);
    } catch (error) {
      console.error(error);
      setProducts([]);
    } finally {
      setIsLoadingProducts(false);
    }
  }, [activeCategory]);

  const subcategories = useMemo(() => {
    if (!activeCategory) return [];
    return getSubcategoriesForCategory(activeCategory.slug);
  }, [activeCategory]);

  if (isLoadingCategories) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50 dark:bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#5264F9] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-60px)] w-full overflow-hidden bg-gray-50 dark:bg-background md:hidden">
      {/* Left Panel - Main Categories */}
      <div className="w-[28%] min-w-[85px] max-w-[110px] h-full overflow-y-auto border-r border-gray-200 bg-white dark:border-white/10 dark:bg-surface-100 no-scrollbar pb-24">
        {categories.map((cat) => {
          const isActive = activeCategory?._id === cat._id;
          return (
            <button
              key={cat._id}
              onClick={() => {
                setActiveCategory(cat);
                setActiveSubcategory(null);
                setProducts([]);
              }}
              className={`relative flex w-full flex-col items-center justify-center gap-1.5 p-3 py-4 text-center transition-colors ${
                isActive 
                  ? 'bg-blue-50 dark:bg-[#5264F9]/10' 
                  : 'bg-white hover:bg-gray-50 dark:bg-surface-100 dark:hover:bg-white/5'
              }`}
            >
              {isActive && (
                <div className="absolute left-0 top-0 h-full w-1 rounded-r-md bg-[#5264F9]" />
              )}
              <div className={`relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-full p-2 ${isActive ? 'bg-white shadow-sm dark:bg-surface-200' : 'bg-gray-100 dark:bg-white/5'}`}>
                <Image
                  src={safeImageSrc(cat.image, PLACEHOLDER_CATEGORY)}
                  alt={cat.name}
                  fill
                  className="object-contain p-2"
                  sizes="48px"
                />
              </div>
              <span className={`text-[10px] sm:text-[11px] leading-tight ${isActive ? 'font-bold text-[#5264F9] dark:text-[#5264F9]' : 'font-semibold text-gray-600 dark:text-gray-400'}`}>
                {cat.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* Right Panel - Subcategories & Products */}
      <div className="flex-1 h-full overflow-y-auto bg-[#F9FAFB] dark:bg-background p-3 pb-24">
        {activeSubcategory ? (
          /* Products View inside Right Panel */
          <div className="animate-fade-in-up">
            <div className="mb-4 flex items-center gap-2 sticky top-0 bg-[#F9FAFB]/90 dark:bg-background/90 backdrop-blur-md py-2 z-10">
              <button 
                onClick={() => setActiveSubcategory(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm dark:bg-surface-200 text-gray-700 dark:text-white"
              >
                <HiChevronLeft className="h-5 w-5" />
              </button>
              <h3 className="font-bold text-gray-900 dark:text-white text-sm">{activeSubcategory.name}</h3>
            </div>
            
            {isLoadingProducts ? (
              <div className="flex h-40 items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#5264F9] border-t-transparent" />
              </div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 pb-10">
                {products.map((product) => (
                  <ListingProductCard key={product._id} product={product} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm dark:bg-surface-200">
                  <HiOutlineCollection className="h-6 w-6 text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">No products found</p>
                <p className="mt-1 text-xs text-gray-500">Try a different subcategory</p>
              </div>
            )}
          </div>
        ) : (
          /* Subcategories View inside Right Panel */
          <div className="animate-fade-in-up">
            <h2 className="mb-4 text-sm font-extrabold text-gray-900 dark:text-white ml-1">
              Shop {activeCategory?.name}
            </h2>
            <div className="grid grid-cols-2 gap-3 pb-10">
              {subcategories.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => handleSubcategorySelect(sub)}
                  className="group flex flex-col items-center rounded-[18px] border border-gray-100 bg-white p-4 text-center shadow-sm transition-all hover:border-blue-200 hover:shadow-md dark:border-white/10 dark:bg-surface-50 dark:hover:border-[#5264F9]/30 active:scale-[0.98]"
                >
                  <div className="mb-3 flex h-[50px] w-[50px] items-center justify-center rounded-full bg-blue-50 text-[#5264F9] dark:bg-[#5264F9]/10 dark:text-[#5264F9] transition-transform group-hover:scale-110">
                    <HiOutlineCollection className="h-[22px] w-[22px] stroke-[1.5]" />
                  </div>
                  <span className="text-[11px] font-bold text-gray-800 dark:text-gray-200 leading-tight">
                    {sub.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
