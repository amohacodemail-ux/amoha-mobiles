'use client';

import { useEffect, useRef, useState } from 'react';
import { HiOutlineBolt } from 'react-icons/hi2';
import { HiOutlineShieldCheck, HiOutlineTruck, HiOutlineRefresh, HiOutlineCheck, HiOutlineLockClosed, HiStar } from 'react-icons/hi';

// --- CountUp Hook ---
function useCountUp(end: number, duration: number = 2000, start: number = 0) {
  const [count, setCount] = useState(start);
  const countRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );
    if (countRef.current) {
      observer.observe(countRef.current);
    }
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    
    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      
      // easeOutQuart
      const easeOut = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeOut * (end - start) + start));
      
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setCount(end);
      }
    };
    
    window.requestAnimationFrame(step);
  }, [isVisible, end, duration, start]);

  return { count, countRef, isVisible };
}

function StatItem({ end, label, prefix = '', suffix = '', decimals = 0 }: { end: number, label: string, prefix?: string, suffix?: string, decimals?: number }) {
  // Multiply end by 10^decimals for smooth decimal counting, then divide when rendering
  const multiplier = Math.pow(10, decimals);
  const { count, countRef } = useCountUp(end * multiplier, 2000);
  
  const displayValue = (count / multiplier).toFixed(decimals);

  return (
    <div ref={countRef} className="text-center">
      <p className="text-3xl font-extrabold text-slate-900 dark:text-white sm:text-4xl">
        {prefix}{displayValue}{suffix === '★' ? <span className="text-xl text-amber-400 sm:text-2xl ml-1">★</span> : suffix}
      </p>
      <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  );
}

export default function TrustSection() {
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

  return (
    <section 
      ref={sectionRef}
      className={`relative overflow-hidden bg-gradient-to-b from-[#F8FAFC] to-blue-50/40 py-20 sm:py-24 dark:from-[var(--background)] dark:to-blue-900/10 transition-opacity duration-1000 ${hasScrolledIn ? 'opacity-100' : 'opacity-0'}`}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent dark:via-white/10" />

      <div className="page-container relative z-10">
        <div className={`mx-auto max-w-3xl text-center mb-16 lg:mb-20 transition-all duration-1000 delay-100 ${hasScrolledIn ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl lg:text-5xl">
            Why Choose Amoha Mobiles?
          </h2>
          <p className="mt-5 text-base text-slate-500 dark:text-slate-400 sm:text-lg">
            Trusted Mobile Store for Genuine Products, Fast Delivery, Secure Shopping, and Reliable Customer Support.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-20">
          {[
            { title: 'Fast Delivery', desc: 'Delivered within 2–3 Business Days', icon: HiOutlineBolt, delay: 'delay-[200ms]' },
            { title: 'Official Warranty', desc: '100% Genuine Warranty Support', icon: HiOutlineShieldCheck, delay: 'delay-[300ms]' },
            { title: 'Free Shipping', desc: 'Free Shipping on Orders Above ₹999', icon: HiOutlineTruck, delay: 'delay-[400ms]' },
            { title: 'Easy Returns', desc: 'Simple 7-Day Return Policy', icon: HiOutlineRefresh, delay: 'delay-[500ms]' }
          ].map((feature, idx) => (
            <div 
              key={feature.title} 
              className={`group relative flex cursor-pointer flex-col items-center rounded-[24px] border border-[#EAEAEA] bg-white p-8 text-center shadow-sm transition-all duration-300 hover:-translate-y-2 hover:scale-[1.03] hover:border-blue-500/40 hover:shadow-[0_20px_40px_rgb(59,130,246,0.12)] dark:border-white/10 dark:bg-zinc-900/50 dark:hover:border-blue-500/50 transform ${hasScrolledIn ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'} ${feature.delay}`}
            >
              {/* Sparkle shine effect */}
              <div className="pointer-events-none absolute inset-0 rounded-[24px] bg-gradient-to-tr from-transparent via-white to-transparent opacity-0 transition-opacity duration-700 group-hover:opacity-20" />
              
              <div className="mb-6 flex h-[60px] w-[60px] items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/20 transition-transform duration-300 group-hover:scale-110 relative">
                <div className="absolute inset-0 rounded-full bg-blue-400 opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-40" />
                <feature.icon className="relative h-7 w-7 text-white z-10" />
              </div>
              <h3 className="mb-2 text-lg font-bold text-slate-900 dark:text-white">{feature.title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">{feature.desc}</p>
            </div>
          ))}
        </div>

        <div className={`mb-20 flex flex-wrap items-center justify-center gap-4 sm:gap-8 transition-all duration-1000 delay-[700ms] ${hasScrolledIn ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
          <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-5 py-2.5 shadow-sm dark:bg-emerald-500/10">
            <HiOutlineCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">100% Genuine Products</span>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-blue-50 px-5 py-2.5 shadow-sm dark:bg-blue-500/10">
            <HiOutlineLockClosed className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">Secure Payments</span>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-amber-50 px-5 py-2.5 shadow-sm dark:bg-amber-500/10">
            <HiStar className="h-5 w-5 text-amber-500" />
            <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">Trusted Mobile Store</span>
          </div>
        </div>

        <div className={`mx-auto grid max-w-4xl grid-cols-2 gap-8 border-t border-slate-200/60 pt-16 sm:grid-cols-4 dark:border-white/10 transition-all duration-1000 delay-[900ms] ${hasScrolledIn ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
          <StatItem end={10000} suffix="+" label="Happy Customers" />
          <StatItem end={5000} suffix="+" label="Products Sold" />
          <StatItem end={4.9} decimals={1} suffix="★" label="Customer Rating" />
          <StatItem end={100} suffix="%" label="Genuine Products" />
        </div>
      </div>
    </section>
  );
}
