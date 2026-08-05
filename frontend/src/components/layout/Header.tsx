'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Smartphone, Wrench, Package, FileText, Home, ShoppingBag, ArrowRightLeft, Phone, Search, Menu, X, User, Heart, LogOut, CreditCard, RefreshCw, Inbox, Settings, ClipboardList } from 'lucide-react';
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
  const [promoIndex, setPromoIndex] = useState(0);
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

  const promoMessages = [
    "Free Delivery on orders above Rs.999",
    "EMI Available on major cards",
    "Best Exchange Offers",
    "Same Day Delivery in Coimbatore"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setPromoIndex((prev) => (prev + 1) % promoMessages.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isMobileMenuOpen]);

  const siteName = settings?.siteName || 'AMOHA MOBILES';
  const tagline = settings?.tagline || 'Your Trusted Mobile Partner';
  const contactPhone = settings?.contactPhone || '+91 7339179183';

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    router.replace('/login');
  };

  const desktopNavLinks = [
    { name: 'Products', href: '/products', icon: Inbox },
    { name: 'Services', href: '/services', icon: Settings },
    { name: 'Orders', href: '/orders', icon: ClipboardList },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-white dark:bg-[#121212] border-b border-slate-200 dark:border-white/10 shadow-sm transition-all duration-300">
      <div className="flex items-center justify-between h-[78px] px-4 md:px-8 max-w-[1600px] mx-auto relative z-40">
        
        {/* Left: Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="lg:hidden p-2 rounded-full text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
          >
            <Menu className="h-6 w-6" />
          </button>
          <Link href="/" prefetch={true} className="flex items-center gap-3 group">
            <div className="flex h-[44px] w-[44px] items-center justify-center rounded-2xl bg-[#0F829D] font-bold text-white shadow-sm text-xl transition-transform group-hover:scale-105">
              {siteName.charAt(0)}
            </div>
            <div className="hidden xl:flex flex-col justify-center">
              <span className="text-[17px] font-extrabold text-slate-900 dark:text-white tracking-tight leading-none">{siteName.toUpperCase()}</span>
              <span className="text-[11px] font-medium text-[#0F829D] italic mt-0.5">{tagline}</span>
            </div>
          </Link>
        </div>

        {/* Middle: Search */}
        <div className="hidden lg:flex flex-1 justify-center px-8">
          <div className="w-full max-w-[600px]">
            <SearchBar />
          </div>
        </div>

        {/* Right: Actions & Icons */}
        <div className="flex items-center gap-1 sm:gap-2">
          
          <div className="hidden lg:flex items-center gap-2 text-slate-600 dark:text-slate-300 mr-2">
            {desktopNavLinks.map((link) => (
              <Link key={link.name} href={link.href} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors relative group">
                <link.icon className="h-[22px] w-[22px]" />
                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap pointer-events-none">
                  {link.name}
                </span>
              </Link>
            ))}
          </div>

          <div className="h-6 w-px bg-slate-200 dark:bg-white/10 hidden lg:block mx-2"></div>
          
          <div className="flex items-center gap-1 sm:gap-2">
            <ThemeToggle />

            {/* Mobile Search Toggle */}
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="lg:hidden p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
            >
              <Search className="h-5 w-5" />
            </button>

            <Link href="/wishlist" className="relative p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-all">
              <Heart className="h-[22px] w-[22px]" />
              {wishlistCount > 0 && (
                <span className="absolute top-0 right-0 h-[18px] min-w-[18px] px-1 flex items-center justify-center rounded-full bg-[#f43f5e] text-[10px] font-bold text-white shadow-sm border-2 border-white dark:border-[#121212]">
                  {wishlistCount}
                </span>
              )}
            </Link>

            <Link href="/compare" className="relative p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-all">
              <ArrowRightLeft className="h-[22px] w-[22px]" />
              {compareCount > 0 && (
                <span className="absolute top-0 right-0 h-[18px] min-w-[18px] px-1 flex items-center justify-center rounded-full bg-slate-900 dark:bg-white text-[10px] font-bold text-white dark:text-slate-900 shadow-sm border-2 border-white dark:border-[#121212]">
                  {compareCount}
                </span>
              )}
            </Link>

            <Link href="/cart" className="relative p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-all">
              <ShoppingBag className="h-[22px] w-[22px]" />
              {totalItems > 0 && (
                <span className="absolute top-0 right-0 h-[18px] min-w-[18px] px-1 flex items-center justify-center rounded-full bg-slate-900 dark:bg-white text-[10px] font-bold text-white dark:text-slate-900 shadow-sm border-2 border-white dark:border-[#121212]">
                  {totalItems}
                </span>
              )}
            </Link>

            {/* User Profile */}
            <div className="ml-2">
              {isAuthenticated ? (
                <Link href="/profile" className="flex items-center justify-center h-[38px] w-[38px] rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-[15px] hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </Link>
              ) : (
                <Link href="/login" className="flex items-center justify-center h-[38px] w-[38px] rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                  <User className="h-5 w-5" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Search Overlay */}
      {isSearchOpen && (
        <div className="lg:hidden absolute top-[78px] left-0 right-0 bg-white dark:bg-[#121212] p-4 border-b border-slate-100 dark:border-white/10 z-40 animate-in fade-in slide-in-from-top-2">
          <SearchBar onSelect={() => setIsSearchOpen(false)} />
        </div>
      )}

      {/* Mobile Nav Drawer */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-[100] flex">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="relative w-[280px] h-full bg-white dark:bg-[#0a0a0f] shadow-2xl flex flex-col animate-in slide-in-from-left">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-white/10">
              <span className="font-extrabold text-lg text-slate-900 dark:text-white">Menu</span>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              <nav className="space-y-1">
                {desktopNavLinks.map((link) => {
                  const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(`${link.href}?`));
                  return (
                    <Link
                      key={link.name}
                      href={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[15px] font-bold transition-colors ${isActive ? 'bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400' : 'text-slate-700 dark:text-slate-200 hover:bg-teal-50 hover:text-teal-600 dark:hover:bg-teal-500/10 dark:hover:text-teal-400'}`}
                    >
                      <link.icon className="h-[20px] w-[20px]" />
                      {link.name}
                    </Link>
                  );
                })}
              </nav>

              <div className="mt-8 pt-6 border-t border-slate-100 dark:border-white/10">
                {isAuthenticated ? (
                  <button
                    onClick={() => { setIsMobileMenuOpen(false); handleLogout(); }}
                    className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-[15px] font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut className="h-[20px] w-[20px]" />
                    Sign Out
                  </button>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl bg-[#0F829D] text-white font-bold shadow-sm"
                  >
                    <User className="h-5 w-5" />
                    Login / Sign up
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
