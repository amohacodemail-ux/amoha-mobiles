'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  Bell, CheckCheck, Trash2, ShoppingCart, Mail, Wrench,
  Shield, Star, AlertTriangle, Info, Filter,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { notificationService, type Notification } from '@/services/notification.service';

const typeConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  order: { icon: ShoppingCart, color: 'text-blue-500 bg-blue-500/10', label: 'Order' },
  contact: { icon: Mail, color: 'text-green-500 bg-green-500/10', label: 'Contact' },
  service_request: { icon: Wrench, color: 'text-orange-500 bg-orange-500/10', label: 'Service' },
  kyc: { icon: Shield, color: 'text-purple-500 bg-purple-500/10', label: 'KYC' },
  review: { icon: Star, color: 'text-yellow-500 bg-yellow-500/10', label: 'Review' },
  low_stock: { icon: AlertTriangle, color: 'text-red-500 bg-red-500/10', label: 'Stock' },
  system: { icon: Info, color: 'text-gray-500 bg-gray-500/10', label: 'System' },
};

const filterTypes = [
  { value: '', label: 'All' },
  { value: 'order', label: 'Orders' },
  { value: 'contact', label: 'Contacts' },
  { value: 'service_request', label: 'Services' },
  { value: 'kyc', label: 'KYC' },
  { value: 'review', label: 'Reviews' },
  { value: 'low_stock', label: 'Low Stock' },
];

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterType, setFilterType] = useState('');

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await notificationService.getAll(page, 20, filterType || undefined);
      setNotifications(Array.isArray(res.notifications) ? res.notifications : []);
      setTotalPages(res.totalPages);
    } catch {
      toast.error('Failed to load notifications');
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [page, filterType]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const handleClick = async (n: Notification) => {
    if (!n.isRead) {
      try { await notificationService.markRead(n._id); } catch {}
    }
    if (n.link) {
      router.push(n.link);
    } else {
      setNotifications((prev) => prev.map((item) => item._id === n._id ? { ...item, isRead: true } : item));
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success('All marked as read');
    } catch {
      toast.error('Failed to mark all as read');
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await notificationService.delete(id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      toast.success('Notification deleted');
    } catch {
      toast.error('Delete failed');
    }
  };

  const handleClearAll = async () => {
    try {
      await notificationService.clearAll();
      toast.success('Read notifications cleared');
      fetchNotifications();
    } catch {
      toast.error('Clear failed');
    }
  };

  const formatTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  return (
    <div>
      <PageHeader title="Notifications" description="Stay updated on orders, messages and more">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
            <CheckCheck className="h-4 w-4" />Mark All Read
          </Button>
          <Button variant="outline" size="sm" onClick={handleClearAll}>
            <Trash2 className="h-4 w-4" />Clear Read
          </Button>
        </div>
      </PageHeader>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <Filter className="h-4 w-4 text-muted-foreground" />
        {filterTypes.map((f) => (
          <button
            key={f.value}
            onClick={() => { setFilterType(f.value); setPage(1); }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filterType === f.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      <Card>
        <CardContent className="p-0 divide-y divide-border">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-4 flex items-start gap-3 animate-pulse">
                <div className="w-9 h-9 rounded-full bg-secondary" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-secondary rounded w-1/3" />
                  <div className="h-3 bg-secondary rounded w-2/3" />
                </div>
              </div>
            ))
          ) : notifications.length === 0 ? (
            <div className="py-12 text-center">
              <Bell className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">No notifications</p>
            </div>
          ) : (
            notifications.map((n) => {
              const config = typeConfig[n.type] || typeConfig.system;
              const Icon = config.icon;
              return (
                <button
                  key={n._id}
                  onClick={() => handleClick(n)}
                  className={`w-full text-left p-4 flex items-start gap-3 hover:bg-secondary/50 transition-colors ${
                    !n.isRead ? 'bg-primary/5' : ''
                  }`}
                >
                  <div className={`p-2 rounded-full shrink-0 ${config.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${!n.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>{n.title}</span>
                      {!n.isRead && <span className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{n.message}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${config.color}`}>{config.label}</span>
                      <span className="text-xs text-muted-foreground">{formatTime(n.createdAt)}</span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleDelete(n._id, e)}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </button>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
          <span className="flex items-center text-sm text-muted-foreground px-3">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
}
