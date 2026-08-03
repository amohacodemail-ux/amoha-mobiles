'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Home,
  ShoppingBag, 
  Heart, 
  User, 
  Menu, 
  X, 
  Search, 
  Package, 
  LogOut, 
  Smartphone, 
  Wrench, 
  ArrowRightLeft, 
  RefreshCcw, 
  CreditCard, 
  FileText,
  Phone
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/auth.store';
import { useCartStore } from '@/store/cart.store';
import { useWishlistStore } from '@/store/wishlist.store';
import { useCompareStore } from '@/store/compare.store';
import { useSettingsStore } from '@/store/settings.store';
import SearchBar from '@/components/ui/SearchBar';
import ThemeToggle from '@/components/ui/ThemeToggle';

const PROMO_MESSAGES = [
  'Free Delivery on all orders',
  'No Cost EMI Available',
  'Best Exchange Offers',
  'Same Day Delivery in select cities'
];

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [promoIndex, setPromoIndex] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  
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

  const [lastViewedCartCount, setLastViewedCartCount] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem('lastViewedCartCount');
    if (saved) setLastViewedCartCount(parseInt(saved, 10));
  }, []);

  useEffect(() => {
    if (pathname === '/cart') {
      setLastViewedCartCount(totalItems);
      localStorage.setItem('lastViewedCartCount', totalItems.toString());
    }
  }, [pathname, totalItems]);

  const unreadCartCount = totalItems > lastViewedCartCount ? totalItems - lastViewedCartCount : 0;

  useEffect(() => { 
    fetchSettings(); 
  }, [fetchSettings]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setPromoIndex((prev) => (prev + 1) % PROMO_MESSAGES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const siteName = settings?.siteName || 'AMOHA Mobiles';
  const tagline = settings?.tagline || 'Your Trusted Mobile Partner';
  const contactPhone = settings?.contactPhone || '+91 98765 43210';

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    router.replace('/login');
  };

  const navLinks = [
    { name: 'Products', href: '/products', icon: Smartphone },
    { name: 'Services', href: '/services', icon: Wrench },
    { name: 'Orders', href: '/orders', icon: Package },
    { name: 'Requests', href: '/my-requests', icon: FileText },
  ];

  const desktopNavLinks = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Service', href: '/services', icon: Wrench },
    { name: 'Orders', href: '/orders', icon: Package },
    { name: 'Cart', href: '/cart', icon: ShoppingBag },
    { name: 'Compare', href: '/compare', icon: ArrowRightLeft },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/98 backdrop-blur-xl dark:border-white/[0.06] dark:bg-[var(--header-bg)] dark:backdrop-blur-xl">
      {/* Top bar - Dark mode visibility fix */}
      <div className="border-b border-slate-100 bg-slate-50/60 dark:border-slate-700/50 dark:bg-slate-900/80">
        <div className="page-container flex items-center justify-between py-1.5 text-xs text-slate-500 dark:text-white">
          <span className="truncate text-xs font-medium text-slate-600 dark:!text-white mr-2">{announcement}</span>
          <span className="hidden flex-shrink-0 text-xs font-medium text-slate-600 dark:!text-white sm:inline">Support: {contactPhone}</span>
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
              className={`hidden sm:flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 ${pathname === '/products' || pathname.startsWith('/products?')
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
              className={`hidden sm:flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 ${pathname === '/services'
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
              className={`hidden sm:flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 ${pathname === '/orders'
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
                <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 font-bold text-white shadow-sm transition-transform duration-300 group-hover:scale-105 shrink-0">
                  {siteName.charAt(0)}
                </div>
              )}
              <div className="flex flex-col justify-center overflow-hidden min-w-0">
                <span className="text-[18px] md:text-[19px] font-bold text-slate-900 dark:text-white leading-tight tracking-tight whitespace-nowrap overflow-hidden text-ellipsis uppercase">
                  {siteName}
                </span>
                <span className="text-[12px] font-medium text-slate-500 dark:text-slate-400 leading-tight whitespace-nowrap overflow-hidden text-ellipsis">
                  {tagline}
                </span>
              </div>
              </Link>

              {/* Desktop Search Bar */}
              <div className="hidden lg:block flex-1 w-full min-w-[160px] max-w-[280px] xl:max-w-[320px] [&_.glass-input]:!rounded-full [&_.glass-input]:!border-gray-200 [&_.glass-input]:!bg-white [&_.glass-input]:!shadow-sm [&_.glass-input]:!py-2 dark:[&_.glass-input]:!bg-[#12121c] dark:[&_.glass-input]:!border-white/10">
                <SearchBar />
              </div>
            </div>

            {/* Right Group: Desktop Navigation Links + Actions */}
            <div className="flex items-center justify-end gap-1 sm:gap-4 xl:gap-6">
              
              <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
              {desktopNavLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href || pathname.startsWith(`${link.href}?`);
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    prefetch={true}
                    className={`group flex items-center gap-1.5 px-3 py-2 rounded-full text-[14px] font-medium transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] ${
                      isActive
                        ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10'
                        : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 md:hover:-translate-y-[1px] md:hover:shadow-sm dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white'
                    }`}
                  >
                    <Icon className={`w-4 h-4 transition-transform duration-300 text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300 ${isActive ? 'text-blue-600' : 'group-hover:scale-110'}`} />
                    {link.name}
                  </Link>
                );
              })}
              </nav>

              {/* Actions */}
              <div className="flex items-center gap-1 sm:gap-2">
                {/* Mobile Search Toggle */}
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="md:hidden p-1.5 rounded-full text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10 transition-all hover:scale-110"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Mobile Cart */}
              <Link
                href="/cart"
                prefetch={true}
                className="md:hidden relative p-1.5 rounded-full text-slate-600 hover:bg-slate-100 hover:text-blue-600 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-blue-400 transition-all hover:scale-110"
              >
                <ShoppingBag className="w-5 h-5" />
                {unreadCartCount > 0 && (
                  <span className={`absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white border-2 border-white dark:border-[#0a0a0a] ${
                    'animate-[bounce_0.5s_ease-in-out]'
                  }`}
                  key={unreadCartCount}
                  >
                    {unreadCartCount}
                  </span>
                )}
              </Link>

              {/* Profile Dropdown */}
              <div className="relative hidden md:block ml-1">
                {isAuthenticated ? (
                  <>
                    <button
                      onClick={() => setIsProfileOpen(!isProfileOpen)}
                      className="group flex items-center gap-2 py-2 pl-3 pr-4 rounded-full bg-[#0EA5FF] transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] hover:scale-[1.03] focus:outline-none"
                    >
                      <User className="w-4 h-4 text-white" />
                      <span className="text-[14px] font-medium text-white">
                        {user?.name ? user.name.split(' ')[0] : 'Profile'}
                      </span>
                    </button>

                    {isProfileOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)} />
                        <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-56 overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 backdrop-blur-xl shadow-xl dark:border-white/10 dark:bg-[#121212]/90 animate-slide-down">
                          <div className="border-b border-slate-100 dark:border-white/10 p-4 bg-slate-50/50 dark:bg-white/[0.02]">
                            <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user?.name}</p>
                            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate mt-0.5">{user?.email}</p>
                          </div>
                          <div className="p-2 space-y-0.5">
                            <Link href="/profile" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold text-slate-600 transition-all hover:bg-blue-50 hover:text-blue-600 dark:text-slate-300 dark:hover:bg-blue-500/10 dark:hover:text-blue-400">
                              <User className="w-4 h-4" /> My Profile
                            </Link>
                            <Link href="/orders" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold text-slate-600 transition-all hover:bg-blue-50 hover:text-blue-600 dark:text-slate-300 dark:hover:bg-blue-500/10 dark:hover:text-blue-400">
                              <Package className="w-4 h-4" /> My Orders
                            </Link>
                            <Link href="/my-requests" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold text-slate-600 transition-all hover:bg-blue-50 hover:text-blue-600 dark:text-slate-300 dark:hover:bg-blue-500/10 dark:hover:text-blue-400">
                              <FileText className="w-4 h-4" /> Service Requests
                            </Link>
                            <Link href="/wishlist" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold text-slate-600 transition-all hover:bg-blue-50 hover:text-blue-600 dark:text-slate-300 dark:hover:bg-blue-500/10 dark:hover:text-blue-400">
                              <Heart className="w-4 h-4" /> Wishlist
                            </Link>
                          </div>
                          <div className="p-2 border-t border-slate-100 dark:border-white/10">
                            <button onClick={() => { setIsProfileOpen(false); handleLogout(); }} className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-bold text-rose-600 transition-all hover:bg-rose-50 dark:text-rose-500 dark:hover:bg-rose-500/10">
                              <LogOut className="w-4 h-4" /> Sign Out
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <Link
                    href="/login"
                    className="group flex items-center gap-2 px-5 py-2 rounded-full bg-[#0EA5FF] transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] hover:scale-[1.03] text-[14px] font-medium text-white"
                  >
                    <User className="w-4 h-4" /> Profile
                  </Link>
                )}
              </div>

              {/* Mobile Hamburger Menu */}
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden p-1.5 rounded-full text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10 transition-all"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
            </div> {/* End Right Group */}
          </div>

          {/* Mobile Search Bar Dropdown */}
          {isSearchOpen && (
            <div className="md:hidden pb-4 pt-1 animate-slide-down">
              <SearchBar onSelect={() => setIsSearchOpen(false)} />
            </div>
          )}
        </div>
      </div>

      {/* Mobile Side Drawer Navigation */}
      {isMobileMenuOpen && (
        <>
          <div className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm lg:hidden transition-opacity" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="fixed inset-y-0 right-0 z-[70] w-[280px] bg-white dark:bg-[#121212] shadow-2xl lg:hidden flex flex-col transform transition-transform duration-300 animate-[slideInRight_0.3s_ease-out]">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-white/10">
              <span className="text-lg font-bold text-slate-900 dark:text-white">Menu</span>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href || pathname.startsWith(`${link.href}?`);
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400'
                        : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {link.name}
                  </Link>
                );
              })}
              
              <div className="my-4 border-t border-slate-100 dark:border-white/10" />
              
              <Link href="/compare" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-white/5 transition-all">
                <ArrowRightLeft className="w-5 h-5" />
                Compare {compareCount > 0 && <span className="ml-auto bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400 py-0.5 px-2 rounded-full text-[10px]">{compareCount}</span>}
              </Link>
              <div className="px-4 py-3">
                <ThemeToggle />
              </div>
            </div>

            {isAuthenticated ? (
              <div className="p-4 border-t border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02]">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white shadow-sm">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user?.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
                  </div>
                </div>
                <button onClick={() => { setIsMobileMenuOpen(false); handleLogout(); }} className="flex w-full items-center justify-center gap-2 py-2.5 rounded-xl bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-white/10 text-sm font-bold text-rose-600 transition-all hover:bg-rose-50 dark:text-rose-500 shadow-sm">
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            ) : (
              <div className="p-4 border-t border-slate-100 dark:border-white/10">
                <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="flex w-full items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 text-sm font-bold text-white transition-all hover:bg-blue-700 shadow-sm">
                  <User className="w-4 h-4" /> Login to Account
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </header>
  );
}
