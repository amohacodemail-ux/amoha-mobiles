'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  ArrowRightLeft, 
  Trash2, 
  X, 
  IndianRupee, 
  ShieldCheck, 
  Palette, 
  Activity, 
  Smartphone, 
  Cpu, 
  Battery,
  ChevronDown,
  ChevronUp,
  Plus
} from 'lucide-react';
import { useCompareStore } from '@/store/compare.store';
import { formatPrice } from '@/lib/utils';

const PLACEHOLDER_IMG = '/images/no-product.svg';

const specLabels: Record<string, string> = {
  display: 'Display',
  displaySize: 'Display Size',
  processor: 'Processor',
  ram: 'RAM',
  storage: 'Storage',
  expandableStorage: 'Expandable Storage',
  battery: 'Battery',
  chargingSpeed: 'Charging',
  rearCamera: 'Rear Camera',
  frontCamera: 'Front Camera',
  os: 'Operating System',
  network: 'Network',
  sim: 'SIM',
  weight: 'Weight',
  dimensions: 'Dimensions',
  waterResistant: 'Water Resistant',
  fingerprint: 'Fingerprint',
  nfc: 'NFC',
};
const allSpecKeys = Object.keys(specLabels);
const primarySpecKeys = ['display', 'processor', 'battery'];

