'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { HiOutlineSearch, HiOutlineX } from 'react-icons/hi';
import { useSearch } from '@/hooks/useSearch';
import { formatPrice } from '@/lib/utils';

interface SearchBarProps {
  onSelect?: () => void;
  onClear?: () => void;
  className?: string;
}

export default function SearchBar({ onSelect, onClear, className = '' }: SearchBarProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const {
    query,
    suggestions,
    isSearching,
    showSuggestions,
    handleQueryChange,
    clearSearch,
    setShowSuggestions,
  } = useSearch();

  // Reset selected index when suggestions change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [suggestions]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setShowSuggestions]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
      handleSuggestionClick(suggestions[selectedIndex].slug);
      return;
    }
    const trimmed = query.trim().replace(/\s+/g, ' ');
    if (trimmed) {
      router.push(`/products?search=${encodeURIComponent(trimmed)}`);
      setShowSuggestions(false);
      onSelect?.();
    }
  };

  const handleSuggestionClick = (slug: string) => {
    router.push(`/product/${slug}`);
    clearSearch();
    setShowSuggestions(false);
    onSelect?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setShowSuggestions(false);
    }
  };

  const HighlightedText = ({ text, highlight }: { text: string; highlight: string }) => {
    if (!highlight.trim()) return <span>{text}</span>;
    const regex = new RegExp(`(${highlight})`, 'gi');
    const parts = text.split(regex);
    return (
      <span>
        {parts.map((part, i) =>
          regex.test(part) ? (
            <span key={i} className="text-blue-600 dark:text-blue-400">{part}</span>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </span>
    );
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <form onSubmit={handleSubmit} className="relative z-50">
        <HiOutlineSearch className="absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            handleQueryChange(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => query.length > 0 && setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search mobiles, brands & accessories..."
          className="w-full pl-11 pr-10 py-3 sm:py-2.5 text-[14px] bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-white/10 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm font-medium"
        />
        {query && (
          <button
            type="button"
            onClick={(e) => {
              clearSearch();
              onClear?.();
              const input = e.currentTarget.parentElement?.querySelector('input');
              if (input) input.blur();
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white transition-colors"
          >
            <HiOutlineX className="h-4 w-4" />
          </button>
        )}
      </form>

      {/* Suggestions dropdown */}
      {showSuggestions && query.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-2 z-50 rounded-2xl bg-white dark:bg-[#1A1A1A] shadow-[0_10px_30px_rgba(0,0,0,0.12)] border border-slate-100 dark:border-white/10 animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden box-border p-2">
          <div className="max-h-[380px] overflow-y-auto pr-2">
            {isSearching ? (
              <div className="flex items-center justify-center py-10">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
              </div>
            ) : suggestions.length > 0 ? (
              <div className="space-y-1">
                {suggestions.map((item, index) => (
                  <button
                    key={item._id}
                    onClick={() => handleSuggestionClick(item.slug)}
                    className={`group flex w-full items-center gap-3 px-[14px] py-[10px] rounded-xl text-left transition-colors ${
                      index === selectedIndex 
                        ? 'bg-[#F8FAFC] dark:bg-white/5' 
                        : 'hover:bg-[#F8FAFC] dark:hover:bg-white/5'
                    }`}
                  >
                    <div className="relative h-[44px] w-[44px] shrink-0 overflow-hidden rounded-lg bg-slate-50 dark:bg-[#121212] border border-slate-100 dark:border-white/5">
                      <Image
                        src={item.thumbnail || '/images/no-product.svg'}
                        alt={item.name || 'Product'}
                        fill
                        className="object-contain p-1"
                        sizes="44px"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold leading-tight text-slate-900 dark:text-white">
                        <HighlightedText text={item.name} highlight={query} />
                      </p>
                      <p className="text-[11px] md:text-[12px] font-normal text-gray-500 mt-0.5">{item.brand}</p>
                    </div>
                    <span className="shrink-0 text-[13px] md:text-[14px] font-bold text-gray-900 dark:text-white ml-2">
                      {formatPrice(item.price)}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 dark:bg-white/5 mb-3">
                  <HiOutlineSearch className="h-6 w-6 text-slate-400" />
                </div>
                <p className="text-[14px] font-bold text-slate-900 dark:text-white mb-1">No products found</p>
                <p className="text-[13px] text-slate-500">Try checking your spelling or use different keywords.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
