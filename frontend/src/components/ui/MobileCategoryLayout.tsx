'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';

import type { Category, Product } from '@/types';
import { categoryService } from '@/services/category.service';
import { brandService, type Brand } from '@/services/brand.service';
import { productService } from '@/services/product.service';

import ListingProductCard from '@/components/ui/ListingProductCard';
import { safeImageSrc } from '@/lib/utils';
import { ProductGridSkeleton } from '@/components/ui/Skeletons';

type ViewState = 'categories' | 'brands' | 'products';

const PLACEHOLDER_CATEGORY = '/images/no-category.svg';
const PLACEHOLDER_BRAND = '/images/no-category.svg';

export default function MobileCategoryLayout() {
  const router = useRouter();

  // State
  const [view, setView] = useState<ViewState>('categories');
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [activeBrand, setActiveBrand] = useState<Brand | null>(null);

  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isLoadingBrands, setIsLoadingBrands] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  // Fetch Categories
  useEffect(() => {
    categoryService.getAll().then((cats) => {
      const validCats = cats.filter((c) => !c.name?.startsWith('PW-Cat-') && !c.slug?.startsWith('pw-cat-'));
      setCategories(validCats);
    }).catch(console.error)
      .finally(() => setIsLoadingCategories(false));
  }, []);

  // Fetch Brands when moving to brands view
  const handleSelectCategory = useCallback(async (cat: Category) => {
    setActiveCategory(cat);
    setView('brands');
    if (brands.length === 0) {
      setIsLoadingBrands(true);
      try {
        const data = await brandService.getAll();
        setBrands(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoadingBrands(false);
      }
    }
  }, [brands.length]);

  // Fetch Products when moving to products view
  const handleSelectBrand = useCallback(async (brand: Brand) => {
    if (!activeCategory) return;
    setActiveBrand(brand);
    setView('products');
    setIsLoadingProducts(true);
    setProducts([]);
    try {
      const data = await productService.getAll({
        category: activeCategory.slug,
        brand: [brand.name],
        limit: 50
      });
      setProducts(data.products || []);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingProducts(false);
    }
  }, [activeCategory]);

  const handleBack = () => {
    if (view === 'products') setView('brands');
    else if (view === 'brands') setView('categories');
    else router.push('/');
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-[#121212] pb-24 pt-20 px-4 lg:hidden">
      
      {/* Header Area */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-white/90 dark:bg-[#121212]/90 backdrop-blur-md border-b border-gray-200 dark:border-white/10 px-4 h-[68px] flex items-center shadow-sm">
        <button 
          onClick={handleBack}
          className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
        >
          <ChevronLeft className="h-6 w-6 text-gray-700 dark:text-gray-300" />
        </button>
        <h1 className="text-lg font-bold text-gray-900 dark:text-white ml-2">
          {view === 'categories' && 'Categories'}
          {view === 'brands' && activeCategory?.name}
          {view === 'products' && `${activeBrand?.name} ${activeCategory?.name}`}
        </h1>
      </div>

      {/* Main Content Area with Animations */}
      <div className="w-full relative mt-2 animate-in fade-in slide-in-from-bottom-4 duration-300">
        
        {/* Categories View */}
        {view === 'categories' && (
          <div className="grid grid-cols-2 gap-4">
            {isLoadingCategories ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white dark:bg-[#1a1a1a] rounded-[16px] h-32 animate-pulse" />
              ))
            ) : (
              categories.map((cat, idx) => {
                const colors = [
                  'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
                  'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
                  'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400',
                  'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
                  'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
                  'bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400'
                ];
                const colorClass = colors[idx % colors.length];
                
                return (
                  <button
                    key={cat._id}
                    onClick={() => handleSelectCategory(cat)}
                    className="flex flex-col items-center justify-center gap-3 p-4 bg-white dark:bg-[#1a1a1a] rounded-[16px] shadow-[0_4px_20px_rgba(0,0,0,0.04)] dark:shadow-none border border-gray-100 dark:border-white/5 active:scale-95 transition-all duration-200"
                  >
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center ${colorClass}`}>
                      {cat.image ? (
                         <div className="relative w-8 h-8">
                           <Image 
                             src={safeImageSrc(cat.image, PLACEHOLDER_CATEGORY)} 
                             alt={cat.name} 
                             fill 
                             className="object-contain" 
                           />
                         </div>
                      ) : (
                        <span className="text-xl font-bold">{cat.name.charAt(0)}</span>
                      )}
                    </div>
                    <span className="text-[14px] font-semibold text-gray-900 dark:text-white text-center line-clamp-2">
                      {cat.name}
                    </span>
                  </button>
                )
              })
            )}
          </div>
        )}

        {/* Brands View */}
        {view === 'brands' && (
          <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-right-8 duration-300">
            {isLoadingBrands ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white dark:bg-[#1a1a1a] rounded-[16px] h-24 animate-pulse" />
              ))
            ) : (
              brands.map((brand) => (
                <button
                  key={brand.id}
                  onClick={() => handleSelectBrand(brand)}
                  className="flex flex-col items-center justify-center gap-2 p-4 bg-white dark:bg-[#1a1a1a] rounded-[16px] shadow-[0_4px_20px_rgba(0,0,0,0.04)] dark:shadow-none border border-gray-100 dark:border-white/5 active:scale-95 transition-all duration-200"
                >
                  <div className="relative w-12 h-12">
                    <Image 
                      src={safeImageSrc(brand.logo_url || brand.image_url, PLACEHOLDER_BRAND)} 
                      alt={brand.name} 
                      fill 
                      className="object-contain p-1" 
                      sizes="48px"
                    />
                  </div>
                  <span className="text-[13px] font-medium text-gray-700 dark:text-gray-300">
                    {brand.name}
                  </span>
                </button>
              ))
            )}
          </div>
        )}

        {/* Products View */}
        {view === 'products' && (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 animate-in slide-in-from-right-8 duration-300">
            {isLoadingProducts ? (
              <ProductGridSkeleton count={4} />
            ) : products.length > 0 ? (
              products.map((product) => (
                <ListingProductCard key={product._id} product={product} />
              ))
            ) : (
              <div className="col-span-2 py-12 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-4">
                  <span className="text-gray-400">?</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">No products found</h3>
                <p className="text-gray-500 mt-1 text-[14px]">There are currently no {activeBrand?.name} products in this category.</p>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
