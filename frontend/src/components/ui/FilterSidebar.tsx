'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { HiOutlineX, HiOutlineAdjustments, HiStar, HiChevronDown, HiChevronUp } from 'react-icons/hi';
import type { ProductFilters } from '@/types';
import { formatPrice } from '@/lib/utils';
import apiClient from '@/lib/api-client';

interface FilterSidebarProps {
  filters: ProductFilters;
  onFilterChange: (filters: Partial<ProductFilters>) => void;
  onClear: () => void;
}

const FALLBACK_BRANDS = ['Samsung', 'Apple', 'OnePlus', 'Xiaomi', 'Realme', 'Vivo', 'OPPO', 'Google', 'Nothing', 'Motorola'];
const ramOptions = ['4 GB', '6 GB', '8 GB', '12 GB', '16 GB'];
const storageOptions = ['64 GB', '128 GB', '256 GB', '512 GB', '1 TB'];
const batteryOptions = ['4000 mAh', '5000 mAh', '5500 mAh', '6000 mAh'];
const conditionOptions = [
  { value: 'new', label: 'New' },
  { value: 'used', label: 'Used' },
  { value: 'refurbished', label: 'Refurbished' },
];
const discountOptions = [
  { value: 10, label: '10% Off or more' },
  { value: 20, label: '20% Off or more' },
  { value: 30, label: '30% Off or more' },
  { value: 40, label: '40% Off or more' },
  { value: 50, label: '50% Off or more' },
];
const sortOptions = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price_low', label: 'Price: Low to High' },
  { value: 'price_high', label: 'Price: High to Low' },
  { value: 'popular', label: 'Popularity' },
  { value: 'rating', label: 'Highest Rated' },
];

const PRICE_MIN = 0;
const PRICE_MAX = 200000;
const PRICE_STEP = 1000;

// --- Dual Range Slider Component ---
function PriceRangeSlider({
  min,
  max,
  valueMin,
  valueMax,
  step,
  onChange,
}: {
  min: number;
  max: number;
  valueMin: number;
  valueMax: number;
  step: number;
  onChange: (minVal: number, maxVal: number) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<'min' | 'max' | null>(null);

  const getPercent = (value: number) => ((value - min) / (max - min)) * 100;

  const getValueFromPosition = useCallback(
    (clientX: number) => {
      if (!trackRef.current) return min;
      const rect = trackRef.current.getBoundingClientRect();
      const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const rawValue = min + percent * (max - min);
      return Math.round(rawValue / step) * step;
    },
    [min, max, step],
  );

  const handlePointerDown = (type: 'min' | 'max') => (e: React.PointerEvent) => {
    e.preventDefault();
    setDragging(type);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging) return;
      const val = getValueFromPosition(e.clientX);
      if (dragging === 'min') {
        onChange(Math.min(val, valueMax - step), valueMax);
      } else {
        onChange(valueMin, Math.max(val, valueMin + step));
      }
    },
    [dragging, getValueFromPosition, onChange, valueMin, valueMax, step],
  );

  const handlePointerUp = () => setDragging(null);

  const leftPercent = getPercent(valueMin);
  const rightPercent = getPercent(valueMax);

  return (
    <div className="px-1 pt-2 pb-1">
      <div
        ref={trackRef}
        className="relative h-1.5 w-full rounded-full bg-gray-200 dark:bg-white/10 cursor-pointer"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {/* Active range track */}
        <div
          className="absolute top-0 h-full rounded-full bg-gradient-to-r from-primary-500 to-primary-400"
          style={{ left: `${leftPercent}%`, width: `${rightPercent - leftPercent}%` }}
        />
        {/* Min thumb */}
        <div
          onPointerDown={handlePointerDown('min')}
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-6 w-6 rounded-full border-2 border-primary-500 bg-surface-100 shadow-lg cursor-grab active:cursor-grabbing transition-shadow hover:shadow-glow touch-none"
          style={{ left: `${leftPercent}%` }}
        />
        {/* Max thumb */}
        <div
          onPointerDown={handlePointerDown('max')}
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-6 w-6 rounded-full border-2 border-primary-500 bg-surface-100 shadow-lg cursor-grab active:cursor-grabbing transition-shadow hover:shadow-glow touch-none"
          style={{ left: `${rightPercent}%` }}
        />
      </div>
      {/* Labels */}
      <div className="mt-3 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <span className="rounded bg-gray-100 dark:bg-white/5 px-2 py-1 font-medium tabular-nums">{formatPrice(valueMin)}</span>
        <span className="text-gray-600">—</span>
        <span className="rounded bg-gray-100 dark:bg-white/5 px-2 py-1 font-medium tabular-nums">{formatPrice(valueMax)}</span>
      </div>
    </div>
  );
}

