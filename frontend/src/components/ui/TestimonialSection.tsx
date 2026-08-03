'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { HiStar, HiCheckBadge } from 'react-icons/hi2';
import { HiOutlineDevicePhoneMobile, HiOutlineUsers, HiOutlineCheckCircle } from 'react-icons/hi2';
import { HiChevronLeft, HiChevronRight } from 'react-icons/hi';
import type { HomepageReview } from '@/types';
import { safeImageSrc } from '@/lib/utils';
import Link from 'next/link';

const PLACEHOLDER_PRODUCT = '/images/no-product.svg';

interface TestimonialSectionProps {
  reviews: HomepageReview[];
}

export default function TestimonialSection({ reviews }: TestimonialSectionProps) {
  const [hasScrolledIn, setHasScrolledIn] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setHasScrolledIn(true);
        }
      },
      { threshold: 0.1 }
    );
    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }
    return () => observer.disconnect();
  }, []);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -340, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 340, behavior: 'smooth' });
    }
  };

  // If we have very few reviews, just show them. If many, show carousel.
  const displayReviews = reviews || [];

  return (
    <section 
      ref={sectionRef}
      className={`relative overflow-hidden bg-[#F8FAFC] py-20 sm:py-24 dark:bg-[var(--background)] transition-opacity duration-1000 ${hasScrolledIn ? 'opacity-100' : 'opacity-0'}`}
    >
      <div className="page-container relative z-10">
        <div className={`mx-auto max-w-3xl text-center mb-16 lg:mb-20 transition-all duration-1000 delay-100 ${hasScrolledIn ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl lg:text-5xl">
            What Our Customers Say
          </h2>
          <p className="mt-5 text-base text-slate-500 dark:text-slate-400 sm:text-lg">
            Real reviews from verified customers who purchased from Amoha Mobiles.
          </p>
        </div>

        {displayReviews.length > 0 && (
          <div className={`relative transition-all duration-1000 delay-300 ${hasScrolledIn ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}>
            {displayReviews.length > 3 && (
              <>
                <button onClick={scrollLeft} className="absolute left-[-20px] top-1/2 z-20 hidden -translate-y-1/2 items-center justify-center rounded-full bg-white p-3 shadow-lg ring-1 ring-slate-100 transition-all hover:scale-110 hover:bg-slate-50 dark:bg-zinc-800 dark:ring-white/10 lg:flex">
                  <HiChevronLeft className="h-6 w-6 text-slate-600 dark:text-slate-300" />
                </button>
                <button onClick={scrollRight} className="absolute right-[-20px] top-1/2 z-20 hidden -translate-y-1/2 items-center justify-center rounded-full bg-white p-3 shadow-lg ring-1 ring-slate-100 transition-all hover:scale-110 hover:bg-slate-50 dark:bg-zinc-800 dark:ring-white/10 lg:flex">
                  <HiChevronRight className="h-6 w-6 text-slate-600 dark:text-slate-300" />
                </button>
              </>
            )}

            <div 
              ref={scrollContainerRef}
              className={`flex gap-6 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-8 pt-4 px-4 -mx-4 ${displayReviews.length <= 3 ? 'lg:grid lg:grid-cols-3 lg:justify-center' : ''}`}
            >
              {displayReviews.map((review, idx) => (
                <div 
                  key={review._id || idx} 
                  className={`group relative flex w-[85vw] max-w-[340px] flex-shrink-0 snap-center flex-col justify-between rounded-[24px] border border-[#EAEAEA] bg-white p-6 sm:p-8 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02] hover:border-blue-500 hover:shadow-[0_20px_40px_rgb(59,130,246,0.12)] dark:border-white/10 dark:bg-zinc-900/60 dark:hover:border-blue-500/50 sm:w-[340px] ${displayReviews.length <= 3 ? 'lg:w-auto' : ''}`}
                >
                  {/* Subtle Quotation Icon Background */}
                  <div className="absolute right-6 top-6 text-slate-100 dark:text-white/5 opacity-50 transition-opacity duration-300 group-hover:text-blue-50 group-hover:dark:text-blue-900/20">
                    <svg className="h-16 w-16" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                    </svg>
                  </div>

                  <div className="relative z-10 flex flex-col h-full">
                    <div className="mb-5 flex items-center gap-4">
                      <div className="relative h-16 w-16 overflow-hidden rounded-full border-2 border-white shadow-md ring-2 ring-slate-100 dark:border-zinc-800 dark:ring-zinc-700 group-hover:ring-blue-100 transition-colors">
                        {review.user?.avatar ? (
                          <Image src={safeImageSrc(review.user.avatar, PLACEHOLDER_PRODUCT)} alt={review.user.name || 'User'} fill className="object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100 text-xl font-bold text-slate-700 dark:from-zinc-700 dark:to-zinc-600 dark:text-zinc-200">
                            {(review.user?.name || 'U').charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-base font-bold text-slate-900 dark:text-white">{review.user?.name}</p>
                          <HiCheckBadge className="h-4 w-4 text-blue-500" title="Verified Buyer" />
                        </div>
                        <div className="mt-1 flex items-center gap-1 text-amber-400">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <HiStar key={i} className={`h-4 w-4 ${i < (review.rating || 5) ? 'text-amber-400' : 'text-slate-200 dark:text-slate-700'}`} />
                          ))}
                          <span className="ml-1 text-xs font-bold text-slate-700 dark:text-slate-300">{(review.rating || 5).toFixed(1)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex-1">
                      {review.title && <p className="mb-2 text-sm font-bold text-slate-900 dark:text-white">{review.title}</p>}
                      <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400 line-clamp-4 relative z-10">
                        "{review.comment}"
                      </p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/10 relative z-10">
                      <Link href={`/product/${review.productSlug}`} className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5 transition-colors hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10">
                        <HiOutlineDevicePhoneMobile className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-300 truncate max-w-[180px]">
                          Purchased: {review.productName}
                        </span>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className={`mx-auto mt-12 grid max-w-5xl grid-cols-2 gap-4 border-t border-slate-200/60 pt-12 sm:grid-cols-4 sm:gap-8 dark:border-white/10 transition-all duration-1000 delay-[500ms] ${hasScrolledIn ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
          <div className="flex flex-col items-center justify-center text-center p-4 rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 dark:bg-zinc-900/50 dark:ring-white/5 transition-transform hover:scale-105 hover:ring-blue-100">
            <HiStar className="mb-2 h-8 w-8 text-amber-400" />
            <p className="text-xl font-extrabold text-slate-900 dark:text-white sm:text-2xl">4.9/5</p>
            <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">Average Rating</p>
          </div>
          
          <div className="flex flex-col items-center justify-center text-center p-4 rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 dark:bg-zinc-900/50 dark:ring-white/5 transition-transform hover:scale-105 hover:ring-blue-100">
            <HiOutlineUsers className="mb-2 h-8 w-8 text-blue-500" />
            <p className="text-xl font-extrabold text-slate-900 dark:text-white sm:text-2xl">10,000+</p>
            <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">Happy Customers</p>
          </div>
          
          <div className="flex flex-col items-center justify-center text-center p-4 rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 dark:bg-zinc-900/50 dark:ring-white/5 transition-transform hover:scale-105 hover:ring-blue-100">
            <HiOutlineDevicePhoneMobile className="mb-2 h-8 w-8 text-purple-500" />
            <p className="text-xl font-extrabold text-slate-900 dark:text-white sm:text-2xl">5,000+</p>
            <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">Phones Sold</p>
          </div>
          
          <div className="flex flex-col items-center justify-center text-center p-4 rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 dark:bg-zinc-900/50 dark:ring-white/5 transition-transform hover:scale-105 hover:ring-blue-100">
            <HiOutlineCheckCircle className="mb-2 h-8 w-8 text-emerald-500" />
            <p className="text-xl font-extrabold text-slate-900 dark:text-white sm:text-2xl">100%</p>
            <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">Verified Reviews</p>
          </div>
        </div>
      </div>
    </section>
  );
}
