'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { useDebouncedValue } from '@/lib/hooks';
import toast from 'react-hot-toast';
import { Trash2, Eye, Clock, CheckCircle, Wrench, XCircle } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable, Column } from '@/components/shared/data-table';
import { Pagination } from '@/components/shared/pagination';
import { ConfirmModal } from '@/components/shared/confirm-modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  serviceRequestService,
  type ServiceRequest,
  type ServiceStats,
} from '@/services/service-request.service';
import { formatDate } from '@/lib/utils';

const LIMIT = 10;

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const STATUS_COLORS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'secondary',
  accepted: 'default',
  in_progress: 'default',
  completed: 'default',
  cancelled: 'destructive',
};

export default function ServiceRequestsPage() {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [stats, setStats] = useState<ServiceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [detailRequest, setDetailRequest] = useState<ServiceRequest | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [finalPrice, setFinalPrice] = useState('');

  const debouncedSearch = useDebouncedValue(search, 350);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [res, statsRes] = await Promise.all([
        serviceRequestService.getAll({ page, limit: LIMIT, search: debouncedSearch, status: (statusFilter && statusFilter !== 'all') ? statusFilter : undefined }),
        serviceRequestService.getStats(),
      ]);
      setRequests(Array.isArray(res.requests) ? res.requests : []);
      setTotalPages(res.totalPages);
      setTotalItems(res.totalRequests);
      setStats(statsRes);
    } catch {
      toast.error('Failed to load service requests');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [debouncedSearch, statusFilter]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await serviceRequestService.delete(deleteId);
      toast.success('Service request deleted');
      setDeleteId(null);
      load();
    } catch {
      toast.error('Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const openDetail = (req: ServiceRequest) => {
    setDetailRequest(req);
    setNewStatus(req.status);
    setAdminNotes(req.adminNotes || '');
    setFinalPrice(req.finalPrice ? String(req.finalPrice) : '');
  };

  const handleUpdateStatus = async () => {
    if (!detailRequest) return;
    setUpdatingStatus(true);
    try {
      await serviceRequestService.updateStatus(
        detailRequest._id,
        newStatus,
        adminNotes,
        finalPrice ? Number(finalPrice) : undefined,
      );
      toast.success('Status updated');
      setDetailRequest(null);
      load();
    } catch {
      toast.error('Update failed');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const columns: Column<ServiceRequest>[] = [
    {
      key: 'requestNumber',
      header: 'Request',
      render: (r) => (
        <div>
          <p className="font-medium text-foreground text-sm">{r.requestNumber}</p>
          <p className="text-xs text-muted-foreground">{formatDate(r.createdAt)}</p>
        </div>
      ),
    },
    {
      key: 'customer',
      header: 'Customer',
      render: (r) => (
        <div>
          <p className="text-sm text-foreground">{r.customerName}</p>
          <p className="text-xs text-muted-foreground">{r.customerPhone}</p>
        </div>
      ),
    },
    {
      key: 'device',
      header: 'Device',
      render: (r) => (
        <span className="text-sm text-muted-foreground">{r.deviceBrand} {r.deviceModel}</span>
      ),
    },
    {
      key: 'serviceType',
      header: 'Service',
      render: (r) => <span className="text-sm text-foreground">{r.serviceType}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => (
        <Badge variant={STATUS_COLORS[r.status] || 'secondary'}>
          {r.status.replace('_', ' ')}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-24',
      render: (r) => (
        <div className="flex items-center gap-1">
          <Button size="icon" variant="ghost" onClick={() => openDetail(r)}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={() => setDeleteId(r._id)} className="text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Service Requests" description="Manage mobile repair and service requests">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value || 'all'} value={o.value || 'all'}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </PageHeader>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total', value: stats.total, icon: Wrench, color: 'text-primary' },
            { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-yellow-500' },
            { label: 'In Progress', value: stats.inProgress, icon: CheckCircle, color: 'text-cyan-500' },
            { label: 'Completed', value: stats.completed, icon: CheckCircle, color: 'text-green-500' },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-border p-4 flex items-center gap-3">
              <s.icon className={`h-8 w-8 ${s.color}`} />
              <div>
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <DataTable
        columns={columns}
        data={requests}
        loading={loading}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by name, email, or request number..."
        emptyMessage="No service requests found."
        rowKey={(r) => r._id}
      />
      <Pagination currentPage={page} totalPages={totalPages} totalItems={totalItems} onPageChange={setPage} />

      {/* Delete Confirmation */}
      <ConfirmModal
        open={!!deleteId}
        title="Delete Service Request"
        description="Are you sure you want to delete this service request? This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteId(null)}
      />

      {/* Detail / Status Update Modal */}
      <Dialog open={!!detailRequest} onOpenChange={(open) => { if (!open) setDetailRequest(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{detailRequest?.requestNumber}</DialogTitle>
          </DialogHeader>
          {detailRequest && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Customer</p>
                  <p className="font-medium text-foreground">{detailRequest.customerName}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="text-foreground">{detailRequest.customerPhone}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-foreground">{detailRequest.customerEmail}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Device</p>
                  <p className="text-foreground">{detailRequest.deviceBrand} {detailRequest.deviceModel}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Service</p>
                  <p className="text-foreground">{detailRequest.serviceType}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Date</p>
                  <p className="text-foreground">{formatDate(detailRequest.createdAt)}</p>
                </div>
              </div>
              {detailRequest.description && (
                <div>
                  <p className="text-xs text-muted-foreground">Description</p>
                  <p className="text-foreground mt-0.5">{detailRequest.description}</p>
                </div>
              )}
              <hr className="border-border" />
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Update Status</label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.filter((o) => o.value && o.value !== 'all').map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Input label="Final Price" type="number" placeholder="Optional" value={finalPrice} onChange={(e) => setFinalPrice(e.target.value)} />
              <Textarea label="Admin Notes" placeholder="Internal notes..." rows={3} value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} />
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDetailRequest(null)}>Cancel</Button>
            <Button onClick={handleUpdateStatus} loading={updatingStatus}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
