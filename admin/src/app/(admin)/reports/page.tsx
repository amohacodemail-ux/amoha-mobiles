'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import apiClient from '@/lib/api-client';
import type { ApiResponse } from '@/types';
import toast from 'react-hot-toast';
import {
  TrendingUp, ShoppingCart, DollarSign, BarChart3,
  Download, RefreshCw, Filter, Calendar,
} from 'lucide-react';

type Period = 'day' | 'week' | 'month' | 'custom';

interface SalesSummary {
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  totalDiscount: number;
  onlineOrders: number;
  posOrders: number;
  dailyBreakdown: { date: string; orders: number; revenue: number }[];
  period: string;
  startDate: string;
  endDate: string;
}

interface OrderRow {
  _id: string;
  orderNumber: string;
  createdAt: string;
  status: string;
  paymentStatus: string;
  total: number;
  subtotal: number;
  discount: number;
  source: string;
  customer: { name: string; email: string; phone: string };
}

interface OrdersData {
  orders: OrderRow[];
  total: number;
  totalPages: number;
  currentPage: number;
}

const STATUS_COLORS: Record<string, string> = {
  placed: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-cyan-100 text-cyan-700',
  processing: 'bg-yellow-100 text-yellow-700',
  shipped: 'bg-purple-100 text-purple-700',
  out_for_delivery: 'bg-orange-100 text-orange-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  returned: 'bg-gray-100 text-gray-600',
};

const PAY_COLORS: Record<string, string> = {
  paid: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  failed: 'bg-red-100 text-red-700',
  refunded: 'bg-gray-100 text-gray-600',
};

const fmt = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

