'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';
import 'swiper/css';
import { HiOutlineArrowRight, HiOutlineTruck, HiOutlineShieldCheck, HiOutlineRefresh, HiX, HiStar, HiOutlineCheck, HiOutlineLockClosed } from 'react-icons/hi';
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
import TrustSection from '@/components/ui/TrustSection';
import TestimonialSection from '@/components/ui/TestimonialSection';
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
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;
    if (diff > 50) {
      setActiveBanner((prev) => (prev + 1) % banners.length);
    } else if (diff < -50) {
      setActiveBanner((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
    }
    touchStartX.current = null;
  };

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
    if (banners.length <= 1 || isPaused) return;
    const interval = setInterval(() => {
      setActiveBanner((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners.length, isPaused]);

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



  const activeDiscoverBanners = (settings?.discoverBanners || [])
    .filter((b: any) => b.isActive && b.image && b.image.trim() !== '')
    .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
    .slice(0, 4);

  const buildDiscoverItems = () => {
    const heroBanners = banners.filter((b) => b.isActive !== false && b.image && b.image.trim() !== '');
    const catList = categories.filter((c) => c.image && c.image.trim() !== '');
    const productImages = [
      ...featuredProducts.flatMap((p) => p.images || []),
      ...trendingProducts.flatMap((p) => p.images || []),
      ...newArrivals.flatMap((p) => p.images || []),
    ].filter(Boolean);

    const fallbackImg = (index: number): string => {
      if (heroBanners[index]?.image) return getSafeImage(heroBanners[index].image, PLACEHOLDER_BANNER);
      if (catList[index]?.image) return getSafeImage(catList[index].image, PLACEHOLDER_CATEGORY);
      if (productImages[index]) return getSafeImage(productImages[index], PLACEHOLDER_PRODUCT);
      return PLACEHOLDER_BANNER;
    };

    const fallbackTitle = (index: number, def: string): string => {
      if (catList[index]?.name) return catList[index].name;
      if (heroBanners[index]?.title) return heroBanners[index].title;
      return def;
    };

    const defaults = [
      { title: fallbackTitle(0, 'Latest Launches'), image: fallbackImg(0), link: catList[0] ? `/products?category=${catList[0].slug}` : '/products?sort=newest' },
      { title: fallbackTitle(1, 'Trending Deals'), image: fallbackImg(1), link: catList[1] ? `/products?category=${catList[1].slug}` : '/products?sort=popular' },
      { title: fallbackTitle(2, 'Featured Picks'), image: fallbackImg(2), link: catList[2] ? `/products?category=${catList[2].slug}` : '/products?isFeatured=true' },
      { title: fallbackTitle(3, 'Accessories & More'), image: fallbackImg(3), link: catList[3] ? `/products?category=${catList[3].slug}` : '/products' },
    ];

    return defaults.map((d, i) =>
      activeDiscoverBanners[i]
        ? { ...d, ...activeDiscoverBanners[i], image: getSafeImage(activeDiscoverBanners[i].image, d.image) }
        : d
    );
  };

  const discoverItems = buildDiscoverItems();

  const [firstDiscover, secondDiscover, thirdDiscover, fourthDiscover] = discoverItems;

  return (
    <div className="min-h-screen bg-white dark:bg-[var(--background)]">
      {/* SEO H1 - visually hidden but indexable */}
      <h1 className="sr-only">Amohamobiles – Best Mobile Shop in Idikarai, Coimbatore | Smartphones, Accessories & Repairs</h1>

      {/* Hero Banner */}
      <section className="w-full bg-black">
        <div
          className="relative w-full max-w-none overflow-hidden flex justify-center items-center"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <video
            src="/PixVerse_V6_Image_Text_540P_Create_an_ultrapre.mp4"
            className="w-full max-w-none h-auto block"
            autoPlay
            loop
            muted
            playsInline
          />
        </div>
      </section>

      {/* Trust Section */}
      <TrustSection />

      {/* Shop by Category */}
      {categories.length > 0 && (
        <section className="py-10 sm:py-14 bg-white dark:bg-transparent overflow-hidden">
          <div className="page-container mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl text-left">
              Shop by Category
            </h2>
          </div>
          <div className="relative">
            <style jsx global>{`
              .category-carousel .swiper-wrapper {
                transition-timing-function: linear !important;
              }
            `}</style>
            <Swiper
              modules={[Autoplay]}
              spaceBetween={30}
              loop={categories.length > 8}
              speed={4000}
              autoplay={{
                delay: 0,
                disableOnInteraction: false,
                pauseOnMouseEnter: true,
              }}
              allowTouchMove={true}
              breakpoints={{
                0: {
                  slidesPerView: 3,
                },
                640: {
                  slidesPerView: 5,
                },
                1024: {
                  slidesPerView: 7.5,
                },
              }}
              className="category-carousel"
            >
              {categories.map((cat) => (
                <SwiperSlide key={cat._id}>
                  <Link
                    href={`/products?category=${cat.slug}`}
                    className="group flex flex-col items-center justify-center gap-4 transition-transform duration-300 hover:scale-[1.08] hover:-translate-y-1"
                  >
                    <div className="relative h-[100px] w-[100px] sm:h-[120px] sm:w-[120px] lg:h-[140px] lg:w-[140px] flex-shrink-0 overflow-hidden rounded-full bg-white shadow-[0_4px_15px_rgba(0,0,0,0.06)] group-hover:shadow-[0_8px_30px_rgba(59,130,246,0.3)] transition-shadow duration-300 dark:bg-[#1e293b] dark:shadow-[0_4px_15px_rgba(0,0,0,0.4)] border border-transparent dark:border-white/5">
                      <Image
                        src={getSafeImage(cat.image, PLACEHOLDER_CATEGORY)}
                        alt={cat.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100px, (max-width: 1024px) 120px, 140px"
                        onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER_CATEGORY; }}
                      />
                    </div>
                    <p className="text-[14px] sm:text-[16px] font-semibold text-slate-800 group-hover:text-blue-600 dark:text-slate-200 dark:group-hover:text-blue-400 text-center transition-colors max-w-full truncate px-2">
                      {cat.name}
                    </p>
                  </Link>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </section>
      )}

      {/* Featured Products */}
      {!isLoading && featuredProducts.length > 0 && (
        <section className="py-6 sm:py-8 border-t border-gray-50 dark:border-white/5">
          <div className="page-container">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">Featured Deals</h2>
              <Link href="/products?sort=popular" className="text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 sm:text-sm">
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
              <Link href="/products?sort=popular" className="text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 sm:text-sm">
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
      <section className="py-12 sm:py-20 border-t border-gray-100 dark:border-white/5 bg-white dark:bg-[#0a0a0a]">
        <div className="page-container">
          <div className="mb-10 sm:mb-12">
            <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl">Discover More</h2>
            <p className="mt-3 text-base text-gray-500 dark:text-gray-400">Find the latest releases, offers and exclusives right here</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 lg:gap-8 auto-rows-fr">
            {/* Featured Card (Left) */}
            {firstDiscover && (
              <Link
                href={firstDiscover.link || '/products'}
                className="group relative flex flex-col justify-end overflow-hidden rounded-[24px] bg-gray-100 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:bg-white/[0.02] md:col-span-5 lg:col-span-6 md:min-h-[500px] min-h-[350px]"
              >
                <Image
                  src={getSafeImage(firstDiscover.image, PLACEHOLDER_BANNER)}
                  alt={firstDiscover.title || 'Discover'}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-colors duration-300 group-hover:from-black/90" />
                <div className="relative z-10 p-6 sm:p-10 w-full">
                  <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3 tracking-tight">
                    {firstDiscover.title || 'Latest Launches'}
                  </h3>
                  <div className="flex items-center text-sm font-medium text-white/90 group-hover:text-white">
                    Explore
                    <svg className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </div>
                </div>
              </Link>
            )}

            {/* Right Side Column */}
            <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:gap-8 md:col-span-7 lg:col-span-6">

              {/* Trending Deals (Top Right) */}
              {secondDiscover && (
                <Link
                  href={secondDiscover.link || '/products'}
                  className="group relative flex flex-col justify-end col-span-2 overflow-hidden rounded-[24px] bg-gray-100 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:bg-white/[0.02] min-h-[200px] sm:min-h-[240px]"
                >
                  <Image
                    src={getSafeImage(secondDiscover.image, PLACEHOLDER_BANNER)}
                    alt={secondDiscover.title || 'Discover'}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    sizes="(max-width: 768px) 100vw, 60vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent transition-colors duration-300 group-hover:from-black/90" />
                  <div className="relative z-10 p-6 sm:p-8 flex items-end justify-between w-full">
                    <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                      {secondDiscover.title || 'Trending Deals'}
                    </h3>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20 backdrop-blur-md text-white transition-colors duration-300 group-hover:bg-white group-hover:text-black">
                      <svg className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>
              )}

              {/* Featured Picks (Bottom Left) */}
              {thirdDiscover && (
                <Link
                  href={thirdDiscover.link || '/products'}
                  className="group relative flex flex-col justify-end col-span-1 overflow-hidden rounded-[24px] bg-gray-100 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:bg-white/[0.02] min-h-[200px] sm:min-h-[240px]"
                >
                  <Image
                    src={getSafeImage(thirdDiscover.image, PLACEHOLDER_PRODUCT)}
                    alt={thirdDiscover.title || 'Discover'}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    sizes="(max-width: 768px) 50vw, 30vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent transition-colors duration-300 group-hover:from-black/90" />
                  <div className="relative z-10 p-5 sm:p-6 flex items-end justify-between w-full">
                    <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight leading-tight pr-2">
                      {thirdDiscover.title || 'Featured Picks'}
                    </h3>
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20 backdrop-blur-md text-white transition-colors duration-300 group-hover:bg-white group-hover:text-black">
                      <svg className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>
              )}

              {/* Accessories & More (Bottom Right) */}
              {fourthDiscover && (
                <Link
                  href={fourthDiscover.link || '/products'}
                  className="group relative flex flex-col justify-end col-span-1 overflow-hidden rounded-[24px] bg-gray-100 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:bg-white/[0.02] min-h-[200px] sm:min-h-[240px]"
                >
                  <Image
                    src={getSafeImage(fourthDiscover.image, PLACEHOLDER_CATEGORY)}
                    alt={fourthDiscover.title || 'Discover'}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    sizes="(max-width: 768px) 50vw, 30vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent transition-colors duration-300 group-hover:from-black/90" />
                  <div className="relative z-10 p-5 sm:p-6 flex items-end justify-between w-full">
                    <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight leading-tight pr-2">
                      {fourthDiscover.title || 'Accessories & More'}
                    </h3>
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20 backdrop-blur-md text-white transition-colors duration-300 group-hover:bg-white group-hover:text-black">
                      <svg className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Customer Reviews */}
      {topReviews.length > 0 && <TestimonialSection reviews={topReviews} />}

      {/* New Arrivals Grid */}
      {!isLoading && newArrivals.length > 0 && (
        <section className="py-6 sm:py-10 border-t border-gray-50 dark:border-white/5">
          <div className="page-container">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">New Arrivals</h2>
              <Link href="/products?sort=newest" className="text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 sm:text-sm">
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
                className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-900 dark:bg-accent-600 dark:hover:bg-accent-700"
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
          <div className="rounded-2xl bg-slate-50 border border-slate-200/80 dark:bg-surface-50 dark:border-white/[0.06] p-6 sm:p-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
              Amohamobiles – #1 Mobile Shop in Idikarai, Coimbatore
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-gray-600 dark:text-gray-400 max-w-3xl">
              Looking for the <strong>best mobile shop in Coimbatore</strong>? Amohamobiles in <strong>Idikarai, Coimbatore</strong> is your one-stop destination for the latest smartphones, mobile accessories, and expert phone repair services. We stock <strong>Samsung, Apple iPhone, OnePlus, Xiaomi, Realme, Vivo, Oppo</strong>, and more at the most competitive prices in Coimbatore, Tamil Nadu.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400 max-w-3xl">
              Conveniently located at <strong>Therveethi, Idikarai</strong>, we serve customers from <strong>Gandhipuram, RS Puram, Saravanampatti, Peelamedu, Singanallur, Kavundampalayam, Kalapatti</strong> and all across Coimbatore. Open Monday to Saturday, 10AM – 8PM. Visit us or <Link href="/contact" className="text-accent-600 hover:underline dark:text-accent-400">contact us</Link> today.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Link href="/products" className="flex flex-col items-center rounded-xl border border-slate-200 bg-white p-4 text-center hover:border-slate-300 hover:shadow-sm dark:border-white/[0.06] dark:bg-white/[0.02] transition-all">
                <span className="text-2xl font-black text-slate-800 dark:text-white">500+</span>
                <span className="mt-1 text-xs text-slate-500 dark:text-slate-400">Phones in Stock</span>
              </Link>
              <Link href="/services" className="flex flex-col items-center rounded-xl border border-slate-200 bg-white p-4 text-center hover:border-slate-300 hover:shadow-sm dark:border-white/[0.06] dark:bg-white/[0.02] transition-all">
                <span className="text-2xl font-black text-slate-800 dark:text-white">15+</span>
                <span className="mt-1 text-xs text-slate-500 dark:text-slate-400">Repair Services</span>
              </Link>
              <Link href="/contact" className="flex flex-col items-center rounded-xl border border-slate-200 bg-white p-4 text-center hover:border-slate-300 hover:shadow-sm dark:border-white/[0.06] dark:bg-white/[0.02] transition-all">
                <span className="text-2xl font-black text-slate-800 dark:text-white">⭐ 4.8</span>
                <span className="mt-1 text-xs text-slate-500 dark:text-slate-400">Customer Rating</span>
              </Link>
              <Link href="/about" className="flex flex-col items-center rounded-xl border border-slate-200 bg-white p-4 text-center hover:border-slate-300 hover:shadow-sm dark:border-white/[0.06] dark:bg-white/[0.02] transition-all">
                <span className="text-2xl font-black text-slate-800 dark:text-white">✓</span>
                <span className="mt-1 text-xs text-slate-500 dark:text-slate-400">Warranty Assured</span>
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
                <span key={tag} className="rounded-full bg-white border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-surface-200 dark:border-white/[0.07] dark:text-slate-400">
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
