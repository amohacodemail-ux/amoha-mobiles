'use client';
import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Activity, Filter } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable, Column } from '@/components/shared/data-table';
import { Pagination } from '@/components/shared/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { activityLogService } from '@/services/activity-log.service';
import { formatDateTime } from '@/lib/utils';
import type { ActivityLog } from '@/types';

const LIMIT = 30;

const RESOURCE_OPTIONS = [
  { label: 'All Resources', value: 'all' },
  { label: 'Product', value: 'product' },
  { label: 'Order', value: 'order' },
  { label: 'User', value: 'user' },
  { label: 'Coupon', value: 'coupon' },
  { label: 'Banner', value: 'banner' },
  { label: 'Category', value: 'category' },
  { label: 'Return', value: 'return' },
  { label: 'Wallet', value: 'wallet' },
  { label: 'Settings', value: 'settings' },
];

const ACTION_OPTIONS = [
  { label: 'All Actions', value: 'all' },
  { label: 'Create', value: 'create' },
  { label: 'Update', value: 'update' },
  { label: 'Delete', value: 'delete' },
  { label: 'Login', value: 'login' },
  { label: 'Status Change', value: 'status_change' },
];

function getActionColor(action: string): string {
  if (action.includes('create')) return 'bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30';
  if (action.includes('delete')) return 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30';
  if (action.includes('update') || action.includes('status')) return 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30';
  if (action.includes('login')) return 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30';
  return 'bg-gray-500/15 text-gray-600 dark:text-gray-400 border-gray-500/30';
}

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [resourceFilter, setResourceFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await activityLogService.getAll({
        page, limit: LIMIT, search,
        ...(resourceFilter !== 'all' && { resource: resourceFilter }),
        ...(actionFilter !== 'all' && { action: actionFilter }),
      });
      setLogs(Array.isArray(res.items) ? res.items : []);
      setTotalPages(res.totalPages);
      setTotalItems(res.totalItems);
    } catch { toast.error('Failed to load activity logs'); setLogs([]); }
    finally { setLoading(false); }
  }, [page, search, resourceFilter, actionFilter]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search, resourceFilter, actionFilter]);

  const columns: Column<ActivityLog>[] = [
    {
      key: 'createdAt', header: 'Time',
      render: (l) => <span className="text-xs text-muted-foreground whitespace-nowrap">{formatDateTime(l.createdAt)}</span>,
    },
    {
      key: 'user', header: 'User',
      render: (l) => (
        <div>
          <p className="font-medium text-foreground text-sm">{l.user?.name ?? 'System'}</p>
          <p className="text-xs text-muted-foreground">{l.user?.email ?? ''}</p>
        </div>
      ),
    },
    {
      key: 'action', header: 'Action',
      render: (l) => (
        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${getActionColor(l.action)}`}>
          {l.action.replace(/_/g, ' ')}
        </span>
      ),
    },
    {
      key: 'resource', header: 'Resource',
      render: (l) => (
        <div>
          <span className="text-sm capitalize font-medium">{l.resource}</span>
          {l.resourceId && <span className="text-xs text-muted-foreground ml-1 font-mono">({l.resourceId.slice(-6)})</span>}
        </div>
      ),
    },
    {
      key: 'details', header: 'Details',
      render: (l) => <span className="text-xs text-muted-foreground max-w-xs truncate block">{l.details ?? '—'}</span>,
    },
    {
      key: 'changes', header: 'Changes',
      render: (l) => l.changes && l.changes.length > 0 ? (
        <span className="text-xs text-primary font-medium">{l.changes.length} field{l.changes.length > 1 ? 's' : ''}</span>
      ) : <span className="text-xs text-muted-foreground">—</span>,
    },
    {
      key: 'ip', header: 'IP',
      render: (l) => <span className="text-xs font-mono text-muted-foreground">{l.ipAddress ?? '—'}</span>,
    },
  ];

  return (
    <div>
      <PageHeader title="Activity Logs" description={`${totalItems} audit trail entries`}>
        <div className="flex items-center gap-2">
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Action" />
            </SelectTrigger>
            <SelectContent>
              {ACTION_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={resourceFilter} onValueChange={setResourceFilter}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Resource" />
            </SelectTrigger>
            <SelectContent>
              {RESOURCE_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </PageHeader>

      <DataTable
        columns={columns} data={logs} loading={loading}
        searchValue={search} onSearchChange={setSearch}
        searchPlaceholder="Search logs..."
        rowKey={(l) => l._id}
      />
      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} totalItems={totalItems} pageSize={LIMIT} />
    </div>
  );
}
