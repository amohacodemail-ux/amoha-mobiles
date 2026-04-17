'use client';
import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Crown, Users, TrendingUp, UserCheck, UserPlus } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable, Column } from '@/components/shared/data-table';
import { Pagination } from '@/components/shared/pagination';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { crmService, CrmCustomer, SegmentSummary } from '@/services/crm.service';
import { formatCurrency, formatDate, getInitials } from '@/lib/utils';

const LIMIT = 15;

const SEGMENT_CONFIG: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'secondary'; icon: React.ElementType }> = {
  vip: { label: 'VIP', variant: 'default', icon: Crown },
  loyal: { label: 'Loyal', variant: 'success', icon: TrendingUp },
  regular: { label: 'Regular', variant: 'warning', icon: UserCheck },
  new: { label: 'New', variant: 'secondary', icon: UserPlus },
};

export default function CrmPage() {
  const [customers, setCustomers] = useState<CrmCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [segment, setSegment] = useState('all');
  const [segments, setSegments] = useState<SegmentSummary[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await crmService.getCustomers({
        page,
        limit: LIMIT,
        search: search || undefined,
        segment: segment !== 'all' ? segment : undefined,
      });
      setCustomers(Array.isArray(res.customers) ? res.customers : []);
      setTotalPages(res.totalPages);
      setTotalItems(res.total);
    } catch {
      toast.error('Failed to load customers');
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, segment]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search, segment]);

  useEffect(() => {
    crmService.getSegmentSummary().then(setSegments).catch(() => {});
  }, []);

  const getSegmentTotal = (seg: string) =>
    segments.find((s) => s.segment === seg)?.count ?? 0;
  const getSegmentRevenue = (seg: string) =>
    segments.find((s) => s.segment === seg)?.totalRevenue ?? 0;

  const columns: Column<CrmCustomer>[] = [
    {
      key: 'name',
      header: 'Customer',
      render: (c) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
            {getInitials(c.name)}
          </div>
          <div>
            <p className="font-medium text-foreground text-sm">{c.name}</p>
            <p className="text-xs text-muted-foreground">{c.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'segment',
      header: 'Segment',
      render: (c) => {
        const cfg = SEGMENT_CONFIG[c.segment] || SEGMENT_CONFIG.new;
        return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
      },
    },
    {
      key: 'totalOrders',
      header: 'Orders',
      render: (c) => <span className="font-medium">{c.totalOrders}</span>,
    },
    {
      key: 'totalSpent',
      header: 'Lifetime Value',
      render: (c) => <span className="font-semibold text-primary">{formatCurrency(c.totalSpent)}</span>,
    },
    {
      key: 'lastOrderDate',
      header: 'Last Order',
      render: (c) => (
        <span className="text-xs text-muted-foreground">
          {c.lastOrderDate ? formatDate(c.lastOrderDate) : '—'}
        </span>
      ),
    },
    {
      key: 'notesCount',
      header: 'Notes',
      render: (c) => (
        <span className="text-xs text-muted-foreground">{c.notesCount}</span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Joined',
      render: (c) => <span className="text-xs text-muted-foreground">{formatDate(c.createdAt)}</span>,
    },
    {
      key: 'actions',
      header: '',
      render: (c) => (
        <Link href={`/crm/${c._id}`}>
          <Button variant="outline" size="sm">View Profile</Button>
        </Link>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="CRM"
        description="Customer relationship management and segmentation"
      />

      {/* Segment summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {Object.entries(SEGMENT_CONFIG).map(([seg, cfg]) => {
          const Icon = cfg.icon;
          return (
            <Card
              key={seg}
              className={`cursor-pointer transition-all ${segment === seg ? 'ring-2 ring-primary' : 'hover:shadow-md'}`}
              onClick={() => setSegment(segment === seg ? 'all' : seg)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant={cfg.variant}>{cfg.label}</Badge>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold">{getSegmentTotal(seg)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatCurrency(getSegmentRevenue(seg))} revenue
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3 mb-4">
        <Select value={segment} onValueChange={setSegment}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All segments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All customers</SelectItem>
            <SelectItem value="vip">VIP</SelectItem>
            <SelectItem value="loyal">Loyal</SelectItem>
            <SelectItem value="regular">Regular</SelectItem>
            <SelectItem value="new">New</SelectItem>
          </SelectContent>
        </Select>
        {segment !== 'all' && (
          <Button variant="ghost" size="sm" onClick={() => setSegment('all')}>
            Clear filter
          </Button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={customers}
        loading={loading}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by name or email..."
        rowKey={(c) => c._id}
      />
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
        totalItems={totalItems}
        pageSize={LIMIT}
      />
    </div>
  );
}
