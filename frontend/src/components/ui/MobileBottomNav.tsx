'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, LayoutGrid, Package, Heart, User } from 'lucide-react';
import { useCartStore } from '@/store/cart.store';
import { useWishlistStore } from '@/store/wishlist.store';
import { useAuthStore } from '@/store/auth.store';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const wishlistItems = useWishlistStore((s) => Array.isArray(s.items) ? s.items : []);
  const { isAuthenticated } = useAuthStore();

  const tabs = [
    {
      href: '/',
      label: 'Home',
      icon: Home,
      match: (p: string) => p === '/',
    },
    {
      href: '/products',
      label: 'Categories',
      icon: LayoutGrid,
      match: (p: string) => p === '/products' || p.startsWith('/products?') || p === '/search' || p === '/categories',
    },
    {
      href: isAuthenticated ? '/orders' : '/login',
      label: 'Orders',
      icon: Package,
      match: (p: string) => p === '/orders' || p.startsWith('/orders/'),
    },
    {
      href: '/wishlist',
      label: 'Wishlist',
      icon: Heart,
      badge: wishlistItems.length,
      match: (p: string) => p === '/wishlist',
    },
    {
      href: isAuthenticated ? '/profile' : '/login',
      label: 'Profile',
      icon: User,
      match: (p: string) => p === '/profile' || p === '/login' || p === '/register' || p === '/my-requests' || p.startsWith('/my-requests/'),
    },
  ];

  return (
    <div className="sm:hidden fixed bottom-5 left-4 right-4 z-50 pb-[env(safe-area-inset-bottom)] pointer-events-none">
      <nav className="pointer-events-auto flex items-center justify-between px-1.5 py-1.5 rounded-full bg-white/90 dark:bg-[#1a1a1a]/90 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
        {tabs.map((tab) => {
          const active = tab.match(pathname);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              prefetch={true}
              className={`relative flex items-center justify-center rounded-full transition-all duration-300 active:scale-95 ${
                active
                  ? 'bg-[#0EA5FF] text-white shadow-md px-3.5 py-2'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white p-2'
              }`}
            >
              <div className="relative flex items-center justify-center shrink-0">
                <Icon className="h-[22px] w-[22px]" />
                {tab.badge && tab.badge > 0 ? (
                  <span className={`absolute -right-1.5 -top-1.5 flex h-[15px] min-w-[15px] items-center justify-center rounded-full px-1 text-[8px] font-bold border-2 ${
                    active ? 'bg-white text-[#0EA5FF] border-[#0EA5FF]' : 'bg-rose-500 text-white border-white dark:border-[#1a1a1a]'
                  }`}>
                    {tab.badge > 9 ? '9+' : tab.badge}
                  </span>
                ) : null}
              </div>
              <div className={`overflow-hidden transition-all duration-300 flex items-center ${active ? 'w-auto max-w-[100px] opacity-100 ml-1.5' : 'w-0 max-w-0 opacity-0 ml-0'}`}>
                <span className="text-[12px] font-bold whitespace-nowrap leading-none">{tab.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