export default function ReportsPage() {
  const [period, setPeriod] = useState<Period>('month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [ordersData, setOrdersData] = useState<OrdersData | null>(null);
  const [source, setSource] = useState<'all' | 'online' | 'pos'>('all');
  const [page, setPage] = useState(1);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const fetchSummary = useCallback(async () => {
    setLoadingSummary(true);
    try {
      const params = new URLSearchParams();
      if (period === 'custom' && customStart && customEnd) {
        params.set('startDate', customStart);
        params.set('endDate', customEnd);
      } else {
        params.set('period', period);
      }
      const { data } = await apiClient.get<ApiResponse<SalesSummary>>(`/admin/reports/sales-summary?${params}`);
      setSummary(data.data);
    } catch {
      toast.error('Failed to load sales summary');
    } finally {
      setLoadingSummary(false);
    }
  }, [period, customStart, customEnd]);

  const fetchOrders = useCallback(async () => {
    setLoadingOrders(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (period === 'custom' && customStart && customEnd) {
        params.set('startDate', customStart);
        params.set('endDate', customEnd);
      } else if (period !== 'custom') {
        const now = new Date();
        let start = new Date();
        if (period === 'day') start.setHours(0, 0, 0, 0);
        else if (period === 'week') { start.setDate(start.getDate() - 6); start.setHours(0, 0, 0, 0); }
        else { start.setDate(1); start.setHours(0, 0, 0, 0); }
        params.set('startDate', start.toISOString().split('T')[0]);
        params.set('endDate', now.toISOString().split('T')[0]);
      }
      if (source !== 'all') params.set('source', source);
      const { data } = await apiClient.get<ApiResponse<OrdersData>>(`/admin/reports/orders?${params}`);
      setOrdersData(data.data);
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoadingOrders(false);
    }
  }, [period, customStart, customEnd, source, page]);

  useEffect(() => {
    fetchSummary();
    fetchOrders();
  }, [fetchSummary, fetchOrders]);

  const handleDownloadCSV = () => {
    const params = new URLSearchParams();
    if (period === 'custom' && customStart && customEnd) {
      const [year, month] = customStart.split('-');
      params.set('year', year); params.set('month', month);
    } else {
      const d = new Date();
      params.set('year', String(d.getFullYear()));
      params.set('month', String(period === 'month' ? d.getMonth() + 1 : d.getMonth() + 1));
    }
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
    window.open(`${baseUrl}/admin/reports/sales?${params}`, '_blank');
  };

  const stats = [
    { label: 'Total Revenue', value: fmt(summary?.totalRevenue ?? 0), icon: DollarSign, color: 'text-green-600' },
    { label: 'Total Orders', value: String(summary?.totalOrders ?? 0), icon: ShoppingCart, color: 'text-blue-600' },
    { label: 'Avg Order Value', value: fmt(summary?.avgOrderValue ?? 0), icon: TrendingUp, color: 'text-purple-600' },
    { label: 'Total Discounts', value: fmt(summary?.totalDiscount ?? 0), icon: BarChart3, color: 'text-orange-600' },
  ];

  return (
    <div>
      <PageHeader
        title="Sales & Reports"
        description="View order reports, sales tracking and analytics"
        action={
          <Button onClick={handleDownloadCSV} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" /> Export CSV
          </Button>
        }
      />

      {/* Period Filter */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        {(['day', 'week', 'month', 'custom'] as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => { setPeriod(p); setPage(1); }}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${period === p ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-primary/50'}`}
          >
            {p === 'day' ? 'Today' : p === 'week' ? 'This Week' : p === 'month' ? 'This Month' : 'Custom'}
          </button>
        ))}
        {period === 'custom' && (
          <div className="flex items-center gap-2">
            <Input type="date" value={customStart} onChange={(e) => { setCustomStart(e.target.value); setPage(1); }} className="w-40 h-8 text-sm" />
            <span className="text-muted-foreground text-sm">to</span>
            <Input type="date" value={customEnd} onChange={(e) => { setCustomEnd(e.target.value); setPage(1); }} className="w-40 h-8 text-sm" />
          </div>
        )}
        <button onClick={() => { fetchSummary(); fetchOrders(); }} className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <RefreshCw className="h-3 w-3" /> Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <s.icon className={`h-4 w-4 ${s.color}`} />
            </div>
            <p className="text-2xl font-bold text-foreground">
              {loadingSummary ? <span className="text-base text-muted-foreground">Loading...</span> : s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Online vs POS breakdown */}
      {summary && (
        <div className="mb-6 rounded-xl border border-border bg-card p-4">
          <h3 className="text-sm font-semibold mb-3 text-foreground">Order Source Breakdown</h3>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-500 inline-block" />
              <span className="text-sm text-muted-foreground">Online Orders:</span>
              <span className="text-sm font-semibold text-foreground">{summary.onlineOrders}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-green-500 inline-block" />
              <span className="text-sm text-muted-foreground">POS / Walk-in:</span>
              <span className="text-sm font-semibold text-foreground">{summary.posOrders}</span>
            </div>
          </div>
        </div>
      )}

      {/* Daily Breakdown Chart (text-based) */}
      {summary && summary.dailyBreakdown.length > 0 && (
        <div className="mb-6 rounded-xl border border-border bg-card p-4 overflow-x-auto">
          <h3 className="text-sm font-semibold mb-3 text-foreground flex items-center gap-2">
            <Calendar className="h-4 w-4" /> Daily Breakdown
          </h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-1.5 text-muted-foreground font-medium">Date</th>
                <th className="text-right py-1.5 text-muted-foreground font-medium">Orders</th>
                <th className="text-right py-1.5 text-muted-foreground font-medium">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {summary.dailyBreakdown.map((row) => (
                <tr key={row.date} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="py-1.5 text-foreground">{fmtDate(row.date)}</td>
                  <td className="py-1.5 text-right text-foreground">{row.orders}</td>
                  <td className="py-1.5 text-right text-green-600 font-medium">{fmt(row.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Orders Table */}
      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Filter className="h-4 w-4" /> Order Details
          </h3>
          <div className="flex items-center gap-2">
            {(['all', 'online', 'pos'] as const).map((s) => (
              <button
                key={s}
                onClick={() => { setSource(s); setPage(1); }}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${source === s ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-primary/50'}`}
              >
                {s === 'all' ? 'All' : s === 'online' ? 'Online' : 'POS'}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Order #</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Date</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Customer</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Source</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Status</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Payment</th>
                <th className="text-right px-4 py-3 text-muted-foreground font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {loadingOrders ? (
                <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">Loading orders...</td></tr>
              ) : (ordersData?.orders || []).length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">No orders found for this period</td></tr>
              ) : (
                (ordersData?.orders || []).map((order) => (
                  <tr key={order._id} className="border-b border-border/50 hover:bg-muted/20">
                    <td className="px-4 py-3 font-mono text-xs text-foreground">{order.orderNumber}</td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{fmtDate(order.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{order.customer?.name || 'N/A'}</div>
                      <div className="text-xs text-muted-foreground">{order.customer?.phone || order.customer?.email || ''}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${order.source === 'POS' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                        {order.source}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600'}`}>
                        {order.status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${PAY_COLORS[order.paymentStatus] || 'bg-gray-100 text-gray-600'}`}>
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-foreground">{fmt(order.total)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {ordersData && ordersData.totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-border">
            <span className="text-xs text-muted-foreground">
              Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, ordersData.total)} of {ordersData.total} orders
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                Previous
              </Button>
              <Button size="sm" variant="outline" onClick={() => setPage(p => Math.min(ordersData.totalPages, p + 1))} disabled={page >= ordersData.totalPages}>
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
