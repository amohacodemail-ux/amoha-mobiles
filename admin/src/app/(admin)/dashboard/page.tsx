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
import { formatCurrency, formatDate, getOrderStatusColor, safeImageSrc } from '@/lib/utils';
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
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Revenue"
          value={loading ? '...' : formatCurrency(stats?.totalRevenue ?? 0)}
          growth={stats?.revenueGrowth}
          icon={<DollarSign className="h-5 w-5" />}
          iconColor="text-blue-600 dark:text-blue-400"
        />
        <StatCard
          title="Total Orders"
          value={loading ? '...' : String(stats?.totalOrders ?? 0)}
          growth={stats?.ordersGrowth}
          icon={<ShoppingCart className="h-5 w-5" />}
          iconColor="text-green-600 dark:text-green-400"
        />
        <StatCard
          title="Total Products"
          value={loading ? '...' : String(stats?.totalProducts ?? 0)}
          growth={stats?.productsGrowth}
          icon={<Package className="h-5 w-5" />}
          iconColor="text-purple-600 dark:text-purple-400"
        />
        <StatCard
          title="Total Users"
          value={loading ? '...' : String(stats?.totalUsers ?? 0)}
          growth={stats?.usersGrowth}
          icon={<Users className="h-5 w-5" />}
          iconColor="text-orange-600 dark:text-orange-400"
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
        <CardHeader><CardTitle>Recent Orders</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {['Order', 'Customer', 'Amount', 'Status', 'Date'].map((h) => (
                    <th key={h} className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading
                  ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 5 }).map((_, j) => (
                        <td key={j} className="px-3 py-3"><div className="h-4 shimmer rounded" /></td>
                      ))}
                    </tr>
                  ))
                  : recentOrders.map((o) => (
                    <tr key={o._id} className="hover:bg-secondary/20 transition-colors">
                      <td className="px-3 py-3 font-mono text-xs text-primary">#{o.orderNumber}</td>
                      <td className="px-3 py-3">
                        <p className="font-medium text-foreground">{o.user?.name || 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground">{o.user?.email || ''}</p>
                      </td>
                      <td className="px-3 py-3 font-semibold">{formatCurrency(o.totalAmount)}</td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getOrderStatusColor(o.orderStatus)}`}>
                          {(o.orderStatus || 'pending').replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />{formatDate(o.createdAt)}
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
