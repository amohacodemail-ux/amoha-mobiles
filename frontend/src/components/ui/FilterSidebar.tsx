'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { HiOutlineX, HiStar, HiChevronDown, HiChevronUp, HiOutlineFilter } from 'react-icons/hi';
import type { ProductFilters } from '@/types';
import { formatPrice } from '@/lib/utils';
import apiClient from '@/lib/api-client';

interface FilterSidebarProps {
  filters: ProductFilters;
  onFilterChange: (filters: Partial<ProductFilters>) => void;
  onClear: () => void;
  isOpen?: boolean; // For mobile drawer
  onClose?: () => void; // For mobile drawer
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

const PRICE_MIN = 0;
const PRICE_MAX = 200000;
const PRICE_STEP = 1000;

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
    [min, max, step]
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
    [dragging, getValueFromPosition, onChange, valueMin, valueMax, step]
  );

  const handlePointerUp = () => setDragging(null);

  const leftPercent = getPercent(valueMin);
  const rightPercent = getPercent(valueMax);

  return (
    <div className="px-2 pt-3 pb-2">
      <div
        ref={trackRef}
        className="relative h-1.5 w-full rounded-full bg-gray-200 cursor-pointer"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <div
          className="absolute top-0 h-full rounded-full bg-primary-600"
          style={{ left: `${leftPercent}%`, width: `${rightPercent - leftPercent}%` }}
        />
        <div
          onPointerDown={handlePointerDown('min')}
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-5 w-5 rounded-full border-2 border-primary-600 bg-white shadow-md cursor-grab active:cursor-grabbing touch-none"
          style={{ left: `${leftPercent}%` }}
        />
        <div
          onPointerDown={handlePointerDown('max')}
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-5 w-5 rounded-full border-2 border-primary-600 bg-white shadow-md cursor-grab active:cursor-grabbing touch-none"
          style={{ left: `${rightPercent}%` }}
        />
      </div>
      <div className="mt-4 flex items-center justify-between text-xs font-semibold text-gray-500">
        <span className="tabular-nums">{formatPrice(valueMin)}</span>
        <span className="tabular-nums">{formatPrice(valueMax)}</span>
      </div>
    </div>
  );
}

