'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { HiOutlineShoppingBag, HiOutlineHeart, HiOutlineUser, HiOutlineMenu, HiOutlineX, HiOutlineSearch, HiOutlineClipboardList, HiOutlineLogout, HiOutlineCollection, HiOutlineCog, HiOutlineSwitchHorizontal, HiOutlineRefresh, HiOutlineCreditCard } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/auth.store';
import { useCartStore } from '@/store/cart.store';
import { useWishlistStore } from '@/store/wishlist.store';
import { useCompareStore } from '@/store/compare.store';
import { useSettingsStore } from '@/store/settings.store';
import SearchBar from '@/components/ui/SearchBar';
import ThemeToggle from '@/components/ui/ThemeToggle';

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const logout = useAuthStore((s) => s.logout);
  const totalItems = useCartStore((s) => s.totalItems ?? 0);
  const wishlistCount = useWishlistStore((s) => Array.isArray(s.items) ? s.items.length : 0);
  const compareCount = useCompareStore((s) => Array.isArray(s.items) ? s.items.length : 0);
  const settings = useSettingsStore((s) => s.settings);
  const fetchSettings = useSettingsStore((s) => s.fetchSettings);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const siteName = settings?.siteName || 'AMOHA Mobiles';
  const tagline = settings?.tagline || 'Explore Plus';
  const announcement = settings?.isAnnouncementActive && settings?.announcement
    ? settings.announcement
    : `Free shipping on orders above Rs.${settings?.freeDeliveryAbove ?? 999}`;
  const contactPhone = settings?.contactPhone || '+91 98765 43210';

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    router.replace('/login');
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/98 backdrop-blur-xl dark:border-white/[0.06] dark:bg-[var(--header-bg)] dark:backdrop-blur-xl">
      {/* Top bar */}
      <div className="border-b border-slate-100 bg-slate-50/60 dark:border-white/[0.05] dark:bg-surface/60">
        <div className="page-container flex items-center justify-between py-1.5 text-xs text-slate-500 dark:text-white/90">
          <span className="truncate text-xs font-medium text-slate-600 dark:text-white mr-2">{announcement}</span>
          <span className="hidden flex-shrink-0 text-xs font-medium text-slate-600 dark:text-white sm:inline">Support: {contactPhone}</span>
        </div>
      </div>

      {/* Main header */}
      <div className="page-container">
        <div className="flex h-14 items-center gap-4 sm:h-16">
          {/* Logo */}
          <Link href="/" prefetch={true} className="flex flex-shrink-0 items-center gap-2">
            {settings?.logo ? (
              <Image
                src={settings.logo}
                alt={siteName}
                width={36}
                height={36}
                priority
                className="h-9 w-9 rounded-xl object-contain"
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary font-bold text-white">
                {siteName.charAt(0)}
              </div>
            )}
            <div className="hidden sm:block">
              <span className="text-lg font-bold text-slate-900 dark:text-white">{siteName}</span>
              <p className="text-[11px] -mt-1 font-medium italic text-slate-500 dark:text-white/90">{tagline.split(' ').map((w, i) => i === tagline.split(' ').length - 1 ? <span key={i} className="text-accent-500 dark:text-accent-400">{w}</span> : w + ' ')}</p>
            </div>
          </Link>

          {/* Desktop search */}
          <div className="hidden flex-1 max-w-xl lg:block">
            <SearchBar />
          </div>

          {/* Nav actions */}
          <div className="ml-auto flex items-center gap-0.5 sm:gap-1">
            {/* Mobile search toggle */}
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="rounded-lg p-2.5 text-slate-500 transition-all duration-150 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-white lg:hidden"
            >
              <HiOutlineSearch className="h-5 w-5" />
            </button>

            {/* Products */}
            <Link
              href="/products"
              prefetch={true}
              className={`hidden sm:flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 ${
                pathname === '/products' || pathname.startsWith('/products?')
                  ? 'bg-accent-50 text-accent-700 dark:bg-accent-500/10 dark:text-accent-400'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-white'
              }`}
            >
              <HiOutlineCollection className="h-4 w-4" />
              <span className="hidden md:inline">Products</span>
            </Link>

            {/* Services */}
            <Link
              href="/services"
              prefetch={true}
              className={`hidden sm:flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 ${
                pathname === '/services'
                  ? 'bg-accent-50 text-accent-700 dark:bg-accent-500/10 dark:text-accent-400'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-white'
              }`}
            >
              <HiOutlineCog className="h-4 w-4" />
              <span className="hidden md:inline">Services</span>
            </Link>

            {/* Orders */}
            <Link
              href="/orders"
              prefetch={true}
              className={`hidden sm:flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 ${
                pathname === '/orders'
                  ? 'bg-accent-50 text-accent-700 dark:bg-accent-500/10 dark:text-accent-400'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-white'
              }`}
            >
              <HiOutlineClipboardList className="h-4 w-4" />
              <span className="hidden md:inline">Orders</span>
            </Link>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Wishlist - hidden on mobile, bottom nav handles it */}
            <Link
              href="/wishlist"
              prefetch={true}
              className="relative hidden rounded-lg p-2 text-slate-500 transition-all duration-150 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-white sm:block"
            >
              <HiOutlineHeart className="h-5 w-5" />
              {wishlistCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Compare - hidden on mobile */}
            <Link
              href="/compare"
              prefetch={true}
              className="relative hidden rounded-lg p-2 text-slate-500 transition-all duration-150 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-white sm:block"
            >
              <HiOutlineSwitchHorizontal className="h-5 w-5" />
              {compareCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent-500 text-[10px] font-bold text-white">
                  {compareCount}
                </span>
              )}
            </Link>

            {/* Cart */}
            <Link
              href="/cart"
              prefetch={true}
              className="relative rounded-lg p-2 text-slate-500 transition-all duration-150 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-white"
            >
              <HiOutlineShoppingBag className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-slate-800 text-[10px] font-bold text-white dark:bg-accent-500">
                  {totalItems}
                </span>
              )}
            </Link>

            {/* Profile Dropdown - hidden on mobile, bottom nav Account handles it */}
            <div className="relative hidden sm:block">
              {isAuthenticated ? (
                <>
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center gap-1.5 rounded-lg px-2 py-2 text-slate-600 transition-all duration-150 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-white sm:px-3"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700 dark:bg-surface-200 dark:text-slate-300">
                      {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <span className="hidden text-sm font-medium md:inline">{user?.name?.split(' ')[0] || 'Account'}</span>
                  </button>

                  {isProfileOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)} />
                      <div className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-premium dark:border-white/[0.08] dark:bg-surface-100 dark:shadow-[var(--shadow-premium)] dark:backdrop-blur-xl">
                        <div className="border-b border-gray-100 p-3 dark:border-white/[0.08]">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">{user?.name}</p>
                          <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                        </div>
                        <div className="py-1">
                          <Link href="/profile" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-slate-600 transition-all duration-150 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/[0.05] dark:hover:text-white">
                            <HiOutlineUser className="h-4 w-4" /> My Profile
                          </Link>
                          <Link href="/orders" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-slate-600 transition-all duration-150 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/[0.05] dark:hover:text-white">
                            <HiOutlineClipboardList className="h-4 w-4" /> My Orders
                          </Link>
                          <Link href="/wishlist" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-slate-600 transition-all duration-150 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/[0.05] dark:hover:text-white">
                            <HiOutlineHeart className="h-4 w-4" /> My Wishlist
                          </Link>
                          <Link href="/returns" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-slate-600 transition-all duration-150 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/[0.05] dark:hover:text-white">
                            <HiOutlineRefresh className="h-4 w-4" /> My Returns
                          </Link>
                          <Link href="/wallet" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-slate-600 transition-all duration-150 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/[0.05] dark:hover:text-white">
                            <HiOutlineCreditCard className="h-4 w-4" /> My Wallet
                          </Link>
                        </div>
                        <div className="border-t border-gray-100 py-1 dark:border-white/[0.08]">
                          <button onClick={() => { setIsProfileOpen(false); handleLogout(); }} className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-red-500 transition-all duration-150 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10">
                            <HiOutlineLogout className="h-4 w-4" /> Sign Out
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center gap-1.5 rounded-lg px-2 py-2 text-sm font-medium text-slate-600 transition-all duration-150 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-white sm:px-3"
                >
                  <HiOutlineUser className="h-5 w-5" />
                  <span className="hidden md:inline">Login</span>
                </Link>
              )}
            </div>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="rounded-lg p-2 text-slate-500 transition-all duration-150 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-white sm:hidden"
            >
              {isMobileMenuOpen ? <HiOutlineX className="h-5 w-5" /> : <HiOutlineMenu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile search */}
        {isSearchOpen && (
          <div className="border-t border-gray-100 py-3 dark:border-white/[0.06] lg:hidden animate-slide-down">
            <SearchBar onSelect={() => setIsSearchOpen(false)} />
          </div>
        )}
      </div>

      {/* Mobile menu - simplified since bottom nav handles primary navigation */}
      {isMobileMenuOpen && (
        <div className="border-t border-slate-100 bg-white/98 backdrop-blur-xl dark:border-white/[0.05] dark:bg-surface-50 sm:hidden animate-slide-down">
          <nav className="page-container flex flex-col py-3">
            <Link href="/services" onClick={() => setIsMobileMenuOpen(false)} className={`rounded-lg px-4 py-3 text-sm font-medium transition-all duration-150 ${pathname === '/services' ? 'bg-accent-50 text-accent-700 dark:bg-accent-500/10 dark:text-accent-400' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-white'}`}>
              Services
            </Link>
            <Link href="/compare" onClick={() => setIsMobileMenuOpen(false)} className={`rounded-lg px-4 py-3 text-sm font-medium transition-all duration-150 ${pathname === '/compare' ? 'bg-accent-50 text-accent-700 dark:bg-accent-500/10 dark:text-accent-400' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-white'}`}>
              Compare {compareCount > 0 && `(${compareCount})`}
            </Link>
            <Link href="/orders" onClick={() => setIsMobileMenuOpen(false)} className={`rounded-lg px-4 py-3 text-sm font-medium transition-all duration-150 ${pathname === '/orders' ? 'bg-accent-50 text-accent-700 dark:bg-accent-500/10 dark:text-accent-400' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-white'}`}>
              My Orders
            </Link>
            {isAuthenticated && (
              <div className="mt-2 border-t border-gray-100 pt-2 dark:border-white/[0.08]">
                <button onClick={() => { setIsMobileMenuOpen(false); handleLogout(); }} className="w-full rounded-lg px-4 py-3 text-left text-sm font-medium text-red-500 transition-all duration-150 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10">
                  Sign Out
                </button>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
