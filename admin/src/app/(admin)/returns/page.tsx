'use client';
import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Eye, RotateCcw, Package, CheckCircle, Clock, XCircle } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable, Column } from '@/components/shared/data-table';
import { Pagination } from '@/components/shared/pagination';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { returnService } from '@/services/return.service';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { ReturnRequest, ReturnStatus, ReturnStats } from '@/types';

const LIMIT = 15;

const STATUS_OPTIONS: { label: string; value: string }[] = [
  { label: 'All', value: 'all' },
  { label: 'Requested', value: 'requested' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'Pickup Scheduled', value: 'pickup_scheduled' },
  { label: 'Picked Up', value: 'picked_up' },
  { label: 'Received', value: 'received' },
  { label: 'Inspected', value: 'inspected' },
  { label: 'Refund Initiated', value: 'refund_initiated' },
  { label: 'Refund Completed', value: 'refund_completed' },
  { label: 'Replacement Shipped', value: 'replacement_shipped' },
  { label: 'Closed', value: 'closed' },
];

const STATUS_TRANSITIONS: Record<string, string[]> = {
  requested: ['approved', 'rejected'],
  approved: ['pickup_scheduled'],
  pickup_scheduled: ['picked_up'],
  picked_up: ['received'],
  received: ['inspected'],
  inspected: ['refund_initiated', 'replacement_shipped'],
  refund_initiated: ['refund_completed'],
  refund_completed: ['closed'],
  replacement_shipped: ['closed'],
};

function getReturnStatusColor(status: ReturnStatus): string {
  const map: Record<ReturnStatus, string> = {
    requested: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
    approved: 'bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30',
    rejected: 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30',
    pickup_scheduled: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30',
    picked_up: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
    received: 'bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/30',
    inspected: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30',
    refund_initiated: 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/30',
    refund_completed: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    replacement_shipped: 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30',
    closed: 'bg-gray-500/15 text-gray-600 dark:text-gray-400 border-gray-500/30',
  };
  return map[status] ?? 'bg-muted text-muted-foreground';
}

export default function ReturnsPage() {
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [stats, setStats] = useState<ReturnStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Status update dialog
  const [selectedReturn, setSelectedReturn] = useState<ReturnRequest | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [updating, setUpdating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [res, statsRes] = await Promise.all([
        returnService.getAll({
          page, limit: LIMIT, search,
          ...(statusFilter !== 'all' && { status: statusFilter }),
        }),
        returnService.getStats(),
      ]);
      setReturns(Array.isArray(res.items) ? res.items : []);
      setTotalPages(res.totalPages);
      setTotalItems(res.totalItems);
      setStats(statsRes);
    } catch { toast.error('Failed to load returns'); setReturns([]); }
    finally { setLoading(false); }
  }, [page, search, statusFilter]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search, statusFilter]);

  const handleStatusUpdate = async () => {
    if (!selectedReturn || !newStatus) return;
    setUpdating(true);
    try {
      await returnService.updateStatus(selectedReturn._id, newStatus as ReturnStatus, statusMessage);
      toast.success('Status updated');
      setSelectedReturn(null);
      setNewStatus('');
      setStatusMessage('');
      load();
    } catch { toast.error('Failed to update status'); }
    finally { setUpdating(false); }
  };

  const columns: Column<ReturnRequest>[] = [
    {
      key: 'order', header: 'Order',
      render: (r) => <span className="font-mono text-xs text-primary font-semibold">#{r.order.orderNumber}</span>,
    },
    {
      key: 'user', header: 'Customer',
      render: (r) => (
        <div>
          <p className="font-medium text-foreground text-sm">{r.user.name}</p>
          <p className="text-xs text-muted-foreground">{r.user.email}</p>
        </div>
      ),
    },
    {
      key: 'type', header: 'Type',
      render: (r) => (
        <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold capitalize bg-secondary text-secondary-foreground">
          {r.returnType}
        </span>
      ),
    },
    {
      key: 'items', header: 'Items',
      render: (r) => <span className="text-sm">{r.items.length} item{r.items.length > 1 ? 's' : ''}</span>,
    },
    {
      key: 'refundAmount', header: 'Refund',
      render: (r) => <span className="font-semibold">{formatCurrency(r.refundAmount)}</span>,
    },
    {
      key: 'status', header: 'Status',
      render: (r) => (
        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${getReturnStatusColor(r.status)}`}>
          {r.status.replace(/_/g, ' ')}
        </span>
      ),
    },
    {
      key: 'createdAt', header: 'Date',
      render: (r) => <span className="text-xs text-muted-foreground">{formatDate(r.createdAt)}</span>,
    },
    {
      key: 'actions', header: 'Actions',
      render: (r) => {
        const transitions = STATUS_TRANSITIONS[r.status] ?? [];
        return transitions.length > 0 ? (
          <Button
            variant="outline" size="icon-sm"
            onClick={() => { setSelectedReturn(r); setNewStatus(transitions[0]); }}
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        ) : null;
      },
    },
  ];

  return (
    <div>
      <PageHeader title="Returns & Refunds" description={`${totalItems} total return requests`} />

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium mb-1">
              <Package className="h-3.5 w-3.5" /> Total
            </div>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-yellow-600 text-xs font-medium mb-1">
              <Clock className="h-3.5 w-3.5" /> Pending
            </div>
            <p className="text-2xl font-bold">{stats.pending}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-blue-600 text-xs font-medium mb-1">
              <RotateCcw className="h-3.5 w-3.5" /> In Progress
            </div>
            <p className="text-2xl font-bold">{stats.inProgress}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-green-600 text-xs font-medium mb-1">
              <CheckCircle className="h-3.5 w-3.5" /> Completed
            </div>
            <p className="text-2xl font-bold">{stats.completed}</p>
          </div>
        </div>
      )}

      <div className="mb-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns} data={returns} loading={loading}
        searchValue={search} onSearchChange={setSearch}
        searchPlaceholder="Search order # or customer..."
        rowKey={(r) => r._id}
      />
      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} totalItems={totalItems} pageSize={LIMIT} />

      {/* Status Update Dialog */}
      <Dialog open={!!selectedReturn} onOpenChange={(open) => !open && setSelectedReturn(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Return Status</DialogTitle>
          </DialogHeader>
          {selectedReturn && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Order <span className="font-mono font-semibold text-foreground">#{selectedReturn.order.orderNumber}</span> — {selectedReturn.user.name}
              </p>
              <p className="text-sm">
                Current: <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${getReturnStatusColor(selectedReturn.status)}`}>{selectedReturn.status.replace(/_/g, ' ')}</span>
              </p>
              <div>
                <label className="text-sm font-medium mb-1 block">New Status</label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(STATUS_TRANSITIONS[selectedReturn.status] ?? []).map((s) => (
                      <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Message (optional)</label>
                <Input value={statusMessage} onChange={(e) => setStatusMessage(e.target.value)} placeholder="Add a note..." />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedReturn(null)}>Cancel</Button>
            <Button onClick={handleStatusUpdate} disabled={updating || !newStatus}>
              {updating ? 'Updating...' : 'Update Status'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