export default function ComparePage() {
  const { items, removeFromCompare, clearCompare } = useCompareStore();
  const [mounted, setMounted] = useState(false);
  const [showAllSpecs, setShowAllSpecs] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null; // Prevent hydration mismatch

  if (items.length === 0) {
    return (
      <div className="page-container flex flex-col items-center justify-center py-20 sm:py-32 w-full mx-auto min-h-[60vh]">
        <div className="text-center w-full max-w-md mx-auto flex flex-col items-center justify-center">
          <div className="relative mb-6 flex justify-center">
            <div className="relative flex h-[150px] w-[150px] items-center justify-center rounded-full bg-[#F3F7FC] dark:bg-slate-800/50">
              <div className="absolute top-[20%] right-[25%] h-2 w-2 rounded-full bg-[#82B1FF]"></div>
              <div className="absolute bottom-[25%] left-[18%] h-2 w-2 rounded-full bg-[#FFD54F]"></div>
              <div className="absolute top-[50%] right-[10%] h-1.5 w-1.5 rounded-full bg-[#69F0AE]"></div>
              
              <div className="relative flex h-[95px] w-[95px] items-center justify-center rounded-full bg-white dark:bg-slate-900 shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
                <ArrowRightLeft className="h-9 w-9 text-blue-600 stroke-[2]" />
                <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-[#FFA000] border-2 border-white dark:border-slate-900 text-white font-bold text-xs shadow-sm">
                  ?
                </div>
              </div>
            </div>
          </div>
          
          <h3 className="text-[26px] font-extrabold text-[#0F172A] dark:text-white leading-snug mb-3 tracking-tight">Your compare list is empty</h3>
          <p className="text-[15px] text-[#64748B] dark:text-gray-400 max-w-sm mx-auto mb-8 leading-relaxed">
            Looks like you haven't added anything yet. Browse items and add them to compare.
          </p>
          
          <Link 
            href="/products" 
            className="flex h-[46px] px-10 items-center justify-center rounded-full bg-[#2563EB] text-[15px] font-bold text-white shadow-[0_4px_14px_rgba(37,99,235,0.39)] transition-all duration-300 hover:bg-[#1D4ED8] hover:shadow-[0_6px_20px_rgba(37,99,235,0.23)]"
          >
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#FAFBFC] dark:bg-[#0B1120] pb-[140px]">
      <div className="max-w-[1400px] mx-auto px-4 py-8 sm:py-12">
        {/* Page Header */}
        <div className="mb-8 flex flex-col items-center justify-center relative gap-4">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] dark:text-white tracking-tight">Compare Products</h1>
            <p className="mt-1.5 text-[15px] font-medium text-slate-500 dark:text-slate-400">{items.length} of 4 products selected</p>
          </div>
          <div className="sm:absolute sm:right-0 sm:bottom-0">
            <button
              onClick={clearCompare}
              className="flex items-center gap-2 text-[14px] font-bold text-[#F43F5E] transition-colors hover:text-[#E11D48] px-4 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10"
            >
              <Trash2 className="h-4 w-4" />
              Clear All
            </button>
          </div>
        </div>

        {/* Comparison Table / Grid */}
        <div className="bg-white dark:bg-[#111827] rounded-3xl shadow-[0_4px_24px_-8px_rgba(0,0,0,0.06)] dark:shadow-none border border-slate-100 dark:border-white/5 overflow-x-auto pb-4">
          <div className="min-w-[900px]">
            {/* 1. Header Row (Product Cards) */}
            <div className="grid grid-cols-[240px_repeat(auto-fit,minmax(220px,1fr))] p-4 gap-4 items-stretch border-b border-slate-100 dark:border-white/5">
              
              {/* Left Column: Empty Placeholder */}
              <div />

              {/* Product Cards */}
              {items.map((product) => {
                const discountPercent = product.originalPrice > product.price
                  ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
                  : 0;

                return (
                  <div key={product._id} className="relative flex flex-col items-center rounded-2xl border border-slate-100 dark:border-white/10 p-5 bg-white dark:bg-[#111827] hover:border-blue-200 dark:hover:border-blue-500/30 transition-colors">
                    <button
                      onClick={() => removeFromCompare(product._id)}
                      className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-600 dark:hover:text-white transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    
                    <Link href={`/product/${product.slug}`} className="relative h-[140px] w-full max-w-[140px] mb-4 group">
                      <Image 
                        src={product.thumbnail || PLACEHOLDER_IMG} 
                        alt={product.name} 
                        fill 
                        className="object-contain transition-transform duration-300 group-hover:scale-105" 
                        sizes="140px" 
                        onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMG; }} 
                      />
                    </Link>
                    
                    <Link href={`/product/${product.slug}`} className="text-[15px] font-bold text-slate-900 dark:text-white hover:text-blue-600 transition-colors line-clamp-2 text-center leading-snug mb-1">
                      {product.name}
                    </Link>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">{product.brand}</p>
                    
                    <div className="flex items-center gap-2 mb-3 flex-wrap justify-center">
                      <span className="text-[17px] font-extrabold text-slate-900 dark:text-white">{formatPrice(product.price)}</span>
                      {product.originalPrice > product.price && (
                        <span className="text-[12px] font-bold text-slate-400 line-through">{formatPrice(product.originalPrice)}</span>
                      )}
                      {discountPercent > 0 && (
                        <span className="rounded-full bg-red-100 dark:bg-red-500/20 px-2 py-0.5 text-[10px] font-bold text-red-600 dark:text-red-400 ml-1">
                          -{discountPercent}%
                        </span>
                      )}
                    </div>
                    
                    <div className="mt-auto pt-2">
                       <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold ${product.inStock ? 'bg-red-50 dark:bg-red-500/10 text-red-500' : 'bg-red-50 dark:bg-red-500/10 text-red-500'}`}>
                         {product.inStock ? 'In Stock' : 'Out of Stock'}
                       </span>
                    </div>
                  </div>
                );
              })}
              
              {/* Empty slots placeholders if < 4 items */}
              {Array.from({ length: Math.max(0, 4 - items.length) }).map((_, i) => (
                <div key={`empty-${i}`} className="hidden lg:flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 p-5">
                   <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
                     <Plus className="h-6 w-6" />
                   </div>
                   <span className="text-sm font-bold text-slate-400">Add Product</span>
                </div>
              ))}
            </div>

            {/* 2. Specs Rows */}
            <div className="divide-y divide-slate-100 dark:divide-white/5 text-[14px]">
              
              {/* Price Row */}
              <div className="grid grid-cols-[240px_repeat(auto-fit,minmax(220px,1fr))] p-4 items-center">
                <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300 font-bold px-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    <IndianRupee className="h-4 w-4" />
                  </div>
                  Price
                </div>
                {items.map(p => (
                  <div key={p._id} className="text-center font-bold text-slate-900 dark:text-white px-4">
                    {formatPrice(p.price)}
                    {p.originalPrice > p.price && (
                      <span className="ml-2 text-[12px] text-slate-400 line-through font-semibold">{formatPrice(p.originalPrice)}</span>
                    )}
                  </div>
                ))}
                {/* Empty placeholders for alignment */}
                {Array.from({ length: Math.max(0, 4 - items.length) }).map((_, i) => (
                  <div key={`empty-price-${i}`} />
                ))}
              </div>

              {/* Warranty Row */}
              <div className="grid grid-cols-[240px_repeat(auto-fit,minmax(220px,1fr))] p-4 items-center bg-[#F8FAFC]/50 dark:bg-slate-800/20">
                <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300 font-bold px-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  Warranty
                </div>
                {items.map(p => (
                  <div key={p._id} className="text-center font-semibold text-slate-600 dark:text-slate-300 px-4">
                    {p.warranty || '1 Year Manufacturer Warranty'}
                  </div>
                ))}
                {/* Empty placeholders for alignment */}
                {Array.from({ length: Math.max(0, 4 - items.length) }).map((_, i) => (
                  <div key={`empty-warranty-${i}`} />
                ))}
              </div>

              {/* Colors Row */}
              <div className="grid grid-cols-[240px_repeat(auto-fit,minmax(220px,1fr))] p-4 items-center">
                <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300 font-bold px-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    <Palette className="h-4 w-4" />
                  </div>
                  Colors
                </div>
                {items.map(p => (
                  <div key={p._id} className="flex flex-col items-center justify-center px-4 gap-2">
                    <span className="text-center font-semibold text-slate-600 dark:text-slate-300 text-[13px]">
                      {p.colors?.length ? p.colors.join(', ') : 'Default'}
                    </span>
                    {/* Mock color dots based on image */}
                    <div className="flex items-center justify-center gap-1.5">
                      <div className="h-3.5 w-3.5 rounded-full bg-blue-500 border border-black/10"></div>
                      <div className="h-3.5 w-3.5 rounded-full bg-green-500 border border-black/10"></div>
                      <div className="h-3.5 w-3.5 rounded-full bg-black border border-white/10"></div>
                    </div>
                  </div>
                ))}
                {/* Empty placeholders for alignment */}
                {Array.from({ length: Math.max(0, 4 - items.length) }).map((_, i) => (
                  <div key={`empty-colors-${i}`} />
                ))}
              </div>

              {/* Availability Row */}
              <div className="grid grid-cols-[240px_repeat(auto-fit,minmax(220px,1fr))] p-4 items-center bg-[#F8FAFC]/50 dark:bg-slate-800/20">
                <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300 font-bold px-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    <Activity className="h-4 w-4" />
                  </div>
                  Availability
                </div>
                {items.map(p => (
                  <div key={p._id} className="text-center px-4">
                    <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold ${p.inStock ? 'bg-red-50 dark:bg-red-500/10 text-red-500' : 'bg-red-50 dark:bg-red-500/10 text-red-500'}`}>
                       {p.inStock ? 'In Stock' : 'Out of Stock'}
                     </span>
                  </div>
                ))}
                {/* Empty placeholders for alignment */}
                {Array.from({ length: Math.max(0, 4 - items.length) }).map((_, i) => (
                  <div key={`empty-avail-${i}`} />
                ))}
              </div>

              {/* Dynamic Specs mapping */}
              {(showAllSpecs ? allSpecKeys : primarySpecKeys).map((key, idx) => {
                const values = items.map((p) => {
                  const val = p.specifications?.[key];
                  if (val === undefined || val === '' || val === false) return '-';
                  if (val === true) return 'Yes';
                  return String(val);
                });
                if (values.every((v) => v === '-')) return null;

                const bgClass = idx % 2 !== 0 ? 'bg-[#F8FAFC]/50 dark:bg-slate-800/20' : '';
                
                let Icon = Smartphone;
                if (key === 'processor') Icon = Cpu;
                if (key === 'battery') Icon = Battery;

                return (
                  <div key={key} className={`grid grid-cols-[240px_repeat(auto-fit,minmax(220px,1fr))] p-4 items-center ${bgClass}`}>
                    <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300 font-bold px-4">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
                        <Icon className="h-4 w-4" />
                      </div>
                      {specLabels[key]}
                    </div>
                    {values.map((val, i) => (
                      <div key={items[i]._id} className="text-center font-semibold text-slate-600 dark:text-slate-300 px-4 text-[13px] leading-relaxed">
                        {val}
                      </div>
                    ))}
                    {/* Empty placeholders for alignment */}
                    {Array.from({ length: Math.max(0, 4 - items.length) }).map((_, i) => (
                      <div key={`empty-dyn-${key}-${i}`} />
                    ))}
                  </div>
                );
              })}

            </div>
          </div>
          
          <div className="flex justify-center py-6 border-t border-slate-100 dark:border-white/5">
             <button 
               onClick={() => setShowAllSpecs(!showAllSpecs)}
               className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 px-6 py-2.5 text-[13px] font-bold text-slate-700 dark:text-slate-300 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
             >
               {showAllSpecs ? 'Hide Specifications' : 'View All Specifications'}
               {showAllSpecs ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
             </button>
          </div>
        </div>
      </div>

      {/* 4. Bottom Sticky Action Bar */}
      <div 
        className="animate-in slide-in-from-bottom-10 fade-in duration-500"
        style={{
          position: 'fixed',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'min(1400px, calc(100% - 48px))',
          zIndex: 9999,
          overflow: 'visible',
        }}
      >
        <div 
          className="flex items-center justify-between bg-white dark:bg-[#1E293B] p-3 pl-5 border border-slate-100 dark:border-white/10"
          style={{
            borderRadius: '24px',
            boxShadow: '0 16px 40px rgba(0,0,0,0.12)'
          }}
        >
          
          {/* Left Info */}
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500">
              <ArrowRightLeft className="h-5 w-5" />
            </div>
            <div className="flex flex-col hidden sm:flex">
              <span className="text-[14px] font-extrabold text-slate-900 dark:text-white leading-none mb-1">
                {items.length} of 4
              </span>
              <span className="text-[11px] font-semibold text-slate-500">Products Selected</span>
            </div>
          </div>

          {/* Middle Thumbnails */}
          <div className="flex items-center gap-2 ml-4 sm:ml-8">
            {items.map((product) => (
              <div key={product._id} className="relative h-12 w-12 sm:h-14 sm:w-14 overflow-hidden rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/10 flex items-center justify-center p-1">
                <Image 
                  src={product.thumbnail || PLACEHOLDER_IMG} 
                  alt={product.name} 
                  fill 
                  className="object-contain p-1.5" 
                  sizes="56px"
                />
              </div>
            ))}
            
            {/* Empty thumbnail slots */}
            {Array.from({ length: Math.max(0, 4 - items.length) }).map((_, i) => (
               <div key={`empty-thumb-${i}`} className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30 text-slate-300 dark:text-slate-600">
                 <Plus className="h-5 w-5" />
               </div>
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-4 ml-auto pl-4 border-l border-slate-100 dark:border-white/10">
            <button 
              onClick={clearCompare}
              className="text-[13px] font-bold text-red-500 hover:text-red-600 hidden sm:block"
            >
              Clear All
            </button>
            <button 
              onClick={handleScrollToTop}
              className="flex items-center gap-2 h-12 sm:h-14 px-6 rounded-xl bg-[#334155] dark:bg-blue-600 text-[14px] font-bold text-white shadow-sm hover:bg-[#1E293B] dark:hover:bg-blue-700 transition-colors"
            >
              Compare ({items.length})
              <span className="text-white/60">→</span>
            </button>
          </div>
          
        </div>
      </div>
    </div>
  );
}
