'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useDebouncedValue } from '@/lib/hooks';
import toast from 'react-hot-toast';
import { Trash2, Eye, Clock, CheckCircle, Wrench, XCircle, Download } from 'lucide-react';
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
import { usePermissions, useModulePermissions, MODULES } from '@/hooks/usePermissions';
import { WalkInRegistrationModal } from './WalkInRegistrationModal';
import { ServiceBillingSection } from './ServiceBillingSection';

const LIMIT = 10;

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'new_request', label: 'New Request' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const STATUS_COLORS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  new_request: 'secondary',
  accepted: 'default',
  in_progress: 'default',
  completed: 'default',
  cancelled: 'destructive',
};

export default function ServiceRequestsPage() {
  const searchParams = useSearchParams();
  const idParam = searchParams.get('id');

  const { isAdmin, canDelete, role, user } = usePermissions();
  const { canEdit: baseCanEdit, canCreate } = useModulePermissions(MODULES.SERVICE_REQUESTS);
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
  const [billingRequest, setBillingRequest] = useState<ServiceRequest | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [finalPrice, setFinalPrice] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [engineers, setEngineers] = useState<any[]>([]);
  const [isWalkInModalOpen, setIsWalkInModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'requests' | 'assigned' | 'billing'>('requests');
  const canEdit = baseCanEdit && (role !== 'service_engineer' || activeTab === 'assigned');

  const debouncedSearch = useDebouncedValue(search, 350);

  useEffect(() => {
    if (isAdmin()) {
      import('@/lib/api-client').then(apiClient => {
        apiClient.default.get('/admin/admin-users?role=service_engineer&limit=100').then(res => {
          setEngineers(res.data.data.users || []);
        }).catch(() => {});
      });
    }
  }, [isAdmin]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Service engineers always see only their assigned requests
      const isServiceEngineer = role === 'service_engineer';
      const [res, statsRes] = await Promise.all([
        serviceRequestService.getAll({ 
          page, 
          limit: LIMIT, 
          search: debouncedSearch, 
          status: (statusFilter && statusFilter !== 'all') ? statusFilter : undefined,
          assignedTo: (isServiceEngineer || activeTab === 'assigned') ? user?._id : undefined
        }),
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
  }, [page, debouncedSearch, statusFilter, role, user?._id, activeTab]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [debouncedSearch, statusFilter, activeTab]);

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

  const openDetail = useCallback((req: ServiceRequest) => {
    setDetailRequest(req);
    setNewStatus(req.status);
    setAdminNotes(req.adminNotes || '');
    setFinalPrice(req.finalPrice ? String(req.finalPrice) : '');
    setAssignedTo(req.assignedTo || '');
  }, []);

  useEffect(() => {
    if (idParam) {
      serviceRequestService.getById(idParam).then(req => {
        openDetail(req);
      }).catch(() => {
        toast.error('Failed to load the specific service request details.');
      });
    }
  }, [idParam, openDetail]);

  const handleUpdateStatus = async () => {
    if (!detailRequest) return;
    setUpdatingStatus(true);
    try {
      await serviceRequestService.updateStatus(
        detailRequest._id,
        newStatus,
        adminNotes,
        finalPrice ? Number(finalPrice) : undefined,
        undefined,
        assignedTo || undefined
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
          <div className="flex items-center gap-2">
            <p className="text-sm text-foreground">{r.customerName}</p>
            {r.user ? (
              <Badge variant="outline" className="text-xs">Registered</Badge>
            ) : (
              <Badge variant="secondary" className="text-xs">Guest</Badge>
            )}
          </div>
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
          {isAdmin() && (
            <Button size="icon" variant="ghost" onClick={() => setDeleteId(r._id)} className="text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  const billingColumns: Column<ServiceRequest>[] = [
    {
      key: 'requestNumber',
      header: 'Request ID',
      render: (r) => <span className="font-medium text-sm">{r.requestNumber}</span>,
    },
    {
      key: 'customer',
      header: 'Customer',
      render: (r) => (
        <div>
          <p className="text-sm font-medium">{r.customerName}</p>
          {r.customerEmail && <p className="text-xs text-muted-foreground">{r.customerEmail}</p>}
        </div>
      ),
    },
    {
      key: 'source',
      header: 'Source',
      render: (r) => (
        <Badge variant={r.isWalkIn ? 'secondary' : 'outline'} className="capitalize">
          {r.isWalkIn ? 'Walk-in' : 'Online'}
        </Badge>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (r) => <span className="text-sm font-semibold">₹{r.totalAmount || 0}</span>,
    },
    {
      key: 'orderStatus',
      header: 'Order Status',
      render: (r) => (
        <Badge variant={STATUS_COLORS[r.status] || 'secondary'}>
          {r.status.replace('_', ' ')}
        </Badge>
      ),
    },
    {
      key: 'paymentStatus',
      header: 'Payment Status',
      render: (r) => (
        <Badge variant={r.paymentStatus === 'paid' ? 'default' : 'secondary'} className="capitalize">
          {r.paymentStatus || 'Pending'}
        </Badge>
      ),
    },
    {
      key: 'paymentMethod',
      header: 'Payment Method',
      render: (r) => <span className="text-sm capitalize">{r.paymentMethod || '—'}</span>,
    },
    {
      key: 'date',
      header: 'Date',
      render: (r) => <span className="text-sm text-muted-foreground">{formatDate(r.createdAt)}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'w-24',
      render: (r) => (
        <div className="flex items-center gap-1">
          <Button 
            size="icon" 
            variant="ghost" 
            onClick={() => setBillingRequest(r)}
            title="Update Billing"
          >
            <Wrench className="h-4 w-4" />
          </Button>
          <Button 
            size="icon" 
            variant="ghost" 
            onClick={async () => {
              try {
                await serviceRequestService.downloadInvoice(r._id, r.invoiceNumber || r.requestNumber);
              } catch (err) {
                toast.error('Failed to download invoice');
              }
            }}
            title="Download Invoice"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Service Requests" description="Manage mobile repair and service requests">
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Statuses" /></SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((o) => (
                <SelectItem key={o.value || 'all'} value={o.value || 'all'}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {canCreate && (
            <Button onClick={() => setIsWalkInModalOpen(true)}>Register Walk-in</Button>
          )}
        </div>
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

      {/* Tabs */}
      <div className="flex gap-6 border-b border-border mb-6">
        <button
          className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'requests'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setActiveTab('requests')}
        >
          Service Requests
        </button>
        {role === 'service_engineer' && (
          <button
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'assigned'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab('assigned')}
          >
            Assigned to Me
          </button>
        )}
        {isAdmin() && (
          <button
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'billing'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab('billing')}
          >
            Billing & Invoices
          </button>
        )}
      </div>

      <DataTable
        columns={activeTab === 'billing' ? billingColumns : columns}
        data={requests}
        loading={loading}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder={activeTab === 'billing' ? "Search invoices..." : "Search by name, email, or request number..."}
        emptyMessage={activeTab === 'billing' ? "No billing records found." : activeTab === 'assigned' ? "No requests assigned to you." : "No service requests found."}
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
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{detailRequest?.requestNumber}</DialogTitle>
          </DialogHeader>
          {detailRequest && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Customer</p>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground">{detailRequest.customerName}</p>
                    {detailRequest.user ? (
                      <Badge variant="outline" className="text-xs">Registered</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">Guest</Badge>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="text-foreground">{detailRequest.customerPhone}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-foreground">{detailRequest.customerEmail}</p>
                </div>
                {detailRequest.user && (
                  <div>
                    <p className="text-xs text-muted-foreground">User Account</p>
                    <p className="text-foreground">{detailRequest.user.name}</p>
                    <p className="text-xs text-muted-foreground">{detailRequest.user.email}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-muted-foreground">Device</p>
                  <p className="text-foreground">{detailRequest.deviceBrand} {detailRequest.deviceModel}</p>
                  {detailRequest.imeiOrSerialNumber && (
                    <p className="text-xs text-muted-foreground mt-0.5">IMEI/SN: {detailRequest.imeiOrSerialNumber}</p>
                  )}
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
              
              {/* Display photos if available */}
              {(detailRequest.customerPhotoUrl || detailRequest.devicePhotoUrl) && (
                <div className="grid grid-cols-2 gap-4 mt-2">
                  {detailRequest.customerPhotoUrl && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Customer Photo</p>
                      <img src={detailRequest.customerPhotoUrl} alt="Customer" className="w-full h-32 object-cover rounded-md border border-border" />
                    </div>
                  )}
                  {detailRequest.devicePhotoUrl && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Device Photo</p>
                      <img src={detailRequest.devicePhotoUrl} alt="Device" className="w-full h-32 object-cover rounded-md border border-border" />
                    </div>
                  )}
                </div>
              )}

              <hr className="border-border" />
              {canEdit ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Update Status</label>
                    <Select value={newStatus} onValueChange={setNewStatus}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.filter((o) => {
                          if (!o.value || o.value === 'all') return false;
                          if (role === 'service_engineer') {
                            // Mirror backend ENGINEER_ALLOWED_TRANSITIONS exactly
                            const allowedTransitions: Record<string, string[]> = {
                              accepted:    ['in_progress'],
                              in_progress: ['completed'],
                            };
                            const allowed = allowedTransitions[detailRequest?.status ?? ''] || [];
                            return allowed.includes(o.value);
                          }
                          return true;
                        }).map((o) => (
                          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {isAdmin() && (
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">Assign To Engineer</label>
                      <Select value={assignedTo} onValueChange={setAssignedTo}>
                        <SelectTrigger><SelectValue placeholder="Select an engineer" /></SelectTrigger>
                        <SelectContent>
                          {engineers.map((e) => (
                            <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {isAdmin() && (
                    <Input label="Final Price" type="number" placeholder="Optional" value={finalPrice} onChange={(e) => setFinalPrice(e.target.value)} />
                  )}
                  <Textarea label="Admin/Service Notes" placeholder="Internal notes..." rows={3} value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} />
                </>
              ) : (
                <>
                  {detailRequest.finalPrice != null && (
                    <div>
                      <p className="text-xs text-muted-foreground">Final Price</p>
                      <p className="text-foreground mt-0.5 font-semibold">₹{detailRequest.finalPrice}</p>
                    </div>
                  )}
                  {detailRequest.adminNotes && (
                    <div>
                      <p className="text-xs text-muted-foreground">Admin Notes</p>
                      <p className="text-foreground mt-0.5">{detailRequest.adminNotes}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDetailRequest(null)}>{canEdit ? 'Cancel' : 'Close'}</Button>
            {canEdit && <Button onClick={handleUpdateStatus} loading={updatingStatus}>Update</Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Walk-in Registration */}
      <WalkInRegistrationModal 
        open={isWalkInModalOpen} 
        onClose={() => setIsWalkInModalOpen(false)} 
        onSuccess={load} 
      />

      {/* Billing Update Modal */}
      <Dialog open={!!billingRequest} onOpenChange={(open) => { if (!open) setBillingRequest(null); }}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Billing & Invoice - {billingRequest?.requestNumber}</DialogTitle>
          </DialogHeader>
          {billingRequest && (
            <ServiceBillingSection 
              request={billingRequest} 
              canEdit={canEdit} 
              onUpdate={() => {
                load();
                serviceRequestService.getById(billingRequest._id).then(setBillingRequest);
              }} 
            />
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setBillingRequest(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
