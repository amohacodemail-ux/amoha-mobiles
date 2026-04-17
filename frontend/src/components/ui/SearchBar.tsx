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
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
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
          placeholder="Search mobiles, brands..."
          className="glass-input pl-10 pr-10 py-3 text-sm sm:py-2.5"
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
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[70vh] overflow-y-auto overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg dark:border-white/10 dark:bg-[#12121c]">
          {isSearching ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
            </div>
          ) : suggestions.length > 0 ? (
            <ul>
              {suggestions.map((item) => (
                <li key={item._id}>
                  <button
                    onClick={() => handleSuggestionClick(item.slug)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-100 dark:hover:bg-white/5"
                  >
                    <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-white/5">
                      <Image
                        src={item.thumbnail || '/images/no-product.svg'}
                        alt={item.name || 'Product'}
                        fill
                       
                        className="object-cover"
                        sizes="40px"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{item.name}</p>
                      <p className="text-xs text-gray-500">{item.brand}</p>
                    </div>
                    <span className="text-sm font-semibold text-primary-400">
                      {formatPrice(item.price)}
                    </span>
                  </button>
                </li>
              ))}
              <li>
                <button
                  onClick={handleSubmit as unknown as () => void}
                  className="flex w-full items-center justify-center gap-2 border-t border-gray-200 dark:border-white/5 px-4 py-3 text-sm text-primary-400 transition-colors hover:bg-gray-100 dark:hover:bg-white/5"
                >
                  <HiOutlineSearch className="h-4 w-4" />
                  See all results for &quot;{query}&quot;
                </button>
              </li>
            </ul>
          ) : (
            <div className="py-8 text-center text-sm text-gray-500">
              No results found for &quot;{query}&quot;
            </div>
          )}
        </div>
      )}
    </div>
  );
}

