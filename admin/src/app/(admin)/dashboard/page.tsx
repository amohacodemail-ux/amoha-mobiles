'use client';
import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { ShoppingCart, Users, Package, DollarSign, Clock, Download, FileText } from 'lucide-react';
import { StatCard } from '@/components/shared/stat-card';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { dashboardService } from '@/services/dashboard.service';
import { formatCurrency, formatDate, getOrderStatusColor, safeImageSrc, cn } from '@/lib/utils';
import type { DashboardStats, RevenueData, TopProduct, RecentOrder } from '@/types';
import Image from 'next/image';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';

const RevenueChart = dynamic(
  () => import('@/components/charts/revenue-chart').then((m) => ({ default: m.RevenueChart })),
  {
    loading: () => <div className="h-[300px] animate-pulse rounded-lg bg-gray-100 dark:bg-white/5" />,
    ssr: false,
  },
);

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [revenue, setRevenue] = useState<RevenueData[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const ensureArray = <T,>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

  const downloadReport = async (type: 'sales' | 'inventory') => {
    try {
      const token = Cookies.get('admin_token');
      const baseUrl = '/api';
      const now = new Date();
      const url = type === 'sales'
        ? `${baseUrl}/admin/reports/sales?month=${now.getMonth() + 1}&year=${now.getFullYear()}`
        : `${baseUrl}/admin/reports/inventory`;

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to download report');

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = type === 'sales'
        ? `sales-report-${now.toISOString().slice(0, 7)}.csv`
        : `inventory-report-${now.toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
      toast.success(`${type === 'sales' ? 'Sales' : 'Inventory'} report downloaded!`);
    } catch {
      toast.error('Failed to download report');
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const [s, r, tp, ro] = await Promise.all([
          dashboardService.getStats(),
          dashboardService.getRevenueChart(),
          dashboardService.getTopProducts(),
          dashboardService.getRecentOrders(),
        ]);
        setStats(s);
        setRevenue(ensureArray<RevenueData>(r));
        setTopProducts(ensureArray<TopProduct>(tp));
        setRecentOrders(ensureArray<RecentOrder>(ro));
      } catch {
        toast.error('Failed to load dashboard data. Make sure the server is running.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div>
      <PageHeader title="Dashboard" description="Welcome back! Here's what's happening with your store.">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => downloadReport('sales')}>
            <FileText className="h-4 w-4 mr-2" />
            Sales Report
          </Button>
          <Button variant="outline" size="sm" onClick={() => downloadReport('inventory')}>
            <Download className="h-4 w-4 mr-2" />
            Inventory Report
          </Button>
        </div>
      </PageHeader>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6 mb-8">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats?.totalRevenue ?? 0)}
          growth={stats?.revenueGrowth}
          icon={<DollarSign className="h-5 w-5" />}
          iconColor="text-blue-600 dark:text-blue-400"
          loading={loading}
        />
        <StatCard
          title="Total Orders"
          value={String(stats?.totalOrders ?? 0)}
          growth={stats?.ordersGrowth}
          icon={<ShoppingCart className="h-5 w-5" />}
          iconColor="text-emerald-600 dark:text-emerald-400"
          loading={loading}
        />
        <StatCard
          title="Total Products"
          value={String(stats?.totalProducts ?? 0)}
          growth={stats?.productsGrowth}
          icon={<Package className="h-5 w-5" />}
          iconColor="text-violet-600 dark:text-violet-400"
          loading={loading}
        />
        <StatCard
          title="Total Users"
          value={String(stats?.totalUsers ?? 0)}
          growth={stats?.usersGrowth}
          icon={<Users className="h-5 w-5" />}
          iconColor="text-amber-600 dark:text-amber-400"
          loading={loading}
        />
      </div>

      {/* Revenue Chart + Top Products */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        <Card className="xl:col-span-2">
          <CardHeader><CardTitle>Revenue Analytics</CardTitle></CardHeader>
          <CardContent>
            {loading
              ? <div className="h-[300px] shimmer rounded-lg" />
              : <RevenueChart data={revenue} />
            }
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Top Selling Products</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg shimmer" />
                  <div className="flex-1 space-y-1">
                    <div className="h-3 shimmer rounded w-3/4" />
                    <div className="h-3 shimmer rounded w-1/2" />
                  </div>
                </div>
              ))
              : topProducts.map((p, i) => (
                <div key={p._id} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-muted-foreground w-4">{i + 1}</span>
                  <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                    {p.thumbnail && (
                      <Image src={safeImageSrc(p.thumbnail)} alt={p.name} fill className="object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.totalSold} sold · {formatCurrency(p.revenue)}</p>
                  </div>
                </div>
              ))
            }
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold">Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {['Order', 'Customer', 'Amount', 'Status', 'Date'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground first:pl-0 last:pr-0">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading
                  ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 5 }).map((_, j) => (
                        <td key={j} className="px-4 py-3.5 first:pl-0 last:pr-0"><div className="h-4 w-full max-w-[120px] shimmer rounded" /></td>
                      ))}
                    </tr>
                  ))
                  : recentOrders.length === 0 ? (
                    <tr>
                      <td colSpan={5}>
                        <div className="flex flex-col items-center justify-center py-12">
                          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                            <ShoppingCart className="h-5 w-5 text-muted-foreground/50" />
                          </div>
                          <p className="text-sm font-medium text-foreground mb-1">No recent orders</p>
                          <p className="text-xs text-muted-foreground">Orders will appear here when customers make purchases</p>
                        </div>
                      </td>
                    </tr>
                  ) : recentOrders.map((o) => (
                    <tr key={o._id} className="hover:bg-muted/30 transition-colors duration-150 group">
                      <td className="px-4 py-3.5 first:pl-0">
                        <span className="font-mono text-xs text-primary font-medium">#{o.orderNumber}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-medium text-foreground text-sm">{o.user?.name || 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground">{o.user?.email || ''}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-semibold text-foreground">{formatCurrency(o.totalAmount)}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={cn(
                          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                          getOrderStatusColor(o.orderStatus)
                        )}>
                          {(o.orderStatus || 'pending').replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 last:pr-0">
                        <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                          <Clock className="h-3.5 w-3.5" />
                          {formatDate(o.createdAt)}
                        </div>
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
