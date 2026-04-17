'use client';

import Image from 'next/image';
import Link from 'next/link';
import { HiOutlineX, HiOutlineTrash, HiStar } from 'react-icons/hi';
import { useCompareStore } from '@/store/compare.store';
import { formatPrice, getRatingColor } from '@/lib/utils';

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

const specKeys = Object.keys(specLabels);

export default function ComparePage() {
  const { items, removeFromCompare, clearCompare } = useCompareStore();

  if (items.length === 0) {
    return (
      <div className="page-container flex flex-col items-center justify-center py-32 text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">No products to compare</h2>
        <p className="mt-2 text-sm text-gray-500">Add products using the compare button on product cards.</p>
        <Link href="/products" className="mt-6 rounded-xl bg-primary-600 px-8 py-3 text-sm font-semibold text-white transition-all hover:bg-primary-500 hover:shadow-glow">
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="page-container py-6 sm:py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">Compare Products</h1>
          <p className="mt-1 text-sm text-gray-500">{items.length} of 4 products</p>
        </div>
        <button
          onClick={clearCompare}
          className="flex items-center gap-1.5 text-sm font-medium text-red-400 transition-colors hover:text-red-300"
        >
          <HiOutlineTrash className="h-4 w-4" />
          Clear All
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[360px] border-collapse">
          {/* Product cards header */}
          <thead>
            <tr>
              <th className="w-24 p-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 sm:w-40">Product</th>
              {items.map((product) => (
                <th key={product._id} className="p-2 text-center">
                  <div className="glass-card relative flex flex-col items-center p-4">
                    <button
                      onClick={() => removeFromCompare(product._id)}
                      className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-red-500/10 hover:text-red-400 sm:right-2 sm:top-2"
                    >
                      <HiOutlineX className="h-4 w-4" />
                    </button>
                    <Link href={`/product/${product.slug}`} className="relative h-32 w-32 overflow-hidden rounded-lg bg-gray-100 dark:bg-white/5">
                      <Image src={product.thumbnail || PLACEHOLDER_IMG} alt={product.name} fill className="object-cover p-1" sizes="128px" onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMG; }} />
                    </Link>
                    <Link href={`/product/${product.slug}`} className="mt-3 text-sm font-semibold text-gray-900 dark:text-white hover:text-primary-400 line-clamp-2 text-center">
                      {product.name}
                    </Link>
                    <p className="mt-1 text-xs text-gray-500">{product.brand}</p>
                    {(product.numReviews ?? 0) > 0 && (
                      <span className={`mt-2 inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-semibold text-white ${getRatingColor(product.ratings ?? 0)}`}>
                        {(product.ratings ?? 0).toFixed(1)} <HiStar className="h-2.5 w-2.5" />
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {/* Price Row */}
            <tr className="border-t border-gray-200 dark:border-white/5">
              <td className="p-3 text-xs font-semibold text-gray-500 dark:text-gray-400">Price</td>
              {items.map((product) => (
                <td key={product._id} className="p-3 text-center">
                  <span className="text-base font-bold text-gray-900 dark:text-white">{formatPrice(product.price)}</span>
                  {product.originalPrice > product.price && (
                    <span className="ml-1.5 text-xs text-gray-500 dark:text-gray-400 line-through">{formatPrice(product.originalPrice)}</span>
                  )}
                </td>
              ))}
            </tr>

            {/* Spec Rows */}
            {specKeys.map((key, idx) => {
              const values = items.map((p) => {
                const val = p.specifications?.[key];
                if (val === undefined || val === '' || val === false) return '-';
                if (val === true) return 'Yes';
                return String(val);
              });
              // Skip row if all values are '-'
              if (values.every((v) => v === '-')) return null;

              return (
                <tr key={key} className={`border-t border-gray-200 dark:border-white/5 ${idx % 2 === 0 ? 'bg-gray-50/50 dark:bg-white/[0.01]' : ''}`}>
                  <td className="p-3 text-xs font-semibold text-gray-500 dark:text-gray-400">{specLabels[key]}</td>
                  {values.map((val, i) => (
                    <td key={items[i]._id} className="p-3 text-center text-sm text-gray-900 dark:text-gray-200">
                      {val}
                    </td>
                  ))}
                </tr>
              );
            })}

            {/* Warranty Row */}
            <tr className="border-t border-gray-200 dark:border-white/5">
              <td className="p-3 text-xs font-semibold text-gray-500 dark:text-gray-400">Warranty</td>
              {items.map((product) => (
                <td key={product._id} className="p-3 text-center text-sm text-gray-900 dark:text-gray-200">
                  {product.warranty || '-'}
                </td>
              ))}
            </tr>

            {/* Colors Row */}
            <tr className="border-t border-gray-200 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.01]">
              <td className="p-3 text-xs font-semibold text-gray-500 dark:text-gray-400">Colors</td>
              {items.map((product) => (
                <td key={product._id} className="p-3 text-center text-sm text-gray-900 dark:text-gray-200">
                  {product.colors?.length ? product.colors.join(', ') : '-'}
                </td>
              ))}
            </tr>

            {/* Stock Row */}
            <tr className="border-t border-gray-200 dark:border-white/5">
              <td className="p-3 text-xs font-semibold text-gray-500 dark:text-gray-400">Availability</td>
              {items.map((product) => (
                <td key={product._id} className="p-3 text-center">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${product.inStock ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-400'}`}>
                    {product.inStock ? 'In Stock' : 'Out of Stock'}
                  </span>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
