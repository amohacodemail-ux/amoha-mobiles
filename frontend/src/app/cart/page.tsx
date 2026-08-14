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
    isProductPending,
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
      <div className="page-container py-12 sm:py-20 flex flex-col items-center">
        <h1 className="w-full text-2xl font-black text-gray-900 dark:text-white mb-6 sm:mb-10 text-left">My Cart</h1>
        
        <div className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800 p-10 sm:p-16 flex flex-col items-center text-center">
          
          <div className="relative mb-8">
            {/* Soft circular background */}
            <div className="absolute inset-0 bg-blue-50 dark:bg-blue-900/20 rounded-full scale-150" />
            
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
            <div className="absolute bottom-4 left-0 w-2 h-2 bg-amber-400 rounded-full animate-pulse delay-150" />
            <div className="absolute top-1/2 -right-4 w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse delay-300" />
            
            {/* Main Icon */}
            <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-white dark:bg-gray-800 shadow-lg border border-gray-50 dark:border-gray-700 z-10">
              <HiOutlineShoppingBag className="h-10 w-10 text-blue-600 dark:text-blue-400" />
              
              {/* Floating question mark / badge like in reference */}
              <div className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-md border-2 border-white dark:border-gray-800 font-bold text-sm">
                ?
              </div>
            </div>
          </div>
          
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">Your cart is empty</h2>
          <p className="mt-3 text-sm sm:text-base font-medium text-gray-500 dark:text-gray-400 max-w-sm">Looks like you haven&apos;t added anything yet. Browse items and add them to your cart.</p>
          
          <Link href="/products" className="mt-8 rounded-full bg-blue-600 px-10 py-3.5 text-sm sm:text-base font-bold text-white transition-all duration-300 hover:bg-blue-700 shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 hover:-translate-y-0.5 active:scale-95">
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container py-6 sm:py-10">
      <div className="mb-8 flex items-end justify-between border-b border-gray-100 dark:border-white/5 pb-6">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <HiOutlineShoppingBag className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Shopping Cart</h1>
            <p className="mt-1 text-sm font-medium text-gray-500">{totalItems} item{totalItems !== 1 ? 's' : ''} in your cart</p>
          </div>
        </div>
        <button
          onClick={() => {
            if (window.confirm('Are you sure you want to clear your entire cart?')) {
              clearCart();
              toast.success('Cart cleared');
            }
          }}
          className="text-sm font-bold text-red-500 transition-colors hover:text-red-400 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10"
        >
          <HiOutlineTrash className="h-4 w-4" /> Clear All
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
              <div key={item._id} className="group/cart-item relative flex flex-col sm:flex-row gap-4 sm:gap-6 rounded-3xl bg-white dark:bg-gray-900 p-4 sm:p-5 shadow-sm border border-gray-100 dark:border-gray-800 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-0.5 overflow-hidden">
                <Link href={`/product/${item.product?.slug || '#'}`} className="relative h-24 w-24 sm:h-32 sm:w-32 flex-shrink-0 overflow-hidden rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                  <Image src={item.product?.thumbnail || '/images/no-product.svg'} alt={item.product?.name || 'Product'} fill className="object-cover transition-transform duration-500 group-hover/cart-item:scale-110" sizes="128px" onError={(e) => { const t = e.currentTarget; t.srcset = ''; t.src = '/images/no-product.svg'; }} />
                </Link>
                <div className="flex flex-1 flex-col justify-between min-w-0">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <Link href={`/product/${item.product?.slug || '#'}`} className="text-base sm:text-lg font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 line-clamp-2 transition-colors">
                        {item.product?.name || 'Product'}
                      </Link>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs font-medium text-gray-500">
                        {item.product?.brand && <span className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-md text-gray-700 dark:text-gray-300">{item.product.brand}</span>}
                        {item.color && <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full border border-gray-200" style={{ backgroundColor: item.color.toLowerCase() }} /> {item.color}</span>}
                      </div>
                      {currentStock <= 5 && currentStock > 0 && (
                        <p className="mt-2 text-[11px] font-bold uppercase tracking-wider text-amber-500 bg-amber-50 dark:bg-amber-500/10 inline-block px-2 py-0.5 rounded-md">Only {currentStock} left in stock</p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-lg sm:text-xl font-black text-gray-900 dark:text-white">{formatPrice(item.totalPrice)}</span>
                      {item.quantity > 1 && <p className="text-xs text-gray-500 mt-0.5">{formatPrice(item.price)} each</p>}
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex items-center rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-1">
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
                        className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 shadow-sm transition-all hover:bg-gray-100 dark:hover:bg-gray-600 hover:text-gray-900 dark:hover:text-white disabled:opacity-40 disabled:shadow-none"
                      >−</button>
                      <span className="flex min-w-[2.5rem] items-center justify-center text-sm font-bold text-gray-900 dark:text-white">
                        {isUpdating ? (
                          <svg className="animate-spin h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : item.quantity}
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
                        className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 shadow-sm transition-all hover:bg-gray-100 dark:hover:bg-gray-600 hover:text-gray-900 dark:hover:text-white disabled:opacity-40 disabled:shadow-none"
                        title={atStockLimit ? 'Stock limit reached' : 'Increase quantity'}
                      >+</button>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { saveForLater(item._id); toast.success('Saved for later'); }}
                        disabled={isUpdating}
                        className="group flex items-center gap-1.5 rounded-xl bg-gray-50 dark:bg-gray-800 px-3 py-2 text-[13px] font-semibold text-gray-600 dark:text-gray-400 transition-all hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400 disabled:opacity-50"
                        title="Save for later"
                      >
                        <HiOutlineBookmark className="h-4 w-4" />
                        <span className="hidden sm:inline">Save for later</span>
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
                        className="group flex items-center gap-1.5 rounded-xl bg-gray-50 dark:bg-gray-800 px-3 py-2 text-[13px] font-semibold text-gray-600 dark:text-gray-400 transition-all hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 disabled:opacity-50"
                      >
                        <HiOutlineTrash className="h-4 w-4 group-hover:scale-110 transition-transform" />
                        <span className="hidden sm:inline">Remove</span>
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
                {accessories.map((acc) => {
                  const addPending = isProductPending(acc._id);
                  return (
                    <div key={acc._id} className="group/acc flex w-36 flex-shrink-0 flex-col rounded-2xl bg-white dark:bg-gray-900 p-3 shadow-sm border border-gray-100 dark:border-gray-800 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/5 hover:-translate-y-1 sm:w-44 sm:p-4">
                    <Link href={`/product/${acc.slug}`} className="relative mx-auto h-24 w-24 sm:h-32 sm:w-32 overflow-hidden rounded-xl bg-gray-50 dark:bg-gray-800">
                      <Image src={acc.images?.[0] || '/images/no-product.svg'} alt={acc.name} fill className="object-cover transition-transform duration-500 group-hover/acc:scale-110" sizes="128px" onError={(e) => { const t = e.currentTarget; t.srcset = ''; t.src = '/images/no-product.svg'; }} />
                    </Link>
                    <Link href={`/product/${acc.slug}`} className="mt-3 text-[13px] sm:text-sm font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 line-clamp-2 transition-colors">{acc.name}</Link>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <span className="text-sm font-black text-gray-900 dark:text-white">{formatPrice(acc.price)}</span>
                      {acc.originalPrice > acc.price && <span className="text-[11px] font-medium text-gray-400 line-through">{formatPrice(acc.originalPrice)}</span>}
                    </div>
                    <button
                      onClick={async () => {
                        try {
                          await useCartStore.getState().addToCart(acc._id, 1);
                          setAccessories((prev) => prev.filter((a) => a._id !== acc._id));
                          toast.success('Added to cart');
                        } catch { toast.error('Failed to add'); }
                      }}
                      disabled={addPending}
                      className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-gray-50 dark:bg-gray-800 py-2.5 text-xs font-bold text-gray-900 dark:text-white transition-all hover:bg-blue-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <HiOutlinePlus className="h-4 w-4" />
                      {addPending ? 'Adding...' : 'Add'}
                    </button>
                  </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Order Summary */}
        <div className="min-w-0 lg:col-span-1">
            <div className="rounded-[2rem] bg-white dark:bg-gray-900 p-6 sm:p-8 shadow-xl shadow-blue-500/5 ring-1 ring-gray-100 dark:ring-gray-800 sticky top-24">
            <h3 className="text-xl font-black text-gray-900 dark:text-white">Order Summary</h3>

            {/* Coupon */}
            <div className="mt-6">
              {coupon ? (
                <div className="flex items-center justify-between rounded-2xl border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <HiOutlineTag className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-[13px] font-bold text-emerald-700 dark:text-emerald-400">{coupon.code}</span>
                  </div>
                  <button onClick={() => removeCoupon()} className="text-xs font-bold text-red-500 hover:text-red-600">Remove</button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Coupon code"
                    className="flex-1 min-w-0 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-sm font-medium focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                  />
                  <button
                    onClick={handleApplyCoupon}
                    className="shrink-0 rounded-xl bg-gray-900 dark:bg-white px-5 sm:px-6 py-3 text-sm font-bold text-white dark:text-gray-900 transition-all hover:bg-blue-600 hover:text-white dark:hover:bg-blue-500"
                  >
                    Apply
                  </button>
                </div>
              )}
            </div>

            <div className="mt-6 space-y-3.5 border-t border-dashed border-gray-200 dark:border-gray-700 pt-6">
              <div className="flex justify-between text-[15px]">
                <span className="text-gray-500 font-medium">Subtotal</span>
                <span className="text-gray-900 dark:text-white font-semibold">{formatPrice(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-[15px]">
                  <span className="text-gray-500 font-medium">Discount</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">−{formatPrice(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-[15px]">
                <span className="text-gray-500 font-medium">Delivery</span>
                <span className={`font-semibold ${deliveryCharge === 0 ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-100 dark:border-emerald-500/20' : 'text-gray-900 dark:text-white'}`}>
                  {deliveryCharge === 0 ? 'FREE' : formatPrice(deliveryCharge)}
                </span>
              </div>
              <div className="flex justify-between border-t border-dashed border-gray-200 dark:border-gray-700 pt-5 text-lg font-black">
                <span className="text-gray-900 dark:text-white">Total</span>
                <span className="text-2xl text-blue-600 dark:text-blue-400 tracking-tight">{formatPrice(totalAmount)}</span>
              </div>
            </div>

            <Link
              href="/checkout"
              className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-4 text-[15px] font-bold text-white transition-all duration-300 hover:bg-blue-700 shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 hover:-translate-y-1 active:scale-95"
            >
              Proceed to Checkout
            </Link>
            <Link
              href="/products"
              className="mt-3 flex w-full items-center justify-center rounded-2xl border border-gray-200 dark:border-gray-700 bg-transparent py-4 text-[15px] font-bold text-gray-600 dark:text-gray-300 transition-all hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
