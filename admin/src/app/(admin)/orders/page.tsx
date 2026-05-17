'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { useDebouncedValue } from '@/lib/hooks';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Eye, Download, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable, Column } from '@/components/shared/data-table';
import { Pagination } from '@/components/shared/pagination';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { orderService } from '@/services/order.service';
import { formatCurrency, formatDate, getOrderStatusColor, getPaymentStatusColor } from '@/lib/utils';
import type { Order, OrderStatus } from '@/types';

const LIMIT = 10;
const STATUS_OPTIONS: { label: string; value: string }[] = [
  { label: 'All', value: 'all' },
  { label: 'Placed', value: 'placed' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Processing', value: 'processing' },
  { label: 'Shipped', value: 'shipped' },
  { label: 'Out for Delivery', value: 'out_for_delivery' },
  { label: 'Delivered', value: 'delivered' },
  { label: 'Cancelled', value: 'cancelled' },
  { label: 'Returned', value: 'returned' },
];

const SOURCE_OPTIONS: { label: string; value: string }[] = [
  { label: 'All Sources', value: 'all' },
  { label: 'Online', value: 'online' },
  { label: 'POS / Walk-in', value: 'pos' },
];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const debouncedSearch = useDebouncedValue(search, 350);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await orderService.getAll({
        page, limit: LIMIT, search: debouncedSearch,
        ...(statusFilter && statusFilter !== 'all' && { orderStatus: statusFilter }),
        ...(sourceFilter && sourceFilter !== 'all' && { source: sourceFilter }),
      });
      setOrders(Array.isArray(res.orders) ? res.orders : []);
      setTotalPages(res.totalPages);
      setTotalItems(res.totalOrders);
    } catch { toast.error('Failed to load orders'); setOrders([]); }
    finally { setLoading(false); }
  }, [page, debouncedSearch, statusFilter, sourceFilter]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [debouncedSearch, statusFilter, sourceFilter]);

  const columns: Column<Order>[] = [
    {
      key: 'orderNumber', header: 'Order',
      render: (o) => <span className="font-mono text-xs text-primary font-semibold">#{o.orderNumber}</span>,
    },
    {
      key: 'user', header: 'Customer',
      render: (o) => (
        <div>
          <p className="font-medium text-foreground text-sm">{(o as any).isWalkIn ? ((o as any).walkInCustomerName || 'Walk-in') : (o.user?.name || 'Unknown')}</p>
          <p className="text-xs text-muted-foreground">{(o as any).isWalkIn ? ((o as any).walkInCustomerPhone || 'POS') : (o.user?.email || '')}</p>
        </div>
      ),
    },
    {
      key: 'source', header: 'Source',
      render: (o) => (
        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${(o as any).isWalkIn ? 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/30' : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/30'}`}>
          {(o as any).isWalkIn ? 'POS' : 'Online'}
        </span>
      ),
    },
    { key: 'totalAmount', header: 'Amount', render: (o) => <span className="font-semibold">{formatCurrency(o.totalAmount)}</span> },
    {
      key: 'orderStatus', header: 'Order Status',
      render: (o) => (
        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${getOrderStatusColor(o.orderStatus)}`}>
          {o.orderStatus.replace(/_/g, ' ')}
        </span>
      ),
    },
    {
      key: 'paymentStatus', header: 'Payment',
      render: (o) => (
        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${getPaymentStatusColor(o.paymentStatus)}`}>
          {o.paymentStatus}
        </span>
      ),
    },
    { key: 'createdAt', header: 'Date', render: (o) => <span className="text-xs text-muted-foreground">{formatDate(o.createdAt)}</span> },
    {
      key: 'actions', header: 'Actions',
      render: (o) => (
        <div className="flex items-center gap-1">
          <Link href={`/orders/${o._id}`}>
            <Button variant="outline" size="icon-sm" title="View order"><Eye className="h-3.5 w-3.5" /></Button>
          </Link>
          <Button
            variant="outline"
            size="icon-sm"
            title="Download Invoice"
            onClick={() => orderService.downloadInvoice(o._id, o.orderNumber).catch(() => toast.error('Failed to download invoice'))}
          >
            <Download className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            title="Delete Order"
            onClick={async () => {
              if (window.confirm(`Are you sure you want to delete order ${o.orderNumber}? This action cannot be undone.`)) {
                try {
                  await orderService.deleteOrder(o._id);
                  toast.success('Order deleted successfully');
                  load();
                } catch (err) {
                  toast.error('Failed to delete order');
                }
              }
            }}
          >
            <Trash2 className="h-3.5 w-3.5 text-red-600" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Orders" description={`${totalItems} total orders`}>
        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by source" />
          </SelectTrigger>
          <SelectContent>
            {SOURCE_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </PageHeader>

      <DataTable
        columns={columns} data={orders} loading={loading}
        searchValue={search} onSearchChange={setSearch}
        searchPlaceholder="Search order # or customer..."
        rowKey={(o) => o._id}
      />
      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} totalItems={totalItems} pageSize={LIMIT} />
    </div>
  );
}
