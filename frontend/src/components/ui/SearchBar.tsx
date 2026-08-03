'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { HiOutlineSearch, HiOutlineX } from 'react-icons/hi';
import { useSearch } from '@/hooks/useSearch';
import { formatPrice } from '@/lib/utils';

interface SearchBarProps {
  onSelect?: () => void;
}

export default function SearchBar({ onSelect }: SearchBarProps) {
  const router = useRouter();
  const {
    query,
    suggestions,
    isSearching,
    showSuggestions,
    handleQueryChange,
    clearSearch,
    setShowSuggestions,
  } = useSearch();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
    onSelect?.();
  };

  return (
    <div className="relative w-full">
      <form onSubmit={handleSubmit} className="relative">
        <HiOutlineSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            placeholder="Search products, services..."
            className="glass-input w-full pl-10 pr-10 py-3 text-sm sm:py-2.5"
          />
        {query && (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-white/5 dark:hover:text-white transition-colors"
          >
            <HiOutlineX className="h-4 w-4" />
          </button>
        )}
      </form>

      {/* Suggestions dropdown */}
      {showSuggestions && (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 max-h-[70vh] overflow-y-auto overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 backdrop-blur-xl shadow-xl dark:border-white/10 dark:bg-[#121212]/95 animate-slide-down">
          {isSearching ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
            </div>
          ) : suggestions.length > 0 ? (
            <>
              <div className="p-2 space-y-0.5">
                {suggestions.map((item) => (
                  <button
                    key={item._id}
                    onClick={() => handleSuggestionClick(item.slug)}
                    className="group flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all hover:bg-blue-50 dark:hover:bg-blue-500/10"
                  >
                    <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200/50 dark:border-white/10">
                      <Image
                        src={item.thumbnail || '/images/no-product.svg'}
                        alt={item.name || 'Product'}
                        fill

                        className="object-cover"
                        sizes="40px"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{item.name}</p>
                      <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">{item.brand}</p>
                    </div>
                    <span className="text-[13px] font-bold text-slate-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {formatPrice(item.price)}
                    </span>
                  </button>
                ))}
              </div>
              <div className="p-2 border-t border-slate-100 dark:border-white/10">
                <button
                  onClick={handleSubmit as unknown as () => void}
                  className="flex w-full items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-[13px] font-bold text-blue-600 transition-all hover:bg-blue-50 dark:text-blue-500 dark:hover:bg-blue-500/10"
                >
                  <HiOutlineSearch className="h-4 w-4" />
                  See all results for &quot;{query}&quot;
                </button>
              </div>
            </>
          ) : (
            <div className="py-8 text-center text-[13px] font-medium text-slate-500 dark:text-slate-400">
              No results found for &quot;{query}&quot;
            </div>
          )}
        </div>
      )}
    </div>
  );
}

