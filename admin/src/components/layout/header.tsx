'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, Bell, ShoppingCart, Mail, Wrench, Shield, Star, AlertTriangle, Info, CheckCheck } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { getInitials, cn } from '@/lib/utils';
import { ThemeToggle } from './theme-toggle';
import { notificationService, type Notification } from '@/services/notification.service';

const typeIcons: Record<string, React.ElementType> = {
  order: ShoppingCart,
  contact: Mail,
  service_request: Wrench,
  kyc: Shield,
  review: Star,
  low_stock: AlertTriangle,
  system: Info,
};

const typeColors: Record<string, string> = {
  order: 'text-blue-500 bg-blue-500/10',
  contact: 'text-green-500 bg-green-500/10',
  service_request: 'text-orange-500 bg-orange-500/10',
  kyc: 'text-purple-500 bg-purple-500/10',
  review: 'text-yellow-500 bg-yellow-500/10',
  low_stock: 'text-red-500 bg-red-500/10',
  system: 'text-gray-500 bg-gray-500/10',
};

interface HeaderProps {
  onMobileMenuOpen: () => void;
  collapsed: boolean;
}

export function Header({ onMobileMenuOpen, collapsed }: HeaderProps) {
  const { user } = useAuthStore();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await notificationService.getRecent();
      setNotifications(Array.isArray(res.notifications) ? res.notifications : []);
      setUnreadCount(typeof res.unreadCount === 'number' ? res.unreadCount : 0);
    } catch {}
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleNotificationClick = async (n: Notification) => {
    if (!n.isRead) {
      try {
        await notificationService.markRead(n._id);
        setUnreadCount((c) => Math.max(0, c - 1));
        setNotifications((prev) => prev.map((item) => item._id === n._id ? { ...item, isRead: true } : item));
      } catch {}
    }
    setOpen(false);
    if (n.link) router.push(n.link);
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {}
  };

  const safeNotifications = Array.isArray(notifications) ? notifications : [];

  const formatTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  return (
    <header
      className="fixed top-0 right-0 z-20 h-16 bg-background/80 backdrop-blur-sm border-b border-border flex items-center px-4 gap-4 transition-all duration-300"
      style={{ left: collapsed ? '4rem' : '15rem' }}
    >
      <button
        className="lg:hidden p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        onClick={onMobileMenuOpen}
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex-1" />

      {/* Theme toggle */}
      <ThemeToggle />

      {/* Notification bell */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setOpen(!open)}
          className="relative p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground px-1">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-2 w-80 md:w-96 rounded-xl border border-border bg-background shadow-xl overflow-hidden z-50 animate-scale-in origin-top-right">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
              <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 px-2 py-1 rounded-md hover:bg-primary/10 transition-colors"
                  >
                    <CheckCheck className="h-3 w-3" />Mark all read
                  </button>
                )}
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {safeNotifications.length === 0 ? (
                <div className="py-10 text-center">
                  <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                    <Bell className="h-6 w-6 text-muted-foreground/50" />
                  </div>
                  <p className="text-sm font-medium text-foreground mb-1">No notifications yet</p>
                  <p className="text-xs text-muted-foreground">We'll notify you when something arrives</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {safeNotifications.map((n, index) => {
                    const Icon = typeIcons[n.type] || Info;
                    const color = typeColors[n.type] || typeColors.system;
                    return (
                      <button
                        key={n._id}
                        onClick={() => handleNotificationClick(n)}
                        className={cn(
                          'w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-muted/50 transition-all duration-150',
                          !n.isRead && 'bg-primary/[0.03]'
                        )}
                        style={{ animationDelay: `${index * 30}ms` }}
                      >
                        <div className={cn('p-2 rounded-full shrink-0', color)}>
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              'text-xs font-medium truncate',
                              !n.isRead ? 'text-foreground' : 'text-muted-foreground'
                            )}>
                              {n.title}
                            </span>
                            {!n.isRead && <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 animate-pulse" />}
                          </div>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">{n.message}</p>
                          <span className="text-[10px] text-muted-foreground mt-1 block">{formatTime(n.createdAt)}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="border-t border-border px-4 py-3 bg-muted/30">
              <button
                onClick={() => { setOpen(false); router.push('/notifications'); }}
                className="w-full text-center text-xs font-medium text-primary hover:text-primary/80 py-1 rounded-md hover:bg-primary/10 transition-colors"
              >
                View all notifications
              </button>
            </div>
          </div>
        )}
      </div>

      {/* User avatar */}
      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-semibold text-foreground">{user?.name ?? 'Admin'}</p>
          <p className="text-xs text-muted-foreground">{user?.email ?? ''}</p>
        </div>
        <div className="w-9 h-9 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-sm font-bold text-primary">
          {getInitials(user?.name ?? 'A')}
        </div>
      </div>
    </header>
  );
}