export default function FilterSidebar({ filters, onFilterChange, onClear, isOpen, onClose }: FilterSidebarProps) {
  const [brands, setBrands] = useState<string[]>(FALLBACK_BRANDS);
  const [openSection, setOpenSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setOpenSection(prev => prev === section ? null : section);
  };

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
      .catch(() => {});
  }, []);

  const [localPriceMin, setLocalPriceMin] = useState(filters.priceMin ?? PRICE_MIN);
  const [localPriceMax, setLocalPriceMax] = useState(filters.priceMax ?? PRICE_MAX);
  const debounceRef = useRef<NodeJS.Timeout>();

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

  const sidebarContent = (
    <div className="flex h-full flex-col bg-white/70 backdrop-blur-2xl lg:rounded-[24px] lg:border lg:border-border-light lg:shadow-premium overflow-hidden">
      <div className="flex items-center justify-between border-b border-border-light px-6 py-5">
        <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900">
          <HiOutlineFilter className="h-5 w-5 text-primary-600" />
          Filters
        </h2>
        {/* Mobile Close Button */}
        {onClose && (
          <button onClick={onClose} className="lg:hidden p-2 text-gray-500 hover:text-gray-900 transition-colors">
            <HiOutlineX className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 scrollbar-thin-desktop">
        
        {/* Brand */}
        <div className="border-b border-gray-100 pb-2 mb-2 last:border-0 last:pb-0 last:mb-0">
          <button onClick={() => toggleSection('brand')} className="flex w-full items-center justify-between py-2 text-sm font-semibold text-gray-900 transition-colors hover:text-primary-600">
            Brand
            {(openSection === 'brand') ? <HiChevronUp className="h-4 w-4" /> : <HiChevronDown className="h-4 w-4" />}
          </button>
          <div className={`mt-3 space-y-2.5 overflow-hidden transition-all duration-300 ${(openSection === 'brand') ? 'max-h-[300px] opacity-100' : 'max-h-0 opacity-0'}`}>
            {brands.slice(0, 8).map(brand => (
              <label key={brand} className="flex cursor-pointer items-center gap-3 group">
                <div className={`flex h-4 w-4 items-center justify-center rounded border transition-colors ${filters.brand?.includes(brand) ? 'bg-primary-600 border-primary-600' : 'border-gray-300 bg-white group-hover:border-primary-400'}`}>
                  {filters.brand?.includes(brand) && <span className="text-[10px] text-white">✓</span>}
                </div>
                <input type="checkbox" className="hidden" checked={filters.brand?.includes(brand) || false} onChange={() => toggleArrayFilter('brand', brand)} />
                <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900">{brand}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Price Range */}
        <div className="border-b border-gray-100 pb-2 mb-2 last:border-0 last:pb-0 last:mb-0">
          <button onClick={() => toggleSection('price')} className="flex w-full items-center justify-between py-2 text-sm font-semibold text-gray-900 transition-colors hover:text-primary-600">
            Price Range
            {(openSection === 'price') ? <HiChevronUp className="h-4 w-4" /> : <HiChevronDown className="h-4 w-4" />}
          </button>
          <div className={`mt-3 overflow-hidden transition-all duration-300 ${(openSection === 'price') ? 'max-h-[200px] opacity-100' : 'max-h-0 opacity-0'}`}>
            <PriceRangeSlider min={PRICE_MIN} max={PRICE_MAX} valueMin={localPriceMin} valueMax={localPriceMax} step={PRICE_STEP} onChange={handlePriceChange} />
          </div>
        </div>

        {/* RAM */}
        <div className="border-b border-gray-100 pb-2 mb-2 last:border-0 last:pb-0 last:mb-0">
          <button onClick={() => toggleSection('ram')} className="flex w-full items-center justify-between py-2 text-sm font-semibold text-gray-900 transition-colors hover:text-primary-600">
            RAM
            {(openSection === 'ram') ? <HiChevronUp className="h-4 w-4" /> : <HiChevronDown className="h-4 w-4" />}
          </button>
          <div className={`mt-3 space-y-2.5 overflow-hidden transition-all duration-300 ${(openSection === 'ram') ? 'max-h-[200px] opacity-100' : 'max-h-0 opacity-0'}`}>
            {ramOptions.map(ram => (
              <label key={ram} className="flex cursor-pointer items-center gap-3 group">
                <div className={`flex h-4 w-4 items-center justify-center rounded border transition-colors ${filters.ram?.includes(ram) ? 'bg-primary-600 border-primary-600' : 'border-gray-300 bg-white group-hover:border-primary-400'}`}>
                  {filters.ram?.includes(ram) && <span className="text-[10px] text-white">✓</span>}
                </div>
                <input type="checkbox" className="hidden" checked={filters.ram?.includes(ram) || false} onChange={() => toggleArrayFilter('ram', ram)} />
                <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900">{ram}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Storage */}
        <div className="border-b border-gray-100 pb-2 mb-2 last:border-0 last:pb-0 last:mb-0">
          <button onClick={() => toggleSection('storage')} className="flex w-full items-center justify-between py-2 text-sm font-semibold text-gray-900 transition-colors hover:text-primary-600">
            Storage
            {(openSection === 'storage') ? <HiChevronUp className="h-4 w-4" /> : <HiChevronDown className="h-4 w-4" />}
          </button>
          <div className={`mt-3 space-y-2.5 overflow-hidden transition-all duration-300 ${(openSection === 'storage') ? 'max-h-[200px] opacity-100' : 'max-h-0 opacity-0'}`}>
            {storageOptions.map(storage => (
              <label key={storage} className="flex cursor-pointer items-center gap-3 group">
                <div className={`flex h-4 w-4 items-center justify-center rounded border transition-colors ${filters.storage?.includes(storage) ? 'bg-primary-600 border-primary-600' : 'border-gray-300 bg-white group-hover:border-primary-400'}`}>
                  {filters.storage?.includes(storage) && <span className="text-[10px] text-white">✓</span>}
                </div>
                <input type="checkbox" className="hidden" checked={filters.storage?.includes(storage) || false} onChange={() => toggleArrayFilter('storage', storage)} />
                <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900">{storage}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Battery */}
        <div className="border-b border-gray-100 pb-2 mb-2 last:border-0 last:pb-0 last:mb-0">
          <button onClick={() => toggleSection('battery')} className="flex w-full items-center justify-between py-2 text-sm font-semibold text-gray-900 transition-colors hover:text-primary-600">
            Battery Capacity
            {(openSection === 'battery') ? <HiChevronUp className="h-4 w-4" /> : <HiChevronDown className="h-4 w-4" />}
          </button>
          <div className={`mt-3 space-y-2.5 overflow-hidden transition-all duration-300 ${(openSection === 'battery') ? 'max-h-[200px] opacity-100' : 'max-h-0 opacity-0'}`}>
            {batteryOptions.map(battery => (
              <label key={battery} className="flex cursor-pointer items-center gap-3 group">
                <div className={`flex h-4 w-4 items-center justify-center rounded border transition-colors ${filters.battery?.includes(battery) ? 'bg-primary-600 border-primary-600' : 'border-gray-300 bg-white group-hover:border-primary-400'}`}>
                  {filters.battery?.includes(battery) && <span className="text-[10px] text-white">✓</span>}
                </div>
                <input type="checkbox" className="hidden" checked={filters.battery?.includes(battery) || false} onChange={() => toggleArrayFilter('battery', battery)} />
                <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900">{battery}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Condition */}
        <div className="border-b border-gray-100 pb-2 mb-2 last:border-0 last:pb-0 last:mb-0">
          <button onClick={() => toggleSection('condition')} className="flex w-full items-center justify-between py-2 text-sm font-semibold text-gray-900 transition-colors hover:text-primary-600">
            Condition
            {(openSection === 'condition') ? <HiChevronUp className="h-4 w-4" /> : <HiChevronDown className="h-4 w-4" />}
          </button>
          <div className={`mt-3 space-y-2.5 overflow-hidden transition-all duration-300 ${(openSection === 'condition') ? 'max-h-[200px] opacity-100' : 'max-h-0 opacity-0'}`}>
            {conditionOptions.map(opt => (
              <label key={opt.value} className="flex cursor-pointer items-center gap-3 group">
                <div className={`flex h-4 w-4 items-center justify-center rounded-full border transition-colors ${filters.condition === opt.value ? 'bg-primary-600 border-primary-600' : 'border-gray-300 bg-white group-hover:border-primary-400'}`}>
                  {filters.condition === opt.value && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                </div>
                <input type="radio" className="hidden" name="condition" checked={filters.condition === opt.value} onChange={() => onFilterChange({ condition: filters.condition === opt.value ? undefined : opt.value })} />
                <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Rating */}
        <div className="border-b border-gray-100 pb-2 mb-2 last:border-0 last:pb-0 last:mb-0">
          <button onClick={() => toggleSection('rating')} className="flex w-full items-center justify-between py-2 text-sm font-semibold text-gray-900 transition-colors hover:text-primary-600">
            Rating
            {(openSection === 'rating') ? <HiChevronUp className="h-4 w-4" /> : <HiChevronDown className="h-4 w-4" />}
          </button>
          <div className={`mt-3 space-y-2.5 overflow-hidden transition-all duration-300 ${(openSection === 'rating') ? 'max-h-[200px] opacity-100' : 'max-h-0 opacity-0'}`}>
            {[4, 3, 2, 1].map(rating => (
              <label key={rating} className="flex cursor-pointer items-center gap-3 group">
                <div className={`flex h-4 w-4 items-center justify-center rounded-full border transition-colors ${filters.rating === rating ? 'bg-primary-600 border-primary-600' : 'border-gray-300 bg-white group-hover:border-primary-400'}`}>
                  {filters.rating === rating && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                </div>
                <input type="radio" className="hidden" name="rating" checked={filters.rating === rating} onChange={() => onFilterChange({ rating: filters.rating === rating ? undefined : rating })} />
                <span className="flex items-center text-sm font-medium text-gray-600 group-hover:text-gray-900">
                  {rating} <HiStar className="ml-1 h-4 w-4 text-yellow-400" /> & up
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Discount */}
        <div className="border-b border-gray-100 pb-2 mb-2 last:border-0 last:pb-0 last:mb-0">
          <button onClick={() => toggleSection('discount')} className="flex w-full items-center justify-between py-2 text-sm font-semibold text-gray-900 transition-colors hover:text-primary-600">
            Discount
            {(openSection === 'discount') ? <HiChevronUp className="h-4 w-4" /> : <HiChevronDown className="h-4 w-4" />}
          </button>
          <div className={`mt-3 space-y-2.5 overflow-hidden transition-all duration-300 ${(openSection === 'discount') ? 'max-h-[200px] opacity-100' : 'max-h-0 opacity-0'}`}>
            {[10, 20, 30, 40, 50].map(discount => (
              <label key={discount} className="flex cursor-pointer items-center gap-3 group">
                <div className={`flex h-4 w-4 items-center justify-center rounded-full border transition-colors ${filters.discount === discount ? 'bg-primary-600 border-primary-600' : 'border-gray-300 bg-white group-hover:border-primary-400'}`}>
                  {filters.discount === discount && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                </div>
                <input type="radio" className="hidden" name="discount" checked={filters.discount === discount} onChange={() => onFilterChange({ discount: filters.discount === discount ? undefined : discount })} />
                <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900">{discount}% Off or more</span>
              </label>
            ))}
          </div>
        </div>

        {/* Availability */}
        <div className="border-b border-gray-100 pb-2 mb-2 last:border-0 last:pb-0 last:mb-0">
          <button onClick={() => toggleSection('availability')} className="flex w-full items-center justify-between py-2 text-sm font-semibold text-gray-900 transition-colors hover:text-primary-600">
            Availability
            {(openSection === 'availability') ? <HiChevronUp className="h-4 w-4" /> : <HiChevronDown className="h-4 w-4" />}
          </button>
          <div className={`mt-3 space-y-2.5 overflow-hidden transition-all duration-300 ${(openSection === 'availability') ? 'max-h-[100px] opacity-100' : 'max-h-0 opacity-0'}`}>
            <label className="flex cursor-pointer items-center gap-3 group">
              <div className={`flex h-4 w-4 items-center justify-center rounded border transition-colors ${filters.inStock ? 'bg-primary-600 border-primary-600' : 'border-gray-300 bg-white group-hover:border-primary-400'}`}>
                {filters.inStock && <span className="text-[10px] text-white">✓</span>}
              </div>
              <input type="checkbox" className="hidden" checked={filters.inStock || false} onChange={() => onFilterChange({ inStock: filters.inStock ? undefined : true })} />
              <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900">In Stock</span>
            </label>
          </div>
        </div>
        
      </div>

      <div className="border-t border-border-light p-4 bg-white/40">
        <div className="flex flex-col gap-3">
          <button
            onClick={onClear}
            disabled={!hasActiveFilters}
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Reset Filters
          </button>
          <button
            onClick={() => { if (onClose) onClose(); }}
            className="w-full rounded-xl bg-primary-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary-600/25 transition-all hover:bg-primary-700 hover:shadow-xl hover:shadow-primary-600/30"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-[280px] xl:w-[300px] flex-shrink-0">
        <div className="sticky top-24 h-[calc(100vh-6rem)]">
          {sidebarContent}
        </div>
      </div>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
          <div className="absolute inset-y-0 right-0 w-[85vw] max-w-[340px] bg-white shadow-2xl transition-transform animate-slide-left">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
