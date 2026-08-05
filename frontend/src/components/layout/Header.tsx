'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Smartphone, Wrench, Package, FileText, Home, ShoppingBag, ArrowRightLeft, Phone, Search, Menu, X, User, Heart, LogOut, CreditCard, RefreshCw, Inbox, Settings, ClipboardList, Sun, Moon } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTheme } from 'next-themes';
import { useAuthStore } from '@/store/auth.store';
import { useCartStore } from '@/store/cart.store';
import { useWishlistStore } from '@/store/wishlist.store';
import { useCompareStore } from '@/store/compare.store';
import { useSettingsStore } from '@/store/settings.store';
import SearchBar from '@/components/ui/SearchBar';
import ThemeToggle from '@/components/ui/ThemeToggle';

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSearchActive, setIsMobileSearchActive] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [promoIndex, setPromoIndex] = useState(0);
  const [headerHeight, setHeaderHeight] = useState(108); // 68px height + 16px top margin + 24px bottom space

  const headerRef = useRef<HTMLElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
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
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    if (isProfileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileOpen]);

  useEffect(() => {
    const updateHeight = () => {
      if (headerRef.current) {
        // offsetHeight of the header + 16px top offset + 24px bottom breathing space
        setHeaderHeight(headerRef.current.offsetHeight + 16 + 24);
      }
    };
    
    updateHeight();
    // Update on resize in case of layout changes
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

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
    { name: 'Home', href: '/', icon: Home },
    { name: 'Service', href: '/services', icon: Wrench },
    { name: 'Orders', href: '/orders', icon: Package },
    { name: 'Wishlist', href: '/wishlist', icon: Heart },
    { name: 'Compare', href: '/compare', icon: ArrowRightLeft },
  ];

  return (
    <>
      <header ref={headerRef} className="fixed top-4 left-0 right-0 z-50 w-full max-w-[1400px] mx-auto px-4 transition-all duration-300">
        <div className="relative flex items-center justify-between h-[68px] px-3 rounded-full bg-white dark:bg-[#121212] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.08)] border border-slate-100 dark:border-white/10">
        
        {/* Left: Logo */}
        <div className={`items-center gap-3 overflow-hidden ${isMobileSearchActive ? 'hidden lg:flex' : 'flex'}`}>
          <Link href="/" prefetch={true} className="flex items-center gap-2 group ml-1 sm:ml-2 overflow-hidden">
            <div className="flex h-[38px] w-[38px] sm:h-[42px] sm:w-[42px] items-center justify-center rounded-xl bg-[#3b82f6] font-bold text-white shadow-sm text-lg sm:text-xl transition-transform group-hover:scale-105 shrink-0">
              {siteName.charAt(0)}
            </div>
            <div className="flex flex-col justify-center min-w-0">
              <span className="text-[13px] sm:text-[16px] font-extrabold text-slate-900 dark:text-white tracking-tight leading-none truncate">{siteName.toUpperCase()}</span>
              <span className="text-[9px] sm:text-[11px] font-medium text-[#3b82f6] italic mt-0.5 truncate">{tagline}</span>
            </div>
          </Link>
        </div>

        {/* Search Area */}
        <div className={`transition-all duration-300 ${isMobileSearchActive ? 'absolute inset-0 px-3 bg-white dark:bg-[#121212] rounded-full z-50 flex items-center' : 'hidden lg:block lg:flex-1 lg:max-w-md xl:max-w-lg ml-4 xl:ml-8'}`}>
          <SearchBar onSelect={() => setIsMobileSearchActive(false)} className="flex-1" />
          {isMobileSearchActive && (
            <button onClick={() => setIsMobileSearchActive(false)} className="lg:hidden ml-2 p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Middle Right: Navigation */}
        <div className={`flex-1 items-center justify-end gap-1 xl:gap-2 px-4 xl:pr-10 ${isMobileSearchActive ? 'hidden' : 'hidden lg:flex'}`}>
          {desktopNavLinks.map((link) => {
            const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(`${link.href}?`));
            return (
              <Link 
                key={link.name} 
                href={link.href} 
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-[14px] font-bold transition-colors ${
                  isActive 
                    ? 'bg-[#eff6ff] text-[#3b82f6] dark:bg-[#3b82f6]/10' 
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <link.icon className="h-[16px] w-[16px]" />
                {link.name}
              </Link>
            );
          })}
        </div>

        {/* Right: Profile Toggle */}
        <div className={`items-center gap-1 sm:gap-3 mr-1 sm:mr-2 shrink-0 ${isMobileSearchActive ? 'hidden lg:flex' : 'flex'}`}>
          
          {/* Mobile Search Toggle */}
          <button
            onClick={() => setIsMobileSearchActive(true)}
            className="lg:hidden p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
          >
            <Search className="h-[22px] w-[22px]" />
          </button>

          {/* Mobile Cart Link */}
          <Link href="/cart" className="lg:hidden relative p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-all">
            <ShoppingBag className="h-[22px] w-[22px]" />
            {totalItems > 0 && (
              <span className="absolute top-0 right-0 h-[16px] min-w-[16px] px-1 flex items-center justify-center rounded-full bg-[#0ea5e9] text-[9px] font-bold text-white shadow-sm">
                {totalItems}
              </span>
            )}
          </Link>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="lg:hidden p-2 rounded-full text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
          >
            <Menu className="h-[24px] w-[24px]" />
          </button>

          {/* Desktop User Profile Pill Button */}
          <div className="hidden lg:block">
          {isAuthenticated ? (
            <div className="relative" ref={profileDropdownRef}>
              <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 h-[42px] px-5 rounded-full bg-[#0ea5e9] text-white font-bold hover:bg-[#0284c7] transition-colors shadow-sm"
              >
                <User className="h-[18px] w-[18px]" />
                <span className="hidden sm:block text-[14px] uppercase">{user?.name || 'Profile'}</span>
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 top-[calc(100%+12px)] w-[280px] bg-white/95 backdrop-blur-xl dark:bg-[#1a1a2e]/95 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/50 dark:border-white/10 overflow-hidden z-50 animate-in fade-in zoom-in-95 origin-top-right">
                  <div className="p-5 pb-3">
                    <p className="font-extrabold text-[15px] text-slate-900 dark:text-white truncate tracking-tight">{user?.name ? user.name.toUpperCase() : 'USER'}</p>
                    <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400 truncate mt-0.5">{user?.email || 'user@example.com'}</p>
                  </div>
                  <div className="py-2 px-3 space-y-1">
                    <Link href="/profile" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-3.5 px-3 py-2.5 rounded-xl hover:bg-slate-100/80 dark:hover:bg-white/10 transition-colors text-slate-700 dark:text-slate-200 font-semibold group">
                      <User className="h-[18px] w-[18px] text-slate-500 group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-white transition-colors" />
                      <span className="text-[14px]">My Profile</span>
                    </Link>
                    <Link href="/orders" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-3.5 px-3 py-2.5 rounded-xl hover:bg-slate-100/80 dark:hover:bg-white/10 transition-colors text-slate-700 dark:text-slate-200 font-semibold group">
                      <Package className="h-[18px] w-[18px] text-slate-500 group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-white transition-colors" />
                      <span className="text-[14px]">My Orders</span>
                    </Link>
                    <Link href="/my-requests" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-3.5 px-3 py-2.5 rounded-xl hover:bg-slate-100/80 dark:hover:bg-white/10 transition-colors text-slate-700 dark:text-slate-200 font-semibold group">
                      <FileText className="h-[18px] w-[18px] text-slate-500 group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-white transition-colors" />
                      <span className="text-[14px]">Service Requests</span>
                    </Link>
                    <Link href="/wishlist" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-3.5 px-3 py-2.5 rounded-xl hover:bg-slate-100/80 dark:hover:bg-white/10 transition-colors text-slate-700 dark:text-slate-200 font-semibold group">
                      <Heart className="h-[18px] w-[18px] text-slate-500 group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-white transition-colors" />
                      <span className="text-[14px]">Wishlist</span>
                    </Link>
                    <button 
                      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} 
                      className="w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl hover:bg-slate-100/80 dark:hover:bg-white/10 transition-colors text-slate-700 dark:text-slate-200 font-semibold group"
                    >
                      {mounted && theme === 'dark' ? (
                        <Sun className="h-[18px] w-[18px] text-slate-500 group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-white transition-colors" />
                      ) : (
                        <Moon className="h-[18px] w-[18px] text-slate-500 group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-white transition-colors" />
                      )}
                      <span className="text-[14px]">{mounted && theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                    </button>
                    <Link href="/cart" onClick={() => setIsProfileOpen(false)} className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-100/80 dark:hover:bg-white/10 transition-colors text-slate-700 dark:text-slate-200 font-semibold group">
                      <div className="flex items-center gap-3.5">
                        <ShoppingBag className="h-[18px] w-[18px] text-slate-500 group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-white transition-colors" />
                        <span className="text-[14px]">My Cart</span>
                      </div>
                      {totalItems > 0 && (
                        <span className="flex h-[20px] min-w-[20px] items-center justify-center rounded-full bg-[#0ea5e9] px-1.5 text-[11px] font-bold text-white shadow-sm">
                          {totalItems}
                        </span>
                      )}
                    </Link>
                  </div>
                  <div className="py-2 px-3 border-t border-slate-100/80 dark:border-white/10 mt-1">
                    <button 
                      onClick={() => {
                        setIsProfileOpen(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors text-[#e11d48] font-bold"
                    >
                      <LogOut className="h-[18px] w-[18px]" />
                      <span className="text-[14px]">Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link href="/login" className="flex items-center gap-2 h-[42px] px-5 rounded-full bg-[#0ea5e9] text-white font-bold hover:bg-[#0284c7] transition-colors shadow-sm">
              <User className="h-[18px] w-[18px]" />
              <span className="hidden sm:block text-[14px]">Profile</span>
            </Link>
          )}
          </div>
        </div>
      </div>

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
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[15px] font-bold transition-colors ${isActive ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400' : 'text-slate-700 dark:text-slate-200 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-500/10 dark:hover:text-blue-400'}`}
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
                    className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl bg-[#0ea5e9] text-white font-bold shadow-sm"
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
      {/* Dynamic spacer to push page content below the fixed header */}
      <div style={{ height: `${headerHeight}px` }} className="w-full shrink-0" aria-hidden="true" />
    </>
  );
}

// Force Next.js Fast Refresh 2