export default function FilterSidebar({ filters, onFilterChange, onClear }: FilterSidebarProps) {
  const [openFilter, setOpenFilter] = useState<string | null>(null);
  const [brandSearch, setBrandSearch] = useState('');
  const [brands, setBrands] = useState<string[]>(FALLBACK_BRANDS);

  // Load brands from API on mount
  useEffect(() => {
    apiClient.get('/brands')
      .then((res: any) => {
        const data = res.data?.data;
        const list: string[] = Array.isArray(data?.brands)
          ? data.brands.map((b: any) => b.name).filter(Boolean)
          : Array.isArray(data)
          ? data.map((b: any) => b.name).filter(Boolean)
          : [];
        if (list.length > 0) setBrands(list);
      })
      .catch(() => {/* keep fallback */});
  }, []);

  const [localPriceMin, setLocalPriceMin] = useState(filters.priceMin ?? PRICE_MIN);
  const [localPriceMax, setLocalPriceMax] = useState(filters.priceMax ?? PRICE_MAX);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Sync local price with filters when filters change externally (e.g. clear)
  useEffect(() => {
    setLocalPriceMin(filters.priceMin ?? PRICE_MIN);
    setLocalPriceMax(filters.priceMax ?? PRICE_MAX);
  }, [filters.priceMin, filters.priceMax]);

  const handlePriceChange = (minVal: number, maxVal: number) => {
    setLocalPriceMin(minVal);
    setLocalPriceMax(maxVal);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onFilterChange({
        priceMin: minVal > PRICE_MIN ? minVal : undefined,
        priceMax: maxVal < PRICE_MAX ? maxVal : undefined,
      });
    }, 400);
  };

  const toggleArrayFilter = (key: 'brand' | 'ram' | 'storage' | 'battery', value: string) => {
    const current = filters[key] || [];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onFilterChange({ [key]: updated });
  };

  const hasActiveFilters =
    (filters.brand?.length || 0) > 0 ||
    (filters.ram?.length || 0) > 0 ||
    (filters.storage?.length || 0) > 0 ||
    (filters.battery?.length || 0) > 0 ||
    filters.priceMin !== undefined ||
    filters.priceMax !== undefined ||
    filters.rating !== undefined ||
    filters.condition !== undefined ||
    filters.discount !== undefined ||
    filters.inStock !== undefined;

  const activeFilterCount = [
    filters.brand?.length || 0,
    filters.ram?.length || 0,
    filters.storage?.length || 0,
    filters.battery?.length || 0,
    filters.priceMin !== undefined || filters.priceMax !== undefined ? 1 : 0,
    filters.rating !== undefined ? 1 : 0,
    filters.condition !== undefined ? 1 : 0,
    filters.discount !== undefined ? 1 : 0,
    filters.inStock !== undefined ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const filteredBrands = brands.filter((b) =>
    b.toLowerCase().includes(brandSearch.toLowerCase()),
  );

  const toggleFilter = (filterName: string) => {
    setOpenFilter(openFilter === filterName ? null : filterName);
  };

  // Count active filters per category
  const getFilterCount = (filterName: string): number => {
    switch (filterName) {
      case 'brand': return filters.brand?.length || 0;
      case 'price': return (filters.priceMin !== undefined || filters.priceMax !== undefined) ? 1 : 0;
      case 'ram': return filters.ram?.length || 0;
      case 'storage': return filters.storage?.length || 0;
      case 'battery': return filters.battery?.length || 0;
      case 'rating': return filters.rating !== undefined ? 1 : 0;
      case 'condition': return filters.condition !== undefined ? 1 : 0;
      case 'discount': return filters.discount !== undefined ? 1 : 0;
      case 'availability': return filters.inStock !== undefined ? 1 : 0;
      default: return 0;
    }
  };

  return (
    <div className="w-full">
      {/* Horizontal Filter Bar */}
      <div className="glass-card mb-4 overflow-hidden rounded-xl border border-gray-200 dark:border-white/[0.08]">
        {/* Filter chips row */}
        <div className="flex items-center gap-2 overflow-x-auto px-4 py-3 scrollbar-hide">
          {/* Sort */}
          <button
            onClick={() => toggleFilter('sort')}
            className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
              openFilter === 'sort'
                ? 'border-primary-500 bg-primary-100 text-primary-700 dark:border-primary-500/50 dark:bg-primary-500/10 dark:text-primary-300'
                : 'border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-white/20 hover:bg-gray-200 dark:hover:bg-white/10'
            }`}
          >
            Sort By
            <HiChevronDown className={`h-4 w-4 transition-transform ${openFilter === 'sort' ? 'rotate-180' : ''}`} />
          </button>

          {/* Brand */}
          <button
            onClick={() => toggleFilter('brand')}
            className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
              openFilter === 'brand'
                ? 'border-primary-500 bg-primary-100 text-primary-700 dark:border-primary-500/50 dark:bg-primary-500/10 dark:text-primary-300'
                : 'border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-white/20 hover:bg-gray-200 dark:hover:bg-white/10'
            }`}
          >
            Brand
            {getFilterCount('brand') > 0 && (
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary-500 px-1.5 text-[10px] font-bold text-white">
                {getFilterCount('brand')}
              </span>
            )}
            <HiChevronDown className={`h-4 w-4 transition-transform ${openFilter === 'brand' ? 'rotate-180' : ''}`} />
          </button>

          {/* Price */}
          <button
            onClick={() => toggleFilter('price')}
            className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
              openFilter === 'price'
                ? 'border-primary-500 bg-primary-100 text-primary-700 dark:border-primary-500/50 dark:bg-primary-500/10 dark:text-primary-300'
                : 'border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-white/20 hover:bg-gray-200 dark:hover:bg-white/10'
            }`}
          >
            Price
            {getFilterCount('price') > 0 && (
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary-500 px-1.5 text-[10px] font-bold text-white">
                {getFilterCount('price')}
              </span>
            )}
            <HiChevronDown className={`h-4 w-4 transition-transform ${openFilter === 'price' ? 'rotate-180' : ''}`} />
          </button>

          {/* RAM */}
          <button
            onClick={() => toggleFilter('ram')}
            className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
              openFilter === 'ram'
                ? 'border-primary-500 bg-primary-100 text-primary-700 dark:border-primary-500/50 dark:bg-primary-500/10 dark:text-primary-300'
                : 'border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-white/20 hover:bg-gray-200 dark:hover:bg-white/10'
            }`}
          >
            RAM
            {getFilterCount('ram') > 0 && (
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary-500 px-1.5 text-[10px] font-bold text-white">
                {getFilterCount('ram')}
              </span>
            )}
            <HiChevronDown className={`h-4 w-4 transition-transform ${openFilter === 'ram' ? 'rotate-180' : ''}`} />
          </button>

          {/* Storage */}
          <button
            onClick={() => toggleFilter('storage')}
            className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
              openFilter === 'storage'
                ? 'border-primary-500 bg-primary-100 text-primary-700 dark:border-primary-500/50 dark:bg-primary-500/10 dark:text-primary-300'
                : 'border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-white/20 hover:bg-gray-200 dark:hover:bg-white/10'
            }`}
          >
            Storage
            {getFilterCount('storage') > 0 && (
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary-500 px-1.5 text-[10px] font-bold text-white">
                {getFilterCount('storage')}
              </span>
            )}
            <HiChevronDown className={`h-4 w-4 transition-transform ${openFilter === 'storage' ? 'rotate-180' : ''}`} />
          </button>

          {/* Battery */}
          <button
            onClick={() => toggleFilter('battery')}
            className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
              openFilter === 'battery'
                ? 'border-primary-500 bg-primary-100 text-primary-700 dark:border-primary-500/50 dark:bg-primary-500/10 dark:text-primary-300'
                : 'border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-white/20 hover:bg-gray-200 dark:hover:bg-white/10'
            }`}
          >
            Battery
            {getFilterCount('battery') > 0 && (
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary-500 px-1.5 text-[10px] font-bold text-white">
                {getFilterCount('battery')}
              </span>
            )}
            <HiChevronDown className={`h-4 w-4 transition-transform ${openFilter === 'battery' ? 'rotate-180' : ''}`} />
          </button>

          {/* Rating */}
          <button
            onClick={() => toggleFilter('rating')}
            className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
              openFilter === 'rating'
                ? 'border-primary-500 bg-primary-100 text-primary-700 dark:border-primary-500/50 dark:bg-primary-500/10 dark:text-primary-300'
                : 'border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-white/20 hover:bg-gray-200 dark:hover:bg-white/10'
            }`}
          >
            Rating
            {getFilterCount('rating') > 0 && (
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary-500 px-1.5 text-[10px] font-bold text-white">
                {getFilterCount('rating')}
              </span>
            )}
            <HiChevronDown className={`h-4 w-4 transition-transform ${openFilter === 'rating' ? 'rotate-180' : ''}`} />
          </button>

          {/* Condition (New/Used/Refurbished) */}
          <button
            onClick={() => toggleFilter('condition')}
            className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
              openFilter === 'condition'
                ? 'border-primary-500 bg-primary-100 text-primary-700 dark:border-primary-500/50 dark:bg-primary-500/10 dark:text-primary-300'
                : 'border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-white/20 hover:bg-gray-200 dark:hover:bg-white/10'
            }`}
          >
            Condition
            {filters.condition && (
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary-500 px-1.5 text-[10px] font-bold text-white">1</span>
            )}
            <HiChevronDown className={`h-4 w-4 transition-transform ${openFilter === 'condition' ? 'rotate-180' : ''}`} />
          </button>

          {/* Discount */}
          <button
            onClick={() => toggleFilter('discount')}
            className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
              openFilter === 'discount'
                ? 'border-primary-500 bg-primary-100 text-primary-700 dark:border-primary-500/50 dark:bg-primary-500/10 dark:text-primary-300'
                : 'border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-white/20 hover:bg-gray-200 dark:hover:bg-white/10'
            }`}
          >
            Discount
            {filters.discount && (
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary-500 px-1.5 text-[10px] font-bold text-white">1</span>
            )}
            <HiChevronDown className={`h-4 w-4 transition-transform ${openFilter === 'discount' ? 'rotate-180' : ''}`} />
          </button>

          {/* Availability */}
          <button
            onClick={() => {
              onFilterChange({ inStock: filters.inStock ? undefined : true });
            }}
            className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
              filters.inStock
                ? 'border-primary-500 bg-primary-100 text-primary-700 dark:border-primary-500/50 dark:bg-primary-500/10 dark:text-primary-300'
                : 'border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-white/20 hover:bg-gray-200 dark:hover:bg-white/10'
            }`}
          >
            In Stock
            {filters.inStock && <span className="text-xs">&#10003;</span>}
          </button>

          {/* Clear All */}
          {hasActiveFilters && (
            <button
              onClick={onClear}
              className="ml-auto flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-400 transition-all hover:bg-red-500/20"
            >
              <HiOutlineX className="h-4 w-4" />
              Clear All ({activeFilterCount})
            </button>
          )}
        </div>

        {/* Expanded Filter Content */}
        {openFilter && (
          <div className="border-t border-gray-100 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.02] px-4 py-4">
            {/* Sort Options */}
            {openFilter === 'sort' && (
              <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-5">
                {sortOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      onFilterChange({ sort: opt.value });
                      setOpenFilter(null);
                    }}
                    className={`rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                      (filters.sort || 'newest') === opt.value
                        ? 'bg-primary-100 text-primary-700 ring-1 ring-primary-300 dark:bg-primary-500/20 dark:text-primary-300 dark:ring-primary-500/30'
                        : 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10 hover:text-gray-700 dark:text-gray-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}

            {/* Brand Options */}
            {openFilter === 'brand' && (
              <div>
                <input
                  type="text"
                  placeholder="Search brand..."
                  value={brandSearch}
                  onChange={(e) => setBrandSearch(e.target.value)}
                  className="mb-3 w-full rounded-lg border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-white/5 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-600 outline-none transition-colors focus:border-primary-500/40"
                />
                <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-5">
                  {filteredBrands.map((brand) => {
                    const active = filters.brand?.includes(brand);
                    return (
                      <button
                        key={brand}
                        onClick={() => toggleArrayFilter('brand', brand)}
                        className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                          active
                            ? 'bg-primary-100 text-primary-700 ring-1 ring-primary-300 dark:bg-primary-500/20 dark:text-primary-300 dark:ring-primary-500/30'
                            : 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10 hover:text-gray-700 dark:text-gray-200'
                        }`}
                      >
                        {active && <span className="text-xs">✓</span>}
                        {brand}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Price Range */}
            {openFilter === 'price' && (
              <div className="max-w-2xl">
                <PriceRangeSlider
                  min={PRICE_MIN}
                  max={PRICE_MAX}
                  valueMin={localPriceMin}
                  valueMax={localPriceMax}
                  step={PRICE_STEP}
                  onChange={handlePriceChange}
                />
                <div className="mt-4 flex flex-wrap gap-2">
                  {[
                    { label: 'Under ₹10K', min: undefined, max: 10000 },
                    { label: '₹10K - ₹20K', min: 10000, max: 20000 },
                    { label: '₹20K - ₹40K', min: 20000, max: 40000 },
                    { label: '₹40K - ₹80K', min: 40000, max: 80000 },
                    { label: 'Above ₹80K', min: 80000, max: undefined },
                  ].map((preset) => {
                    const isActive = filters.priceMin === preset.min && filters.priceMax === preset.max;
                    return (
                      <button
                        key={preset.label}
                        onClick={() => {
                          onFilterChange({ priceMin: preset.min, priceMax: preset.max });
                          setLocalPriceMin(preset.min ?? PRICE_MIN);
                          setLocalPriceMax(preset.max ?? PRICE_MAX);
                        }}
                        className={`rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                          isActive
                            ? 'bg-primary-100 text-primary-700 ring-1 ring-primary-300 dark:bg-primary-500/20 dark:text-primary-300 dark:ring-primary-500/30'
                            : 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10 hover:text-gray-700 dark:text-gray-200'
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* RAM Options */}
            {openFilter === 'ram' && (
              <div className="flex flex-wrap gap-2">
                {ramOptions.map((ram) => {
                  const active = filters.ram?.includes(ram);
                  return (
                    <button
                      key={ram}
                      onClick={() => toggleArrayFilter('ram', ram)}
                      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                        active
                          ? 'bg-primary-100 text-primary-700 ring-1 ring-primary-300 dark:bg-primary-500/20 dark:text-primary-300 dark:ring-primary-500/30'
                          : 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10 hover:text-gray-700 dark:text-gray-200'
                      }`}
                    >
                      {active && <span className="text-xs">✓</span>}
                      {ram}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Storage Options */}
            {openFilter === 'storage' && (
              <div className="flex flex-wrap gap-2">
                {storageOptions.map((storage) => {
                  const active = filters.storage?.includes(storage);
                  return (
                    <button
                      key={storage}
                      onClick={() => toggleArrayFilter('storage', storage)}
                      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                        active
                          ? 'bg-primary-100 text-primary-700 ring-1 ring-primary-300 dark:bg-primary-500/20 dark:text-primary-300 dark:ring-primary-500/30'
                          : 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10 hover:text-gray-700 dark:text-gray-200'
                      }`}
                    >
                      {active && <span className="text-xs">✓</span>}
                      {storage}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Battery Options */}
            {openFilter === 'battery' && (
              <div className="flex flex-wrap gap-2">
                {batteryOptions.map((battery) => {
                  const active = filters.battery?.includes(battery);
                  return (
                    <button
                      key={battery}
                      onClick={() => toggleArrayFilter('battery', battery)}
                      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                        active
                          ? 'bg-primary-100 text-primary-700 ring-1 ring-primary-300 dark:bg-primary-500/20 dark:text-primary-300 dark:ring-primary-500/30'
                          : 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10 hover:text-gray-700 dark:text-gray-200'
                      }`}
                    >
                      {active && <span className="text-xs">✓</span>}
                      {battery}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Rating Options */}
            {openFilter === 'rating' && (
              <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                {[4, 3, 2, 1].map((rating) => {
                  const active = filters.rating === rating;
                  return (
                    <button
                      key={rating}
                      onClick={() => {
                        onFilterChange({ rating: active ? undefined : rating });
                        if (!active) setOpenFilter(null);
                      }}
                      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                        active
                          ? 'bg-primary-100 text-primary-700 ring-1 ring-primary-300 dark:bg-primary-500/20 dark:text-primary-300 dark:ring-primary-500/30'
                          : 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10 hover:text-gray-700 dark:text-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <HiStar
                            key={i}
                            className={`h-3.5 w-3.5 ${i < rating ? 'text-amber-400' : 'text-gray-700'}`}
                          />
                        ))}
                      </div>
                      <span className="text-xs">{rating}★ & up</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Condition Options */}
            {openFilter === 'condition' && (
              <div className="flex flex-wrap gap-2">
                {conditionOptions.map((opt) => {
                  const active = filters.condition === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => {
                        onFilterChange({ condition: active ? undefined : opt.value });
                        if (!active) setOpenFilter(null);
                      }}
                      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                        active
                          ? 'bg-primary-100 text-primary-700 ring-1 ring-primary-300 dark:bg-primary-500/20 dark:text-primary-300 dark:ring-primary-500/30'
                          : 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10 hover:text-gray-700 dark:text-gray-200'
                      }`}
                    >
                      {active && <span className="text-xs">&#10003;</span>}
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Discount Options */}
            {openFilter === 'discount' && (
              <div className="flex flex-wrap gap-2">
                {discountOptions.map((opt) => {
                  const active = filters.discount === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => {
                        onFilterChange({ discount: active ? undefined : opt.value });
                        if (!active) setOpenFilter(null);
                      }}
                      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                        active
                          ? 'bg-primary-100 text-primary-700 ring-1 ring-primary-300 dark:bg-primary-500/20 dark:text-primary-300 dark:ring-primary-500/30'
                          : 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10 hover:text-gray-700 dark:text-gray-200'
                      }`}
                    >
                      {active && <span className="text-xs">&#10003;</span>}
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
