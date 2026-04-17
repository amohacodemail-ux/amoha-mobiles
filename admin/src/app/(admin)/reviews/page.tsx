'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { useDebouncedValue } from '@/lib/hooks';
import toast from 'react-hot-toast';
import { Trash2, Star, CheckCircle, XCircle } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable, Column } from '@/components/shared/data-table';
import { Pagination } from '@/components/shared/pagination';
import { ConfirmModal } from '@/components/shared/confirm-modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { reviewService } from '@/services/review.service';
import { formatDate, getInitials } from '@/lib/utils';
import type { Review } from '@/types';

const LIMIT = 10;

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const debouncedSearch = useDebouncedValue(search, 350);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await reviewService.getAll({
        page, limit: LIMIT, search: debouncedSearch,
        ...(statusFilter && statusFilter !== 'all' && { status: statusFilter }),
      });
      setReviews(Array.isArray(res.reviews) ? res.reviews : []);
      setTotalPages(res.totalPages);
      setTotalItems(res.totalReviews);
    } catch { toast.error('Failed to load reviews'); setReviews([]); }
    finally { setLoading(false); }
  }, [page, debouncedSearch, statusFilter]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [debouncedSearch, statusFilter]);

  const handleApprove = async (id: string, approve: boolean) => {
    try {
      await reviewService.updateStatus(id, approve ? 'approved' : 'rejected');
      toast.success(approve ? 'Review approved' : 'Review rejected');
      load();
    } catch { toast.error('Action failed'); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await reviewService.delete(deleteId);
      toast.success('Review deleted');
      setDeleteId(null);
      load();
    } catch { toast.error('Delete failed'); }
    finally { setDeleting(false); }
  };

  const columns: Column<Review>[] = [
    {
      key: 'user', header: 'User',
      render: (r) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
            {getInitials(r.user?.name ?? 'U')}
          </div>
          <span className="text-sm font-medium">{r.user?.name ?? 'Unknown'}</span>
        </div>
      ),
    },
    {
      key: 'product', header: 'Product',
      render: (r) => <span className="text-sm text-muted-foreground line-clamp-1 max-w-[160px]">{r.product?.name ?? '—'}</span>,
    },
    {
      key: 'rating', header: 'Rating',
      render: (r) => (
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className={`h-3 w-3 ${i < r.rating ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground'}`} />
          ))}
          <span className="text-xs text-muted-foreground ml-1">({r.rating})</span>
        </div>
      ),
    },
    {
      key: 'comment', header: 'Comment',
      render: (r) => <p className="text-sm text-muted-foreground line-clamp-2 max-w-[200px]">{r.comment}</p>,
    },
    {
      key: 'status', header: 'Status',
      render: (r) => (
        <Badge variant={r.status === 'approved' ? 'success' : r.status === 'rejected' ? 'destructive' : 'warning'}>
          {r.status}
        </Badge>
      ),
    },
    { key: 'createdAt', header: 'Date', render: (r) => <span className="text-xs text-muted-foreground">{formatDate(r.createdAt)}</span> },
    {
      key: 'actions', header: 'Actions',
      render: (r) => (
        <div className="flex gap-1.5">
          {r.status !== 'approved' && (
            <Button variant="outline" size="icon-sm" className="hover:border-green-500 hover:text-green-600 dark:hover:text-green-400" onClick={() => handleApprove(r._id, true)} title="Approve">
              <CheckCircle className="h-3.5 w-3.5" />
            </Button>
          )}
          {r.status !== 'rejected' && (
            <Button variant="outline" size="icon-sm" className="hover:border-yellow-500 hover:text-yellow-600 dark:hover:text-yellow-400" onClick={() => handleApprove(r._id, false)} title="Reject">
              <XCircle className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button variant="outline" size="icon-sm" className="hover:border-destructive hover:text-destructive" onClick={() => setDeleteId(r._id)}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Reviews" description={`${totalItems} total reviews`}>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </PageHeader>

      <DataTable
        columns={columns} data={reviews} loading={loading}
        searchValue={search} onSearchChange={setSearch}
        searchPlaceholder="Search reviews..."
        rowKey={(r) => r._id}
      />
      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} totalItems={totalItems} pageSize={LIMIT} />
      <ConfirmModal
        open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} loading={deleting}
        title="Delete Review?" description="This review will be permanently deleted."
        confirmLabel="Delete"
      />
    </div>
  );
}
