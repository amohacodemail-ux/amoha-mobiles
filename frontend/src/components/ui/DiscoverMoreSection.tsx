'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { HiArrowRight } from 'react-icons/hi2';
import { safeImageSrc } from '@/lib/utils';

interface DiscoverItem {
  title: string;
  image: string;
  link: string;
}

interface DiscoverMoreSectionProps {
  items: DiscoverItem[];
}

const PLACEHOLDER_BANNER = '/images/no-banner.svg';

const LABELS = ['Exclusive', 'Trending', 'New Arrival', 'Best Seller'];
const DESCRIPTIONS = [
  'Premium Smartphones',
  'Best Prices This Week',
  'Top Mobile Essentials',
  "Editor's Choice"
];
const CTAS = ['Explore Collection', 'Shop Now', 'Browse Accessories', 'View Collection'];

export default function DiscoverMoreSection({ items }: DiscoverMoreSectionProps) {
  const [first, second, third, fourth] = items;
  const [hasScrolledIn, setHasScrolledIn] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

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

  if (!first) return null;

  const renderCard = (
    item: DiscoverItem, 
    index: number, 
    className: string, 
    imgSizes: string,
    delayClass: string
  ) => {
    if (!item) return null;
    return (
      <Link
        href={item.link || '/products'}
        className={`group relative overflow-hidden rounded-[28px] border border-white bg-slate-100 shadow-md transition-all duration-350 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.15)] dark:border-white/10 dark:bg-zinc-900 block ${className} transform transition-all duration-1000 ${hasScrolledIn ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'} ${delayClass}`}
      >
        <Image
          src={safeImageSrc(item.image, PLACEHOLDER_BANNER)}
          alt={item.title || 'Discover'}
          fill
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          sizes={imgSizes}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/0 transition-opacity duration-350 group-hover:from-black/90" />
        
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-start p-6 sm:p-8">
          <div className="mb-3 rounded-full bg-white/20 px-3 py-1 text-[11px] font-semibold tracking-wide text-white backdrop-blur-md border border-white/10 shadow-sm">
            {LABELS[index % LABELS.length]}
          </div>
          
          <h3 className="mb-1 text-2xl font-bold text-white sm:text-3xl drop-shadow-sm">
            {item.title}
          </h3>
          <p className="mb-6 text-sm text-white/80">
            {DESCRIPTIONS[index % DESCRIPTIONS.length]}
          </p>
          
          <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-5 py-2.5 text-sm font-medium text-white backdrop-blur-md transition-all duration-300 group-hover:bg-white group-hover:text-slate-900 group-hover:shadow-[0_0_15px_rgba(255,255,255,0.4)]">
            {CTAS[index % CTAS.length]}
            <HiArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </Link>
    );
  };

  return (
    <section 
      ref={sectionRef}
      className={`bg-[#F8FAFC] py-20 sm:py-24 dark:bg-[var(--background)] transition-opacity duration-1000 ${hasScrolledIn ? 'opacity-100' : 'opacity-0'}`}
    >
      <div className="page-container">
        <div className={`mx-auto max-w-3xl text-center mb-16 transition-all duration-1000 delay-100 ${hasScrolledIn ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl lg:text-5xl">
            Discover More
          </h2>
          <p className="mt-5 text-base text-slate-500 dark:text-slate-400 sm:text-lg">
            Explore the latest smartphones, exclusive offers, premium accessories, and featured collections.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-12 lg:grid-rows-2 lg:gap-6 lg:h-[600px]">
          {/* Large Feature Card (Left) */}
          {renderCard(
            first, 
            0, 
            "sm:col-span-2 md:col-span-3 lg:col-span-7 lg:row-span-2 min-h-[400px] lg:min-h-full", 
            "(max-width: 1024px) 100vw, 60vw",
            "delay-[200ms]"
          )}
          
          {/* Top Right Card */}
          {renderCard(
            second, 
            1, 
            "sm:col-span-2 md:col-span-3 lg:col-span-5 lg:row-span-1 min-h-[300px] lg:min-h-full", 
            "(max-width: 1024px) 100vw, 40vw",
            "delay-[300ms]"
          )}
          
          {/* Bottom Right Card 1 */}
          {renderCard(
            third, 
            2, 
            "sm:col-span-1 md:col-span-1 lg:col-span-2 lg:row-span-1 lg:col-start-8 min-h-[300px] lg:min-h-full", 
            "(max-width: 1024px) 50vw, 20vw",
            "delay-[400ms]"
          )}
          
          {/* Bottom Right Card 2 */}
          {renderCard(
            fourth, 
            3, 
            "sm:col-span-1 md:col-span-2 lg:col-span-3 lg:row-span-1 lg:col-start-10 min-h-[300px] lg:min-h-full", 
            "(max-width: 1024px) 50vw, 25vw",
            "delay-[500ms]"
          )}
        </div>
      </div>
    </section>
  );
}
