'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { HiOutlineArrowRight, HiOutlineTruck, HiOutlineShieldCheck, HiOutlineRefresh, HiX, HiStar } from 'react-icons/hi';
import { HiOutlineBolt } from 'react-icons/hi2';
import type { Product, Banner, Category, HomepageReview } from '@/types';
import { productService } from '@/services/product.service';
import { categoryService, bannerService } from '@/services/category.service';
import { useCartStore } from '@/store/cart.store';
import { useWishlistStore } from '@/store/wishlist.store';
import { useAuthStore } from '@/store/auth.store';
import { useSettingsStore } from '@/store/settings.store';
import ProductCard from '@/components/ui/ProductCard';
import RecentlyViewed from '@/components/ui/RecentlyViewed';
import { ProductGridSkeleton, BannerSkeleton } from '@/components/ui/Skeletons';
import { safeImageSrc } from '@/lib/utils';

const PLACEHOLDER_BANNER = '/images/no-banner.svg';
const PLACEHOLDER_PRODUCT = '/images/no-product.svg';
const PLACEHOLDER_CATEGORY = '/images/no-category.svg';

const getSafeImage = (src: string | null | undefined, fallback: string) => safeImageSrc(src, fallback);

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [trendingProducts, setTrendingProducts] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [topReviews, setTopReviews] = useState<HomepageReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeBanner, setActiveBanner] = useState(0);
  const [showPopup, setShowPopup] = useState(false);

  const toArray = <T,>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

  const fetchCart = useCartStore((s) => s.fetchCart);
  const fetchWishlist = useWishlistStore((s) => s.fetchWishlist);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const settings = useSettingsStore((s) => s.settings);
  const fetchSettings = useSettingsStore((s) => s.fetchSettings);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [featuredRes, trendingRes, bannersRes, categoriesRes, newArrivalsRes, reviewsRes] = await Promise.allSettled([
          productService.getFeatured(),
          productService.getTrending(),
          bannerService.getAll(),
          categoryService.getAll(),
          productService.getAll({ sort: 'newest', limit: 8 }),
          productService.getTopReviews(8),
        ]);
        if (featuredRes.status === 'fulfilled') setFeaturedProducts(toArray<Product>(featuredRes.value));
        if (trendingRes.status === 'fulfilled') setTrendingProducts(toArray<Product>(trendingRes.value));
        if (bannersRes.status === 'fulfilled') setBanners(toArray<Banner>(bannersRes.value));
        if (categoriesRes.status === 'fulfilled') setCategories(toArray<Category>(categoriesRes.value).filter((c) => !c.name?.startsWith('PW-Cat-') && !c.slug?.startsWith('pw-cat-')));
        if (newArrivalsRes.status === 'fulfilled') setNewArrivals(toArray<Product>(newArrivalsRes.value?.products));
        if (reviewsRes.status === 'fulfilled') setTopReviews(toArray<HomepageReview>(reviewsRes.value));
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
    fetchSettings();
    if (isAuthenticated) {
      fetchCart();
      fetchWishlist();
    }
  }, [fetchCart, fetchWishlist, isAuthenticated]);

  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setActiveBanner((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners.length]);

  // Show popup after 3 seconds if enabled and not dismissed this session
  useEffect(() => {
    if (!settings?.popup?.isActive || !settings.popup.title) return;
    const dismissed = sessionStorage.getItem('popup_dismissed');
    if (dismissed) return;
    const timer = setTimeout(() => setShowPopup(true), 3000);
    return () => clearTimeout(timer);
  }, [settings?.popup?.isActive, settings?.popup?.title]);

  const dismissPopup = () => {
    setShowPopup(false);
    sessionStorage.setItem('popup_dismissed', '1');
  };

  const features = [
    { icon: HiOutlineBolt, title: 'Fast Delivery', desc: 'Within 2-3 days' },
    { icon: HiOutlineShieldCheck, title: 'Warranty', desc: 'Product warranty included' },
    { icon: HiOutlineTruck, title: 'Free Shipping', desc: 'On orders above Rs.999' },
    { icon: HiOutlineRefresh, title: 'Easy Returns', desc: '7 day return policy' },
  ];

  const activeDiscoverBanners = (settings?.discoverBanners || [])
    .filter((b: any) => b.isActive)
    .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
    .slice(0, 4);

  // Build discover items: prefer admin-configured banners, then map to actual categories.
  // Each item is fully independent — no image sharing between tiles.
  const buildDiscoverItems = () => {
    if (activeDiscoverBanners.length >= 4) return activeDiscoverBanners;

    // Build from actual categories — each gets its own image + category-scoped link
    const catItems = categories.slice(0, 4).map((cat) => ({
      title: cat.name,
      image: getSafeImage(cat.image, PLACEHOLDER_CATEGORY),
      link: `/products?category=${cat.slug}`,
    }));

    // Fallback fixed sections — each uses a strictly different image source so tiles
    // never share the same picture. Banner index 0/1/2/3 are tried first; if a given
    // banner slot is empty the corresponding product image is used; as a last resort
    // the PLACEHOLDER_CATEGORY is used (not PLACEHOLDER_BANNER) to keep them visually
    // distinct from each other.
    const fallbackImages = [
      getSafeImage(banners[0]?.image, PLACEHOLDER_BANNER),
      getSafeImage(banners[1]?.image ?? newArrivals[0]?.images?.[0], PLACEHOLDER_CATEGORY),
      getSafeImage(banners[2]?.image ?? featuredProducts[0]?.images?.[0], PLACEHOLDER_PRODUCT),
      getSafeImage(banners[3]?.image ?? trendingProducts[0]?.images?.[0], PLACEHOLDER_CATEGORY),
    ];
    const fallbackItems = [
      { title: 'Latest Launches',   image: fallbackImages[0], link: '/products?sort=newest' },
      { title: 'Trending Deals',    image: fallbackImages[1], link: '/products?sort=popular' },
      { title: 'Featured Picks',    image: fallbackImages[2], link: '/products?isFeatured=true' },
      { title: 'Accessories & More', image: fallbackImages[3], link: '/products' },
    ];

    // Use real category items where available, fill remaining slots with fallbacks
    return [0, 1, 2, 3].map((i) => catItems[i] || fallbackItems[i]);
  };

  const discoverItems = buildDiscoverItems();

  const [firstDiscover, secondDiscover, thirdDiscover, fourthDiscover] = discoverItems;

  return (
    <div className="min-h-screen bg-white dark:bg-[var(--background)]">
      {/* SEO H1 - visually hidden but indexable */}
      <h1 className="sr-only">Amohamobiles – Best Mobile Shop in Idikarai, Coimbatore | Smartphones, Accessories & Repairs</h1>

      {/* Hero Banner */}
      <section className="bg-gray-50 dark:bg-surface-50">
        <div className="page-container py-3 sm:py-5 lg:py-6">
          {isLoading ? (
            <BannerSkeleton />
          ) : banners.length > 0 ? (
            <div className="relative mx-auto max-w-7xl">
              <div className="relative aspect-[16/9] sm:aspect-[21/8] lg:aspect-[24/8] overflow-visible">
                {banners.length > 1 && (
                  <>
                    <div className="pointer-events-none absolute inset-y-4 left-0 hidden w-[18%] -translate-x-2 rotate-[-7deg] overflow-hidden rounded-2xl opacity-40 blur-[1px] shadow-2xl lg:block">
                      <Image
                        src={getSafeImage(banners[(activeBanner - 1 + banners.length) % banners.length]?.image, PLACEHOLDER_BANNER)}
                        alt="Previous banner preview"
                        fill
                       
                        className="object-cover"
                        sizes="20vw"
                        onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER_BANNER; }}
                      />
                    </div>
                    <div className="pointer-events-none absolute inset-y-4 right-0 hidden w-[18%] translate-x-2 rotate-[7deg] overflow-hidden rounded-2xl opacity-40 blur-[1px] shadow-2xl lg:block">
                      <Image
                        src={getSafeImage(banners[(activeBanner + 1) % banners.length]?.image, PLACEHOLDER_BANNER)}
                        alt="Next banner preview"
                        fill
                       
                        className="object-cover"
                        sizes="20vw"
                        onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER_BANNER; }}
                      />
                    </div>
                  </>
                )}

                <div className="absolute inset-2 rounded-[22px] bg-gradient-to-br from-primary-500/15 via-transparent to-fuchsia-500/15 blur-2xl" />

                <Link
                  href={banners[activeBanner]?.link || '/products'}
                  className="relative h-full overflow-hidden rounded-[20px] border border-white/60 bg-white shadow-[0_20px_60px_-20px_rgba(15,23,42,0.35)] ring-1 ring-black/5 dark:border-white/10 dark:bg-white/[0.02] dark:ring-white/10 block"
                >
                  <Image
                    key={banners[activeBanner]?._id || activeBanner}
                    src={getSafeImage(banners[activeBanner]?.image, PLACEHOLDER_BANNER)}
                    alt={banners[activeBanner]?.title ? `${banners[activeBanner].title} – Amohamobiles Coimbatore` : 'Amohamobiles – Best Mobile Shop in Idikarai, Coimbatore'}
                    fill
                    priority
                   
                    className="object-cover transition-all duration-700 ease-out"
                    sizes="100vw"
                    onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER_BANNER; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-white/10 dark:from-black/20 dark:to-transparent" />
                </Link>
              </div>

              {banners.length > 1 && (
                <div className="mt-3 flex items-center justify-center gap-2">
                  {banners.map((banner, idx) => (
                    <button
                      key={banner._id || idx}
                      type="button"
                      aria-label={`Show slide ${idx + 1}`}
                      onClick={() => setActiveBanner(idx)}
                      className={`h-2 rounded-full transition-all duration-300 ${idx === activeBanner ? 'w-8 bg-primary-500' : 'w-2 bg-gray-300 hover:bg-gray-400 dark:bg-white/30 dark:hover:bg-white/50'}`}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="relative overflow-hidden rounded-[20px] border border-white/60 bg-white shadow-[0_20px_60px_-20px_rgba(15,23,42,0.35)] ring-1 ring-black/5 dark:border-white/10 dark:bg-white/[0.02] dark:ring-white/10">
              <div className="relative aspect-[16/9] sm:aspect-[21/8] lg:aspect-[24/8]">
                <Image
                  src={PLACEHOLDER_BANNER}
                  alt="Hero banner"
                  fill
                  priority
                 
                  className="object-cover"
                  sizes="100vw"
                />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Features Bar */}
      <section className="border-y border-gray-100 dark:border-white/5">
        <div className="page-container grid grid-cols-2 gap-2 sm:gap-3 py-2 sm:py-3 lg:grid-cols-4 lg:py-4">
          {features.map((feature) => (
            <div key={feature.title} className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400">
                <feature.icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-gray-900 dark:text-white sm:text-sm">{feature.title}</p>
                <p className="truncate text-[11px] text-gray-500 dark:text-gray-400 sm:text-xs">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Shop by Category */}
      {categories.length > 0 && (
        <section className="py-6 sm:py-8">
          <div className="page-container">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">Shop by Category</h2>
            </div>
            {/* Mobile/tablet: horizontal scroll | Desktop: grid */}
            <div className="flex gap-3 overflow-x-auto scrollbar-hide snap-x-mandatory pb-1 lg:grid lg:grid-cols-5 xl:grid-cols-6 lg:overflow-visible lg:pb-0">
              {categories.map((cat) => (
                <Link
                  key={cat._id}
                  href={`/products?category=${cat.slug}`}
                  className="group flex flex-shrink-0 snap-start lg:flex-shrink items-center gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3 transition-all hover:border-primary-200 hover:shadow-sm dark:border-white/[0.06] dark:bg-white/[0.02] dark:hover:border-primary-500/30"
                >
                  <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-gray-50 dark:bg-white/5">
                    <Image src={getSafeImage(cat.image, PLACEHOLDER_CATEGORY)} alt={cat.name} fill className="object-cover" sizes="40px" onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER_CATEGORY; }} />
                  </div>
                  <div className="min-w-0">
                    <p className="whitespace-nowrap lg:whitespace-normal lg:truncate text-sm font-medium text-gray-700 group-hover:text-primary-600 dark:text-gray-300 dark:group-hover:text-primary-400">
                      {cat.name}
                    </p>
                    {(cat.productCount ?? 0) > 0 && (
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">{cat.productCount} products</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Products */}
      {!isLoading && featuredProducts.length > 0 && (
        <section className="py-6 sm:py-8 border-t border-gray-50 dark:border-white/5">
          <div className="page-container">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">Featured Deals</h2>
              <Link href="/products?sort=popular" className="text-xs font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 sm:text-sm">
                View All
              </Link>
            </div>
            {/* Mobile/tablet: horizontal scroll | Desktop: responsive grid */}
            <div className="grid grid-flow-col auto-cols-[42vw] sm:auto-cols-[190px] gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-1 lg:grid-flow-row lg:grid-cols-4 xl:grid-cols-5 lg:overflow-visible lg:pb-0">
              {featuredProducts.slice(0, 8).map((product) => (
                <div key={product._id} className="snap-start">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Promotional Banner */}
      {settings?.promoBanner?.isActive && settings.promoBanner.image && (
        <section className="py-4 sm:py-6">
          <div className="page-container">
            <Link href={settings.promoBanner.link || '/products'} className="block overflow-hidden rounded-xl sm:rounded-2xl">
              <div className="relative aspect-[21/6] sm:aspect-[21/5]">
                <Image
                  src={getSafeImage(settings.promoBanner.image, PLACEHOLDER_BANNER)}
                  alt="Promotional Banner"
                  fill
                  className="object-cover"
                  sizes="100vw"
                />
              </div>
            </Link>
          </div>
        </section>
      )}

      {/* Trending */}
      {!isLoading && trendingProducts.length > 0 && (
        <section className="py-6 sm:py-8 border-t border-gray-50 dark:border-white/5">
          <div className="page-container">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">Trending Now</h2>
              <Link href="/products?sort=popular" className="text-xs font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 sm:text-sm">
                View All
              </Link>
            </div>
            {/* Mobile/tablet: horizontal scroll | Desktop: responsive grid */}
            <div className="grid grid-flow-col auto-cols-[42vw] sm:auto-cols-[190px] gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-1 lg:grid-flow-row lg:grid-cols-4 xl:grid-cols-5 lg:overflow-visible lg:pb-0">
              {trendingProducts.slice(0, 8).map((product) => (
                <div key={product._id} className="snap-start">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Recently Viewed Products */}
      <section className="page-container">
        <RecentlyViewed />
      </section>

      {/* Discover More */}
      <section className="py-6 sm:py-8 border-t border-gray-50 dark:border-white/5">
        <div className="page-container">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">Discover More</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Find the latest releases, offers and exclusives right here</p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3 md:grid-rows-2 md:gap-4">
            {firstDiscover && (
              <Link
                href={firstDiscover.link || '/products'}
                className="group relative col-span-2 aspect-[2/1] overflow-hidden rounded-xl border border-gray-100 bg-gray-100 shadow-sm md:col-span-1 md:row-span-2 md:aspect-auto md:min-h-[280px] md:rounded-2xl dark:border-white/[0.06] dark:bg-white/[0.02]"
              >
                <Image
                  src={getSafeImage(firstDiscover.image, PLACEHOLDER_BANNER)}
                  alt={firstDiscover.title || 'Discover'}
                  fill
                 
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                <div className="absolute bottom-4 left-4 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur-md">
                  {firstDiscover.title || 'Latest Launches'}
                </div>
              </Link>
            )}

            {secondDiscover && (
              <Link
                href={secondDiscover.link || '/products'}
                className="group relative col-span-2 aspect-[2/1] overflow-hidden rounded-xl border border-gray-100 bg-gray-100 shadow-sm md:col-span-2 md:row-span-1 md:aspect-auto md:min-h-[130px] md:rounded-2xl dark:border-white/[0.06] dark:bg-white/[0.02]"
              >
                <Image
                  src={getSafeImage(secondDiscover.image, PLACEHOLDER_BANNER)}
                  alt={secondDiscover.title || 'Discover'}
                  fill
                 
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 66vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-4 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur-md">
                  {secondDiscover.title || 'Trending Deals'}
                </div>
              </Link>
            )}

            {thirdDiscover && (
              <Link
                href={thirdDiscover.link || '/products'}
                className="group relative col-span-1 aspect-[4/3] overflow-hidden rounded-xl border border-gray-100 bg-gray-100 shadow-sm md:col-span-1 md:row-span-1 md:aspect-auto md:rounded-2xl dark:border-white/[0.06] dark:bg-white/[0.02]"
              >
                <Image
                  src={getSafeImage(thirdDiscover.image, PLACEHOLDER_PRODUCT)}
                  alt={thirdDiscover.title || 'Discover'}
                  fill
                 
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 50vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 rounded-full bg-white/15 px-3 py-1 text-[10px] font-semibold text-white backdrop-blur-md sm:text-[11px]">
                  {thirdDiscover.title || 'Featured Picks'}
                </div>
              </Link>
            )}

            {fourthDiscover && (
              <Link
                href={fourthDiscover.link || '/products'}
                className="group relative col-span-1 aspect-[4/3] overflow-hidden rounded-xl border border-gray-100 bg-gray-100 shadow-sm md:col-span-1 md:row-span-1 md:aspect-auto md:rounded-2xl dark:border-white/[0.06] dark:bg-white/[0.02]"
              >
                <Image
                  src={getSafeImage(fourthDiscover.image, PLACEHOLDER_CATEGORY)}
                  alt={fourthDiscover.title || 'Discover'}
                  fill
                 
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 50vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 rounded-full bg-white/15 px-3 py-1 text-[10px] font-semibold text-white backdrop-blur-md sm:text-[11px]">
                  {fourthDiscover.title || 'Accessories & More'}
                </div>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Customer Reviews */}
      {topReviews.length > 0 && (
        <section className="py-6 sm:py-8 border-t border-gray-50 dark:border-white/5">
          <div className="page-container">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">What Our Customers Say</h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Real reviews from verified buyers</p>
            </div>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide snap-x-mandatory pb-1 lg:grid lg:grid-cols-4 lg:overflow-visible lg:pb-0">
              {topReviews.map((review) => (
                <div key={review._id} className="w-[220px] flex-shrink-0 snap-start sm:w-[260px] lg:w-auto rounded-xl border border-gray-100 bg-white p-3 sm:p-4 dark:border-white/[0.06] dark:bg-white/[0.02]">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-50 text-primary-600 font-bold text-sm dark:bg-primary-500/10 dark:text-primary-400">
                      {review.user.avatar ? (
                        <Image src={getSafeImage(review.user.avatar, PLACEHOLDER_PRODUCT)} alt={review.user.name || 'User'} width={36} height={36} className="rounded-full object-cover" />
                      ) : (
                        (review.user.name || 'U').charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{review.user.name}</p>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <HiStar key={i} className={`h-3 w-3 ${i < review.rating ? 'text-amber-400' : 'text-gray-200 dark:text-gray-700'}`} />
                        ))}
                      </div>
                    </div>
                  </div>
                  {review.title && <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">{review.title}</p>}
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">{review.comment}</p>
                  <Link href={`/product/${review.productSlug}`} className="mt-3 flex items-center gap-2">
                    <div className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded-md bg-gray-50 dark:bg-white/5">
                      <Image src={getSafeImage(review.productThumbnail, PLACEHOLDER_PRODUCT)} alt={review.productName} fill className="object-cover" sizes="32px" onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER_PRODUCT; }} />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{review.productName}</p>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* New Arrivals Grid */}
      {!isLoading && newArrivals.length > 0 && (
        <section className="py-6 sm:py-10 border-t border-gray-50 dark:border-white/5">
          <div className="page-container">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">New Arrivals</h2>
              <Link href="/products?sort=newest" className="text-xs font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 sm:text-sm">
                View All
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
              {newArrivals.slice(0, 8).map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
            <div className="mt-6 text-center">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-500"
              >
                Explore All Products <HiOutlineArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {isLoading && (
        <section className="py-8">
          <div className="page-container">
            <ProductGridSkeleton count={8} />
          </div>
        </section>
      )}

      {/* Local SEO Trust Section */}
      <section className="py-8 sm:py-10 border-t border-gray-50 dark:border-white/5">
        <div className="page-container">
          <div className="rounded-2xl bg-gradient-to-br from-primary-50 to-white border border-primary-100 dark:from-primary-950/30 dark:to-surface-50 dark:border-primary-900/30 p-6 sm:p-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
              Amohamobiles – #1 Mobile Shop in Idikarai, Coimbatore
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-gray-600 dark:text-gray-400 max-w-3xl">
              Looking for the <strong>best mobile shop in Coimbatore</strong>? Amohamobiles in <strong>Idikarai, Coimbatore</strong> is your one-stop destination for the latest smartphones, mobile accessories, and expert phone repair services. We stock <strong>Samsung, Apple iPhone, OnePlus, Xiaomi, Realme, Vivo, Oppo</strong>, and more at the most competitive prices in Coimbatore, Tamil Nadu.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400 max-w-3xl">
              Conveniently located at <strong>Therveethi, Idikarai</strong>, we serve customers from <strong>Gandhipuram, RS Puram, Saravanampatti, Peelamedu, Singanallur, Kavundampalayam, Kalapatti</strong> and all across Coimbatore. Open Monday to Saturday, 10AM – 8PM. Visit us or <Link href="/contact" className="text-primary-500 hover:underline">contact us</Link> today.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Link href="/products" className="flex flex-col items-center rounded-xl border border-primary-100 bg-white p-4 text-center hover:border-primary-300 hover:shadow-sm dark:border-primary-900/30 dark:bg-white/[0.02] transition-all">
                <span className="text-2xl font-black text-primary-600 dark:text-primary-400">500+</span>
                <span className="mt-1 text-xs text-gray-500 dark:text-gray-400">Phones in Stock</span>
              </Link>
              <Link href="/services" className="flex flex-col items-center rounded-xl border border-primary-100 bg-white p-4 text-center hover:border-primary-300 hover:shadow-sm dark:border-primary-900/30 dark:bg-white/[0.02] transition-all">
                <span className="text-2xl font-black text-primary-600 dark:text-primary-400">15+</span>
                <span className="mt-1 text-xs text-gray-500 dark:text-gray-400">Repair Services</span>
              </Link>
              <Link href="/contact" className="flex flex-col items-center rounded-xl border border-primary-100 bg-white p-4 text-center hover:border-primary-300 hover:shadow-sm dark:border-primary-900/30 dark:bg-white/[0.02] transition-all">
                <span className="text-2xl font-black text-primary-600 dark:text-primary-400">⭐ 4.8</span>
                <span className="mt-1 text-xs text-gray-500 dark:text-gray-400">Customer Rating</span>
              </Link>
              <Link href="/about" className="flex flex-col items-center rounded-xl border border-primary-100 bg-white p-4 text-center hover:border-primary-300 hover:shadow-sm dark:border-primary-900/30 dark:bg-white/[0.02] transition-all">
                <span className="text-2xl font-black text-primary-600 dark:text-primary-400">✓</span>
                <span className="mt-1 text-xs text-gray-500 dark:text-gray-400">Warranty Assured</span>
              </Link>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {[
                'Mobile Shop in Coimbatore',
                'Mobile Shop in Idikarai',
                'Phone Repair Coimbatore',
                'Buy Smartphones Coimbatore',
                'Mobile Accessories Coimbatore',
                'Samsung Shop Coimbatore',
                'iPhone Shop Coimbatore',
                '5G Phones Coimbatore',
                'Budget Mobiles Coimbatore',
                'OnePlus Coimbatore',
              ].map((tag) => (
                <span key={tag} className="rounded-full bg-primary-50 border border-primary-100 px-3 py-1 text-xs font-medium text-primary-700 dark:bg-primary-900/20 dark:border-primary-800/30 dark:text-primary-300">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Popup Modal */}
      {showPopup && settings?.popup?.isActive && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={dismissPopup}>
          <div
            className="relative w-full max-w-md overflow-hidden rounded-2xl shadow-2xl animate-fade-in"
            style={{ backgroundColor: settings.popup.bgColor || '#1a1a2e' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={dismissPopup}
              className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/20 text-white transition hover:bg-black/40"
            >
              <HiX className="h-5 w-5" />
            </button>
            {settings.popup.image && (
              <div className="relative aspect-[16/10] w-full">
                <Image src={settings.popup.image} alt={settings.popup.title || 'Offer'} fill className="object-cover" sizes="(max-width: 448px) 100vw, 448px" />
              </div>
            )}
            <div className="p-5 sm:p-6 text-center">
              {settings.popup.title && (
                <h3 className="text-xl font-bold text-white sm:text-2xl">{settings.popup.title}</h3>
              )}
              {settings.popup.subtitle && (
                <p className="mt-1 text-sm font-medium text-primary-400">{settings.popup.subtitle}</p>
              )}
              {settings.popup.description && (
                <p className="mt-2 text-sm text-gray-300">{settings.popup.description}</p>
              )}
              {settings.popup.buttonText && (
                <Link
                  href={settings.popup.buttonLink || '/products'}
                  onClick={dismissPopup}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-500"
                >
                  {settings.popup.buttonText} <HiOutlineArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
