'use client';
import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { 
  IndianRupee, FileText, Download, Search, RefreshCw,
  TrendingUp, ShoppingCart, Percent, Tag,
  BarChart3, Calendar, Store, Globe, Receipt, Trash2,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Pagination } from '@/components/shared/pagination';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { billingService, type BillingSummary, type BillingOrder, type BillingPeriod } from '@/services/billing.service';
import { orderService } from '@/services/order.service';
import { ConfirmModal } from '@/components/shared/confirm-modal';
import { useModulePermissions, MODULES } from '@/hooks/usePermissions';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const LIMIT = 20;

const PERIODS: { value: BillingPeriod; label: string }[] = [
  { value: 'day', label: 'Today' },
  { value: 'week', label: 'Last 7 Days' },
  { value: 'month', label: 'This Month' },
  { value: 'custom', label: 'Custom Range' },
];

const SOURCE_FILTERS = [
  { value: '', label: 'All Sources' },
  { value: 'online', label: 'Online Orders' },
  { value: 'pos', label: 'POS / Counter' },
];

const STATUS_FILTERS = [
  { value: '', label: 'All Statuses' },
  { value: 'placed', label: 'Placed' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'returned', label: 'Returned' },
];

function StatCard({
  label, value, sub, icon: Icon, color = 'text-primary',
}: {
  label: string; value: string; sub?: string; icon: React.FC<any>; color?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
            <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
          </div>
          <div className={`p-2 rounded-lg bg-primary/10 ${color}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function paymentMethodLabel(order: BillingOrder): string {
  if (order.isWalkIn) return (order.posPaymentMethod || 'cash').toUpperCase();
  return order.paymentMethod === 'cod' ? 'COD' : 'Online';
}

function OrderStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    placed: 'bg-blue-500/15 text-blue-600',
    confirmed: 'bg-indigo-500/15 text-indigo-600',
    processing: 'bg-yellow-500/15 text-yellow-600',
    shipped: 'bg-purple-500/15 text-purple-600',
    out_for_delivery: 'bg-orange-500/15 text-orange-600',
    delivered: 'bg-green-500/15 text-green-600',
    cancelled: 'bg-red-500/15 text-red-600',
    returned: 'bg-gray-500/15 text-gray-600',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${map[status] ?? 'bg-muted text-muted-foreground'}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

export default function BillingPage() {
  const [period, setPeriod] = useState<BillingPeriod>('month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [source, setSource] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const [summary, setSummary] = useState<BillingSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [orders, setOrders] = useState<BillingOrder[]>([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [gstDownloading, setGstDownloading] = useState(false);
  const [deleteOrderId, setDeleteOrderId] = useState<string | null>(null);
  const [deleteOrderNumber, setDeleteOrderNumber] = useState<string>('');
  const [deleting, setDeleting] = useState(false);

  const { canDelete } = useModulePermissions(MODULES.BILLING);

  const summaryParams = useCallback(() => {
    if (period === 'custom') {
      if (customStart && customEnd) return { startDate: customStart, endDate: customEnd };
      // Dates not yet filled — fall back to month so backend doesn't receive period=custom
      return { period: 'month' as BillingPeriod };
    }
    return { period };
  }, [period, customStart, customEnd]);

  const loadSummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const data = await billingService.getSummary(summaryParams());
      setSummary(data);
    } catch {
      toast.error('Failed to load billing summary');
    } finally {
      setSummaryLoading(false);
    }
  }, [summaryParams]);

  const loadOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const params: any = { page, limit: LIMIT };
      if (source) params.source = source;
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;
      if (period === 'custom' && customStart && customEnd) {
        params.startDate = customStart;
        params.endDate = customEnd;
      } else if (period !== 'custom') {
        const now = new Date();
        if (period === 'day') {
          params.startDate = now.toISOString().split('T')[0];
          params.endDate = now.toISOString().split('T')[0];
        } else if (period === 'week') {
          const d = new Date(now);
          d.setDate(d.getDate() - 6);
          params.startDate = d.toISOString().split('T')[0];
          params.endDate = now.toISOString().split('T')[0];
        } else {
          params.startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
          params.endDate = now.toISOString().split('T')[0];
        }
      }
      const res = await billingService.getOrders(params);
      setOrders(res.orders || []);
      setTotalOrders(res.total || 0);
      setTotalPages(res.totalPages || 1);
    } catch {
      toast.error('Failed to load billing orders');
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  }, [page, source, statusFilter, search, period, customStart, customEnd]);

  // Single effect drives both loads so they always share the same period state
  useEffect(() => {
    loadSummary();
    loadOrders();
  }, [loadSummary, loadOrders]);
  useEffect(() => { setPage(1); }, [source, statusFilter, search, period, customStart, customEnd]);

  const handleDownloadInvoice = async (order: BillingOrder) => {
    const id = order._id || order.id || '';
    setDownloadingId(id);
    try {
      await billingService.downloadInvoice(id, order.invoiceNumber || order.orderNumber);
    } catch {
      toast.error('Failed to download invoice');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleGstDownload = async () => {
    setGstDownloading(true);
    try {
      await billingService.downloadGstReport(summaryParams());
      toast.success('GST report downloaded');
    } catch {
      toast.error('Failed to download GST report — try the Sales Report instead');
    } finally {
      setGstDownloading(false);
    }
  };

  const openDelete = (order: BillingOrder) => {
    if (!canDelete) {
      toast.error('You do not have permission to delete orders');
      return;
    }
    setDeleteOrderId(order._id || order.id || '');
    setDeleteOrderNumber(order.invoiceNumber || order.orderNumber || 'this order');
  };

  const handleDelete = async () => {
    if (!deleteOrderId) return;
    setDeleting(true);
    try {
      await orderService.deleteOrder(deleteOrderId);
      toast.success('Order deleted successfully');
      setDeleteOrderId(null);
      setOrders((prev) => prev.filter((o) => (o._id || o.id) !== deleteOrderId));
      setTotalOrders((prev) => Math.max(0, prev - 1));
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || 'Failed to delete order';
      alert('Delete failed: ' + errorMsg + '\n\nStatus: ' + error?.response?.status);
      toast.error(errorMsg);
    } finally {
      setDeleting(false);
    }
  };

  const totalGstAmount = summary?.totalGst ?? 0;

  return (
    <div>
      <PageHeader
        title="Billing & Invoices"
        description="Unified billing dashboard — online orders, POS sales, GST tracking, and invoice management"
      >
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={handleGstDownload} disabled={gstDownloading}>
            {gstDownloading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
            GST Report
          </Button>
          <Link href="/barcode">
            <Button size="sm">
              <Receipt className="h-4 w-4 mr-2" />
              POS Counter Billing
            </Button>
          </Link>
        </div>
      </PageHeader>

      {/* Period filter */}
      <div className="flex flex-wrap gap-2 mb-6 items-center">
        <div className="flex gap-1 bg-muted/40 p-1 rounded-lg">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                period === p.value
                  ? 'bg-background shadow text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        {period === 'custom' && (
          <div className="flex gap-2 items-center">
            <Input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="h-9 w-36 text-sm" />
            <span className="text-muted-foreground text-sm">to</span>
            <Input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="h-9 w-36 text-sm" />
          </div>
        )}
        <Button variant="ghost" size="sm" onClick={() => { loadSummary(); loadOrders(); }}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Summary stats */}
      {summaryLoading ? (
        <div className="grid gap-4 mb-6 grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i}><CardContent className="pt-5 pb-4"><div className="h-16 bg-muted/40 rounded animate-pulse" /></CardContent></Card>
          ))}
        </div>
      ) : summary && (
        <>
          <div className="grid gap-4 mb-6 grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total Revenue" value={formatCurrency(summary.totalRevenue)} sub={`${summary.totalOrders} orders`} icon={IndianRupee} color="text-green-600" />
            <StatCard label="Online Revenue" value={formatCurrency(summary.onlineRevenue)} sub={`${summary.onlineOrders} orders`} icon={Globe} color="text-blue-600" />
            <StatCard label="POS Revenue" value={formatCurrency(summary.posRevenue)} sub={`${summary.posOrders} orders`} icon={Store} color="text-purple-600" />
            <StatCard label="Avg Order Value" value={formatCurrency(summary.avgOrderValue)} icon={TrendingUp} />
            <StatCard label="Total GST Collected" value={formatCurrency(totalGstAmount)} icon={Percent} color="text-orange-600" />
            <StatCard label="Total Discounts" value={formatCurrency(summary.totalDiscount)} icon={Tag} color="text-red-600" />
            <StatCard label="Total Orders" value={String(summary.totalOrders)} sub={`${summary.onlineOrders} online · ${summary.posOrders} POS`} icon={ShoppingCart} />
            <StatCard label="Period" value={PERIODS.find((p) => p.value === period)?.label ?? 'Custom'} sub={summary.startDate ? new Date(summary.startDate).toLocaleDateString('en-IN') : ''} icon={Calendar} />
          </div>

          {/* Revenue chart */}
          {summary.dailyBreakdown.length > 1 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" />Revenue Trend</CardTitle>
                <CardDescription>Daily revenue breakdown for the selected period</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={summary.dailyBreakdown} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                      formatter={(v: any) => [formatCurrency(v), 'Revenue']}
                      labelFormatter={(l) => new Date(l).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' })}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="revenue" name="Revenue (₹)" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="orders" name="Orders" fill="hsl(var(--primary) / 0.35)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Orders table */}
      <Card>
        <CardHeader className="border-b bg-muted/30">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
            <div>
              <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />All Invoices & Orders</CardTitle>
              <CardDescription>{totalOrders} records found</CardDescription>
            </div>
          </div>
        </CardHeader>

        {/* Filters */}
        <div className="px-4 py-3 border-b bg-muted/10 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search order number, invoice..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground"
          >
            {SOURCE_FILTERS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground"
          >
            {STATUS_FILTERS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </div>

        <CardContent className="p-0">
          {ordersLoading ? (
            <div className="py-16 text-center text-muted-foreground">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-3 text-primary" />
              Loading orders...
            </div>
          ) : orders.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-3 opacity-30" />
              No orders found for the selected filters.
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs text-muted-foreground font-medium uppercase tracking-wide">
                      <th className="px-4 py-3">Invoice / Order</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Customer</th>
                      <th className="px-4 py-3">Source</th>
                      <th className="px-4 py-3">Payment</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">GST</th>
                      <th className="px-4 py-3 text-right">Amount</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {orders.map((order) => {
                      const id = order._id || order.id || '';
                      const amount = order.totalAmount ?? order.total ?? 0;
                      return (
                        <tr key={id} className="hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-mono text-xs font-semibold text-foreground">
                                {order.invoiceNumber || '—'}
                              </p>
                              <p className="text-[10px] text-muted-foreground">{order.orderNumber}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                            {formatDateTime(order.createdAt)}
                          </td>
                          <td className="px-4 py-3">
                            <div>
                              <p className="text-sm font-medium">{order.customer?.name || '—'}</p>
                              <p className="text-[10px] text-muted-foreground">{order.customer?.phone || order.customer?.email || ''}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={order.isWalkIn ? 'secondary' : 'outline'} className="text-[10px]">
                              {order.isWalkIn ? <><Store className="h-2.5 w-2.5 mr-1" />POS</> : <><Globe className="h-2.5 w-2.5 mr-1" />Online</>}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs font-medium">{paymentMethodLabel(order)}</span>
                          </td>
                          <td className="px-4 py-3">
                            <OrderStatusBadge status={order.status} />
                          </td>
                          <td className="px-4 py-3 text-xs">
                            {order.gstAmount && order.gstAmount > 0
                              ? <span className="text-orange-600 font-medium">{formatCurrency(order.gstAmount)}</span>
                              : <span className="text-muted-foreground">—</span>
                            }
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-sm">
                            {formatCurrency(amount)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center gap-2 justify-end">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDownloadInvoice(order)}
                                disabled={downloadingId === id}
                              >
                                {downloadingId === id
                                  ? <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                  : <Download className="h-3.5 w-3.5" />
                                }
                                <span className="ml-1.5 hidden xl:inline">Invoice</span>
                              </Button>
                              {canDelete && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="hover:border-destructive hover:text-destructive"
                                  onClick={() => openDelete(order)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="lg:hidden divide-y divide-border">
                {orders.map((order) => {
                  const id = order._id || order.id || '';
                  const amount = order.totalAmount ?? order.total ?? 0;
                  return (
                    <div key={id} className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <p className="font-mono text-xs font-bold">{order.invoiceNumber || order.orderNumber}</p>
                          <p className="text-[10px] text-muted-foreground">{formatDateTime(order.createdAt)}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-sm">{formatCurrency(amount)}</p>
                          <Badge variant={order.isWalkIn ? 'secondary' : 'outline'} className="text-[10px] mt-0.5">
                            {order.isWalkIn ? 'POS' : 'Online'}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <OrderStatusBadge status={order.status} />
                        <span className="text-xs text-muted-foreground">{order.customer?.name || 'Walk-in'}</span>
                        <span className="text-xs font-medium">{paymentMethodLabel(order)}</span>
                        {order.gstAmount && order.gstAmount > 0 && (
                          <span className="text-xs text-orange-600">GST: {formatCurrency(order.gstAmount)}</span>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => handleDownloadInvoice(order)}
                        disabled={downloadingId === id}
                      >
                        {downloadingId === id
                          ? <RefreshCw className="h-3.5 w-3.5 animate-spin mr-2" />
                          : <Download className="h-3.5 w-3.5 mr-2" />
                        }
                        Download Invoice PDF
                      </Button>
                    </div>
                  );
                })}
              </div>
            </>
          )}

        {totalPages > 1 && (
          <div className="px-4 py-4 border-t">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
              totalItems={totalOrders}
              pageSize={LIMIT}
            />
          </div>
        )}
      </CardContent>
    </Card>

      <ConfirmModal
        open={!!deleteOrderId}
        onClose={() => setDeleteOrderId(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Order?"
        description={`Are you sure you want to delete order "${deleteOrderNumber}"? This action cannot be undone.`}
        confirmLabel="Delete Order"
      />

      {/* GST Summary card */}
      {summary && totalGstAmount > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Percent className="h-5 w-5 text-orange-600" />GST Summary</CardTitle>
            <CardDescription>Tax collected for the selected period (inclusive GST extracted from prices)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg bg-orange-50 dark:bg-orange-500/10 p-4 border border-orange-200 dark:border-orange-500/20">
                <p className="text-xs text-orange-700 dark:text-orange-400 font-medium uppercase tracking-wide">Total GST Collected</p>
                <p className="text-2xl font-bold text-orange-700 dark:text-orange-400 mt-1">{formatCurrency(totalGstAmount)}</p>
              </div>
              <div className="rounded-lg bg-muted/40 p-4 border border-border">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">CGST (est.)</p>
                <p className="text-2xl font-bold mt-1">{formatCurrency(Math.floor(totalGstAmount / 2))}</p>
              </div>
              <div className="rounded-lg bg-muted/40 p-4 border border-border">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">SGST (est.)</p>
                <p className="text-2xl font-bold mt-1">{formatCurrency(totalGstAmount - Math.floor(totalGstAmount / 2))}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              * GST shown is inclusive (extracted from sale price). CGST/SGST split assumes intra-state sales. Download the GST Report for itemised breakdown.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
