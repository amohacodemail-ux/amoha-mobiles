'use client';
import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Package, Tags, Award, ShoppingCart,
  Users, Ticket, Image, Star, Settings, ChevronLeft,
  ChevronRight, Smartphone, LogOut, Menu, X, Wrench, Mail, Bell,
  Eye, AlertCircle, Users2, Barcode, FileText, RotateCcw, Wallet, Activity,
  Truck, UserCheck, Warehouse, ClipboardList, BarChart3, FileQuestion, ShoppingBag,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/auth.store';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/products', label: 'Products', icon: Package },
  { href: '/categories', label: 'Categories', icon: Tags },
  { href: '/brands', label: 'Brands', icon: Award },
  { href: '/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/reports', label: 'Reports', icon: BarChart3 },
  { href: '/users', label: 'Users', icon: Users },
  { href: '/coupons', label: 'Coupons', icon: Ticket },
  { href: '/banners', label: 'Banners', icon: Image },
  { href: '/reviews', label: 'Reviews', icon: Star },
  { href: '/service-requests', label: 'Service Requests', icon: Wrench },
  { href: '/contact-messages', label: 'Contact Messages', icon: Mail },
  { href: '/notifications', label: 'Notifications', icon: Bell },
  { href: '/product-views', label: 'User Activity', icon: Eye },
  { href: '/abandoned-carts', label: 'Abandoned Carts', icon: AlertCircle },
  { href: '/crm', label: 'CRM / Customers', icon: Users2 },
  { href: '/barcode', label: 'POS Billing', icon: Barcode },
  { href: '/returns', label: 'Returns', icon: RotateCcw },
  { href: '/wallets', label: 'Wallets', icon: Wallet },
  { href: '/activity-logs', label: 'Activity Logs', icon: Activity },
  { href: '/suppliers', label: 'Suppliers', icon: Truck },
  { href: '/supplier-entries', label: 'Supplier Entries', icon: ClipboardList },
  { href: '/rfq', label: 'RFQ', icon: FileQuestion },
  { href: '/purchase-requests', label: 'Purchase Requests', icon: ShoppingBag },
  { href: '/inventory', label: 'Inventory', icon: Warehouse },
  { href: '/policies', label: 'Policies', icon: FileText },
  { href: '/settings', label: 'Settings', icon: Settings },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { clearUser } = useAuthStore();
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    clearUser();
    authService.logout();
  };

  const handleNavigation = (href: string) => {
    startTransition(() => {
      router.push(href);
      onMobileClose();
    });
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={cn('flex items-center h-16 px-4 border-b border-sidebar-border', collapsed ? 'justify-center' : 'gap-3')}>
        <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          <Smartphone className="h-4 w-4 text-primary-foreground" />
        </div>
        {!collapsed && (
          <div>
            <p className="text-sm font-bold text-sidebar-foreground">Amoha</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Admin Panel</p>
          </div>
        )}
        <button
          onClick={onToggle}
          className="ml-auto hidden lg:flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
        <button onClick={onMobileClose} className="ml-auto lg:hidden text-muted-foreground">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <button
              key={href}
              onClick={() => handleNavigation(href)}
              disabled={isPending}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 w-full',
                active
                  ? 'bg-primary/15 text-primary border border-primary/20'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground',
                collapsed && 'justify-center px-2',
                isPending && 'opacity-50 cursor-wait',
              )}
            >
              <Icon className={cn('flex-shrink-0', active ? 'text-primary' : 'text-muted-foreground', 'h-4 w-4')} />
              {!collapsed && <span>{label}</span>}
              {collapsed && (
                <span className="sr-only">{label}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-2 border-t border-sidebar-border">
        <button
          onClick={handleLogout}
          className={cn(
            'flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors',
            collapsed && 'justify-center px-2',
          )}
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside
        className={cn(
          'hidden lg:flex flex-col fixed top-0 left-0 h-full bg-sidebar border-r border-sidebar-border z-30 transition-all duration-300',
          collapsed ? 'w-16' : 'w-60',
        )}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onMobileClose} />
          <aside className="absolute left-0 top-0 h-full w-64 bg-sidebar border-r border-sidebar-border">
            <SidebarContent />
          </aside>
        </div>
      )}
    </>
  );
}
