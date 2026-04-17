'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HiOutlineHome, HiHome, HiOutlineSearch, HiOutlineShoppingBag, HiShoppingBag, HiOutlineHeart, HiHeart, HiOutlineUser, HiUser } from 'react-icons/hi';
import { useCartStore } from '@/store/cart.store';
import { useWishlistStore } from '@/store/wishlist.store';
import { useAuthStore } from '@/store/auth.store';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { totalItems } = useCartStore();
  const wishlistItems = useWishlistStore((s) => Array.isArray(s.items) ? s.items : []);
  const { isAuthenticated } = useAuthStore();

  const tabs = [
    {
      href: '/',
      label: 'Home',
      icon: HiOutlineHome,
      activeIcon: HiHome,
      match: (p: string) => p === '/',
    },
    {
      href: '/products',
      label: 'Shop',
      icon: HiOutlineSearch,
      activeIcon: HiOutlineSearch,
      match: (p: string) => p === '/products' || p.startsWith('/products?') || p === '/search',
    },
    {
      href: '/cart',
      label: 'Cart',
      icon: HiOutlineShoppingBag,
      activeIcon: HiShoppingBag,
      badge: totalItems,
      match: (p: string) => p === '/cart' || p === '/checkout',
    },
    {
      href: '/wishlist',
      label: 'Wishlist',
      icon: HiOutlineHeart,
      activeIcon: HiHeart,
      badge: wishlistItems.length,
      match: (p: string) => p === '/wishlist',
    },
    {
      href: isAuthenticated ? '/profile' : '/login',
      label: isAuthenticated ? 'Account' : 'Login',
      icon: HiOutlineUser,
      activeIcon: HiUser,
      match: (p: string) => p === '/profile' || p === '/login' || p === '/register' || p === '/orders',
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white/95 backdrop-blur-xl dark:border-white/10 dark:bg-[#0a0a0f]/95 sm:hidden">
      <div className="flex items-center justify-around px-1">
        {tabs.map((tab) => {
          const active = tab.match(pathname);
          const Icon = active ? tab.activeIcon : tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              prefetch={true}
              className={`relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors ${
                active
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-gray-400 dark:text-gray-500'
              }`}
            >
              <div className="relative">
                <Icon className="h-5 w-5" />
                {tab.badge && tab.badge > 0 ? (
                  <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary-500 px-1 text-[9px] font-bold text-white">
                    {tab.badge > 9 ? '9+' : tab.badge}
                  </span>
                ) : null}
              </div>
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
      {/* Safe area for phones with home indicator */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
