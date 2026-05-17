'use client';
import React, { useMemo, useTransition } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Package, Tags, Award, ShoppingCart,
  Users, Ticket, Image, Star, Settings, ChevronLeft,
  ChevronRight, Smartphone, LogOut, X, Wrench, Mail, Bell,
  Eye, AlertCircle, Users2, Barcode, FileText, RotateCcw, Wallet, Activity,
  Truck, Warehouse, ClipboardList, BarChart3, FileQuestion, ShoppingBag,
  Receipt, IndianRupee, Shield, Store,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/auth.store';
import { usePermissions, getRoleDisplayName, getRoleBadgeColor, type Module } from '@/hooks/usePermissions';

// Navigation item definition with module mapping
interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  module: Module;
}

// All navigation items with their corresponding modules
const ALL_NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, module: 'dashboard' },
  { href: '/products', label: 'Products', icon: Package, module: 'products' },
  { href: '/categories', label: 'Categories', icon: Tags, module: 'categories' },
  { href: '/brands', label: 'Brands', icon: Award, module: 'brands' },
  { href: '/orders', label: 'Orders', icon: ShoppingCart, module: 'orders' },
  { href: '/billing', label: 'Billing & Invoices', icon: IndianRupee, module: 'billing' },
  { href: '/reports', label: 'Reports', icon: BarChart3, module: 'reports' },
  { href: '/users', label: 'Users', icon: Users, module: 'users' },
  { href: '/admin-users', label: 'Admin Users', icon: Shield, module: 'users' },
  { href: '/coupons', label: 'Coupons', icon: Ticket, module: 'coupons' },
  { href: '/banners', label: 'Banners', icon: Image, module: 'banners' },
  { href: '/reviews', label: 'Reviews', icon: Star, module: 'reviews' },
  { href: '/service-requests', label: 'Service Requests', icon: Wrench, module: 'service_requests' },
  { href: '/contact-messages', label: 'Contact Messages', icon: Mail, module: 'contact_messages' },
  { href: '/notifications', label: 'Notifications', icon: Bell, module: 'notifications' },
  { href: '/product-views', label: 'User Activity', icon: Eye, module: 'product_views' },
  { href: '/abandoned-carts', label: 'Abandoned Carts', icon: AlertCircle, module: 'abandoned_carts' },
  { href: '/crm', label: 'Customer Management', icon: Users2, module: 'crm' },
  { href: '/barcode', label: 'Counter POS Billing', icon: Receipt, module: 'barcode_pos' },
  { href: '/returns', label: 'Returns', icon: RotateCcw, module: 'returns' },
  { href: '/wallets', label: 'Wallets', icon: Wallet, module: 'wallets' },
  { href: '/activity-logs', label: 'Activity Logs', icon: Activity, module: 'activity_logs' },
  { href: '/suppliers', label: 'Suppliers', icon: Truck, module: 'suppliers' },
  { href: '/supplier-entries', label: 'Supplier Entries', icon: ClipboardList, module: 'supplier_entries' },
  { href: '/supplier-portal', label: 'My Portal', icon: Store, module: 'supplier_portal' },
  { href: '/rfq', label: 'RFQ', icon: FileQuestion, module: 'rfq' },
  { href: '/purchase-requests', label: 'Purchase Requests', icon: ShoppingBag, module: 'purchase_requests' },
  { href: '/inventory', label: 'Inventory', icon: Warehouse, module: 'inventory' },
  { href: '/policies', label: 'Policies', icon: FileText, module: 'policies' },
  { href: '/settings', label: 'Settings', icon: Settings, module: 'settings' },
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
  const { clearUser, user } = useAuthStore();
  const { canAccess, roleDisplayName, roleBadgeColor } = usePermissions();
  const [isPending, startTransition] = useTransition();

  // Filter navigation items based on user permissions
  const filteredNavItems = useMemo(() => {
    return ALL_NAV_ITEMS.filter(item => canAccess(item.module));
  }, [canAccess]);

  // Group items by category for better organization (optional enhancement)
  const navGroups = useMemo(() => {
    const groups: { title?: string; items: NavItem[] }[] = [
      { items: filteredNavItems.filter(i => i.module === 'dashboard') },
      {
        title: collapsed ? undefined : 'Sales',
        items: filteredNavItems.filter(i =>
          ['orders', 'billing', 'barcode_pos', 'returns', 'wallets'].includes(i.module)
        ),
      },
      {
        title: collapsed ? undefined : 'Purchase',
        items: filteredNavItems.filter(i =>
          ['products', 'categories', 'brands', 'inventory', 'suppliers', 'supplier_entries', 'supplier_portal', 'rfq', 'purchase_requests'].includes(i.module)
        ),
      },
      {
        title: collapsed ? undefined : 'Marketing',
        items: filteredNavItems.filter(i =>
          ['coupons', 'banners', 'reviews', 'crm', 'contact_messages', 'product_views', 'abandoned_carts'].includes(i.module)
        ),
      },
      {
        title: collapsed ? undefined : 'Admin',
        items: filteredNavItems.filter(i =>
          ['users', 'service_requests', 'activity_logs', 'settings'].includes(i.module)
        ),
      },
      {
        title: collapsed ? undefined : 'General',
        items: filteredNavItems.filter(i =>
          ['reports', 'notifications', 'policies'].includes(i.module)
        ),
      },
    ].filter(g => g.items.length > 0);

    return groups;
  }, [filteredNavItems, collapsed]);

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
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-sidebar-foreground">Amoha</p>
            <div className="flex items-center gap-2">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Admin Panel</p>
              {user && (
                <span className={cn(
                  'text-[9px] px-1.5 py-0.5 rounded border font-medium',
                  roleBadgeColor
                )}>
                  {roleDisplayName}
                </span>
              )}
            </div>
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
        {navGroups.map((group, groupIndex) => (
          <div key={groupIndex} className={cn('mb-4', groupIndex > 0 && 'pt-2 border-t border-sidebar-border/50')}>
            {group.title && !collapsed && (
              <p className="px-3 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                {group.title}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || pathname.startsWith(href + '/');
                return (
                  <button
                    key={href}
                    onClick={() => handleNavigation(href)}
                    disabled={isPending}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 w-full relative overflow-hidden',
                      active
                        ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground',
                      collapsed && 'justify-center px-2',
                      isPending && 'opacity-60 cursor-wait',
                    )}
                  >
                    {active && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-primary rounded-r-full" />
                    )}
                    <Icon className={cn(
                      'flex-shrink-0 transition-colors duration-200',
                      active ? 'text-primary' : 'text-muted-foreground',
                      'h-4 w-4'
                    )} />
                    {!collapsed && <span className="truncate">{label}</span>}
                    {collapsed && (
                      <span className="sr-only">{label}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* No access message */}
        {filteredNavItems.length === 0 && (
          <div className="px-3 py-4 text-center">
            <p className="text-xs text-muted-foreground">No modules accessible</p>
          </div>
        )}
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
