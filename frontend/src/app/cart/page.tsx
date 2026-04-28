'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { HiOutlineTrash, HiOutlineShoppingBag, HiOutlineTag, HiOutlinePlus, HiOutlineBookmark } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { useCartStore } from '@/store/cart.store';
import { cartService } from '@/services/cart.service';
import { formatPrice } from '@/lib/utils';
import type { Product } from '@/types';

export default function CartPage() {
  const {
    items, savedForLater, totalItems, subtotal, discount, deliveryCharge,
    totalAmount, coupon, isLoading, updatingItemId,
    updateQuantity, removeFromCart, clearCart, applyCoupon, removeCoupon,
    saveForLater, moveToCart, removeSavedItem,
  } = useCartStore();
  const [couponCode, setCouponCode] = useState('');
  const [accessories, setAccessories] = useState<Product[]>([]);

  useEffect(() => {
    if (items.length > 0) {
      cartService.getAccessories().then(setAccessories).catch(() => {});
    }
  }, [items.length]);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    try {
      await applyCoupon(couponCode.trim());
      toast.success('Coupon applied!');
      setCouponCode('');
    } catch {
      toast.error('Invalid coupon code');
    }
  };

  if (items.length === 0) {
    return (
      <div className="page-container flex flex-col items-center justify-center py-32 text-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gray-100 dark:bg-white/5">
          <HiOutlineShoppingBag className="h-12 w-12 text-gray-600" />
        </div>
        <h2 className="mt-6 text-2xl font-bold text-gray-900 dark:text-white">Your cart is empty</h2>
        <p className="mt-2 text-sm text-gray-500">Looks like you haven&apos;t added anything yet.</p>
        <Link href="/products" className="mt-6 rounded-xl bg-primary-600 px-8 py-3 text-sm font-semibold text-white transition-all hover:bg-primary-500 hover:shadow-glow">
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="page-container py-6 sm:py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">Shopping Cart</h1>
          <p className="mt-1 text-sm text-gray-500">{totalItems} item{totalItems !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => {
            if (window.confirm('Are you sure you want to clear your entire cart?')) {
              clearCart();
              toast.success('Cart cleared');
            }
          }}
          className="text-sm font-medium text-red-400 transition-colors hover:text-red-300"
        >
          Clear All
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Cart Items */}
        <div className="min-w-0 space-y-3 lg:col-span-2">
          {items.filter((i) => i.product).map((item) => {
            const isUpdating = updatingItemId === item._id;
            const currentStock = item.product?.stock ?? 0;
            const atStockLimit = item.quantity >= currentStock;
            
            return (
              <div key={item._id} className="glass-card-sm flex gap-3 sm:gap-4 p-3 sm:p-4">
                <Link href={`/product/${item.product?.slug || '#'}`} className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-white/5 sm:h-28 sm:w-28">
                  <Image src={item.product?.thumbnail || '/images/no-product.svg'} alt={item.product?.name || 'Product'} fill className="object-cover" sizes="112px" onError={(e) => { const t = e.currentTarget; t.srcset = ''; t.src = '/images/no-product.svg'; }} />
                </Link>
                <div className="flex flex-1 flex-col justify-between min-w-0">
                  <div>
                    <Link href={`/product/${item.product?.slug || '#'}`} className="text-sm font-semibold text-gray-900 dark:text-white hover:text-primary-400 line-clamp-2">
                      {item.product?.name || 'Product'}
                    </Link>
                    <p className="mt-0.5 text-xs text-gray-500">{item.product?.brand || ''}{item.color ? ` · ${item.color}` : ''}</p>
                    {currentStock <= 5 && currentStock > 0 && (
                      <p className="mt-1 text-xs text-amber-500">Only {currentStock} left in stock</p>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center rounded-lg border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-white/5">
                      <button
                        onClick={async () => {
                          try {
                            await updateQuantity(item._id, Math.max(1, item.quantity - 1));
                          } catch (err: unknown) {
                            const message = err instanceof Error ? err.message : 'Failed to update quantity';
                            toast.error(message);
                          }
                        }}
                        disabled={isUpdating || item.quantity <= 1}
                        className="px-2.5 py-2 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed sm:px-3"
                      >−</button>
                      <span className="min-w-[1.5rem] text-center text-xs font-semibold text-gray-900 dark:text-white flex items-center justify-center gap-1">
                        {item.quantity}
                        {isUpdating && (
                          <svg className="animate-spin h-3 w-3 text-primary-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        )}
                      </span>
                      <button
                        onClick={async () => {
                          if (atStockLimit) {
                            toast.error(`Only ${currentStock} item${currentStock !== 1 ? 's' : ''} available in stock`);
                            return;
                          }
                          try {
                            await updateQuantity(item._id, item.quantity + 1);
                          } catch (err: unknown) {
                            const message = err instanceof Error ? err.message : 'Failed to update quantity';
                            toast.error(message);
                          }
                        }}
                        disabled={isUpdating || atStockLimit}
                        className="px-2.5 py-2 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed sm:px-3"
                        title={atStockLimit ? 'Stock limit reached' : 'Increase quantity'}
                      >+</button>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3">
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{formatPrice(item.totalPrice)}</span>
                      <button
                        onClick={() => { saveForLater(item._id); toast.success('Saved for later'); }}
                        disabled={isUpdating}
                        className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-primary-500/10 hover:text-primary-400 disabled:opacity-50"
                        title="Save for later"
                      >
                        <HiOutlineBookmark className="h-4 w-4" />
                      </button>
                      <button
                        onClick={async () => { 
                          try {
                            await removeFromCart(item._id);
                            toast.success('Removed'); 
                          } catch {
                            toast.error('Failed to remove item');
                          }
                        }}
                        disabled={isUpdating}
                        className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
                      >
                        <HiOutlineTrash className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Saved for Later */}
          {savedForLater.length > 0 && (
            <div className="mt-6">
              <h3 className="mb-3 text-base font-bold text-gray-900 dark:text-white">Saved for Later ({savedForLater.length})</h3>
              <div className="space-y-3">
                {savedForLater.filter((i) => i.product).map((item) => (
                  <div key={item._id} className="glass-card-sm flex gap-3 p-3">
                    <Link href={`/product/${item.product?.slug || '#'}`} className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-white/5">
                      <Image src={item.product?.thumbnail || '/images/no-product.svg'} alt={item.product?.name || 'Product'} fill className="object-cover" sizes="80px" />
                    </Link>
                    <div className="flex flex-1 flex-col justify-between min-w-0">
                      <div>
                        <Link href={`/product/${item.product?.slug || '#'}`} className="text-sm font-semibold text-gray-900 dark:text-white hover:text-primary-400 line-clamp-2">
                          {item.product?.name || 'Product'}
                        </Link>
                        <p className="mt-0.5 text-xs text-gray-500">{formatPrice(item.price)}</p>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <button
                          onClick={() => { moveToCart(item._id); toast.success('Moved to cart'); }}
                          className="rounded-lg bg-primary-600/20 px-3 py-1.5 text-xs font-semibold text-primary-400 transition-colors hover:bg-primary-600/30"
                        >
                          Move to Cart
                        </button>
                        <button
                          onClick={() => { removeSavedItem(item._id); toast.success('Removed'); }}
                          className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-red-500/10 hover:text-red-400"
                        >
                          <HiOutlineTrash className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggested Accessories */}
          {accessories.length > 0 && (
            <div className="mt-6">
              <h3 className="mb-3 text-base font-bold text-gray-900 dark:text-white">Accessories for your items</h3>
              <div className="flex w-full gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {accessories.map((acc) => (
                    <div key={acc._id} className="glass-card-sm flex w-36 flex-shrink-0 flex-col p-2.5 sm:w-40 sm:p-3">
                    <Link href={`/product/${acc.slug}`} className="relative mx-auto h-28 w-28 overflow-hidden rounded-lg bg-gray-100 dark:bg-white/5">
                      <Image src={acc.images?.[0] || '/images/no-product.svg'} alt={acc.name} fill className="object-cover" sizes="112px" onError={(e) => { const t = e.currentTarget; t.srcset = ''; t.src = '/images/no-product.svg'; }} />
                    </Link>
                    <Link href={`/product/${acc.slug}`} className="mt-2 text-xs font-semibold text-gray-900 dark:text-white hover:text-primary-400 line-clamp-2">{acc.name}</Link>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{formatPrice(acc.price)}</span>
                      {acc.originalPrice > acc.price && <span className="text-xs text-gray-500 line-through">{formatPrice(acc.originalPrice)}</span>}
                    </div>
                    <button
                      onClick={async () => {
                        try {
                          await useCartStore.getState().addToCart(acc._id, 1);
                          setAccessories((prev) => prev.filter((a) => a._id !== acc._id));
                          toast.success('Added to cart');
                        } catch { toast.error('Failed to add'); }
                      }}
                      className="mt-2 flex w-full items-center justify-center gap-1 rounded-lg bg-primary-600/20 py-1.5 text-xs font-semibold text-primary-400 transition-colors hover:bg-primary-600/30"
                    >
                      <HiOutlinePlus className="h-3.5 w-3.5" />
                      Add
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Order Summary */}
        <div className="min-w-0 lg:col-span-1">
            <div className="glass-card sticky top-20 p-4 sm:top-24 sm:p-5">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Order Summary</h3>

            {/* Coupon */}
            <div className="mt-4">
              {coupon ? (
                <div className="flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <HiOutlineTag className="h-4 w-4 text-emerald-400" />
                    <span className="text-xs font-semibold text-emerald-400">{coupon.code}</span>
                  </div>
                  <button onClick={() => removeCoupon()} className="text-xs text-red-400 hover:text-red-300">Remove</button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Coupon code"
                    className="glass-input flex-1 py-2 text-xs"
                  />
                  <button
                    onClick={handleApplyCoupon}
                    className="rounded-lg bg-primary-600/20 px-4 py-2 text-xs font-semibold text-primary-400 transition-colors hover:bg-primary-600/30"
                  >
                    Apply
                  </button>
                </div>
              )}
            </div>

            <div className="mt-4 space-y-2.5 border-t border-gray-200 dark:border-white/5 pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Subtotal</span>
                <span className="text-gray-900 dark:text-white">{formatPrice(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Discount</span>
                  <span className="text-emerald-400">−{formatPrice(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Delivery</span>
                <span className={deliveryCharge === 0 ? 'text-emerald-400' : 'text-gray-900 dark:text-white'}>
                  {deliveryCharge === 0 ? 'FREE' : formatPrice(deliveryCharge)}
                </span>
              </div>
              <div className="flex justify-between border-t border-gray-200 dark:border-white/10 pt-3 text-base font-bold">
                <span className="text-gray-900 dark:text-white">Total</span>
                <span className="gradient-text">{formatPrice(totalAmount)}</span>
              </div>
            </div>

            <Link
              href="/checkout"
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 py-3.5 text-sm font-semibold text-white transition-all hover:bg-primary-500 hover:shadow-glow"
            >
              Proceed to Checkout
            </Link>
            <Link
              href="/products"
              className="mt-3 flex w-full items-center justify-center rounded-xl border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-white/5 py-3 text-sm font-medium text-gray-500 dark:text-gray-400 transition-all hover:border-gray-300 dark:hover:border-white/20 hover:text-gray-900 dark:hover:text-white"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
