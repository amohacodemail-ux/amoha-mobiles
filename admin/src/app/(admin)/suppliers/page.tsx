'use client';
import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  Plus, Pencil, Trash2, Star, TrendingUp, Package, DollarSign,
  Search, ChevronLeft, ChevronRight, Eye, Truck,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable, Column } from '@/components/shared/data-table';
import { ConfirmModal } from '@/components/shared/confirm-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { supplierService } from '@/services/supplier.service';
import { formatDate } from '@/lib/utils';
import type { Supplier, SupplierDashboardStats, PurchaseOrder, SupplierFormData } from '@/types';

const LIMIT = 15;

function StatCard({ title, value, icon: Icon, color }: { title: string; value: string | number; icon: any; color: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
    </div>
  );
}

type Tab = 'suppliers' | 'purchase-orders' | 'analytics';

export default function SuppliersPage() {
  const [tab, setTab] = useState<Tab>('suppliers');
  const [stats, setStats] = useState<SupplierDashboardStats | null>(null);

  // Suppliers state
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Supplier form
  const [formOpen, setFormOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState<SupplierFormData>({
    name: '', email: '', password: '', phone: '', contactPerson: '', addressLine1: '',
    city: '', state: '', pincode: '', gstNumber: '', paymentTerms: 'Net 30',
    status: 'active', notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Purchase Orders
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [poLoading, setPoLoading] = useState(false);
  const [poPage, setPoPage] = useState(1);
  const [poTotalPages, setPoTotalPages] = useState(1);

  const loadStats = async () => {
    try {
      const data = await supplierService.getDashboardStats();
      setStats(data);
    } catch { /* ignore */ }
  };

  const loadSuppliers = useCallback(async () => {
    setLoading(true);
    try {
      const result = await supplierService.getAll({ page, limit: LIMIT, search, status: statusFilter });
      setSuppliers(result.suppliers || []);
      setTotalPages(result.totalPages || 1);
    } catch { toast.error('Failed to load suppliers'); }
    finally { setLoading(false); }
  }, [page, search, statusFilter]);

  const loadPurchaseOrders = useCallback(async () => {
    setPoLoading(true);
    try {
      const result = await supplierService.getAllPurchaseOrders({ page: poPage, limit: LIMIT });
      setPurchaseOrders(result.purchaseOrders || []);
      setPoTotalPages(result.totalPages || 1);
    } catch { toast.error('Failed to load purchase orders'); }
    finally { setPoLoading(false); }
  }, [poPage]);

  useEffect(() => { loadStats(); }, []);
  useEffect(() => { if (tab === 'suppliers') loadSuppliers(); }, [tab, loadSuppliers]);
  useEffect(() => { if (tab === 'purchase-orders') loadPurchaseOrders(); }, [tab, loadPurchaseOrders]);

  const openAdd = () => {
    setEditingSupplier(null);
    setFormData({ name: '', email: '', password: '', phone: '', contactPerson: '', addressLine1: '', city: '', state: '', pincode: '', gstNumber: '', paymentTerms: 'Net 30', status: 'active', notes: '' });
    setFormOpen(true);
  };

  const openEdit = (s: Supplier) => {
    setEditingSupplier(s);
    setFormData({
      name: s.name, email: s.email || '', password: '', phone: s.phone || '', contactPerson: s.contactPerson || '',
      addressLine1: s.addressLine1 || '', city: s.city || '', state: s.state || '', pincode: s.pincode || '',
      gstNumber: s.gstNumber || '', paymentTerms: s.paymentTerms || 'Net 30', status: s.status, notes: s.notes || '',
    });
    setFormOpen(true);
  };

  const handleSubmitForm = async () => {
    if (!formData.name?.trim() && !formData.email?.trim()) return toast.error('Enter either a supplier name or login email');
    if (formData.password && !formData.email) return toast.error('Email is required for supplier login');
    if (formData.password && formData.password.length < 6) return toast.error('Password must be at least 6 characters');
    setSubmitting(true);
    try {
      if (editingSupplier) {
        await supplierService.update(editingSupplier._id, formData);
        toast.success('Supplier updated');
      } else {
        await supplierService.create(formData);
        toast.success('Supplier created');
      }
      setFormOpen(false);
      loadSuppliers();
      loadStats();
    } catch { toast.error('Failed to save supplier'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await supplierService.delete(deleteId);
      toast.success('Supplier deleted');
      setDeleteId(null);
      loadSuppliers();
      loadStats();
    } catch { toast.error('Failed to delete supplier'); }
    finally { setDeleting(false); }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-50 text-green-700 border-green-200';
      case 'inactive': return 'bg-gray-50 text-gray-700 border-gray-200';
      case 'blacklisted': return 'bg-red-50 text-red-700 border-red-200';
      default: return '';
    }
  };

  const poStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-50 text-gray-700 border-gray-200';
      case 'sent': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'confirmed': return 'bg-green-50 text-green-700 border-green-200';
      case 'partially_received': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'received': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'cancelled': return 'bg-red-50 text-red-700 border-red-200';
      default: return '';
    }
  };

  const supplierColumns: Column<Supplier>[] = [
    {
      key: 'name', header: 'Supplier', sortable: true,
      render: (s) => (
        <div>
          <p className="font-medium text-foreground">{s.name}</p>
          <p className="text-xs text-muted-foreground">{s.code}</p>
        </div>
      ),
    },
    { key: 'contactPerson', header: 'Contact', render: (s) => <span className="text-sm">{s.contactPerson || '-'}</span> },
    { key: 'phone', header: 'Phone', render: (s) => <span className="text-sm">{s.phone || '-'}</span> },
    {
      key: 'reliabilityScore', header: 'Reliability',
      render: (s) => (
        <div className="flex items-center gap-1">
          <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
          <span className="text-sm font-medium">{s.reliabilityScore?.toFixed(1) || '0.0'}</span>
        </div>
      ),
    },
    { key: 'totalOrders', header: 'Orders', render: (s) => <span className="text-sm">{s.totalOrders || 0}</span> },
    {
      key: 'status', header: 'Status',
      render: (s) => <Badge variant="outline" className={statusColor(s.status)}>{s.status}</Badge>,
    },
    {
      key: 'actions', header: '',
      render: (s) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => openEdit(s)}><Pencil className="h-3.5 w-3.5" /></Button>
          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setDeleteId(s._id)}><Trash2 className="h-3.5 w-3.5" /></Button>
        </div>
      ),
    },
  ];

  const poColumns: Column<PurchaseOrder>[] = [
    { key: 'poNumber', header: 'PO Number', render: (po) => <span className="font-medium">{po.poNumber}</span> },
    { key: 'supplier', header: 'Supplier', render: (po) => <span className="text-sm">{po.suppliers?.name || '-'}</span> },
    {
      key: 'status', header: 'Status',
      render: (po) => <Badge variant="outline" className={poStatusColor(po.status)}>{po.status.replace(/_/g, ' ')}</Badge>,
    },
    { key: 'totalAmount', header: 'Amount', render: (po) => <span className="text-sm font-medium">₹{Number(po.totalAmount).toLocaleString()}</span> },
    {
      key: 'paymentStatus', header: 'Payment',
      render: (po) => <Badge variant="outline" className={po.paymentStatus === 'paid' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}>{po.paymentStatus}</Badge>,
    },
    { key: 'orderDate', header: 'Date', render: (po) => <span className="text-sm text-muted-foreground">{formatDate(po.orderDate)}</span> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Supplier Management"
        description="Manage suppliers, purchase orders, and performance"
        action={tab === 'suppliers' ? <Button onClick={openAdd}><Plus className="h-4 w-4 mr-2" /> Add Supplier</Button> : undefined}
      />

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Active Suppliers" value={stats.totalSuppliers} icon={Truck} color="bg-blue-500" />
          <StatCard title="Total POs" value={stats.totalPOs} icon={Package} color="bg-emerald-500" />
          <StatCard title="Pending POs" value={stats.pendingPOs} icon={TrendingUp} color="bg-yellow-500" />
          <StatCard title="Purchase Value" value={`₹${(stats.totalPurchaseValue || 0).toLocaleString()}`} icon={DollarSign} color="bg-purple-500" />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {(['suppliers', 'purchase-orders', 'analytics'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
            {t === 'suppliers' ? 'Suppliers' : t === 'purchase-orders' ? 'Purchase Orders' : 'Analytics'}
          </button>
        ))}
      </div>

      {/* Suppliers Tab */}
      {tab === 'suppliers' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search suppliers..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="pl-9" />
            </div>
            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 border border-border rounded-lg text-sm bg-background">
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="blacklisted">Blacklisted</option>
            </select>
          </div>

          <DataTable columns={supplierColumns} data={suppliers} loading={loading} rowKey={(s) => s._id} />

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Purchase Orders Tab */}
      {tab === 'purchase-orders' && (
        <div className="space-y-4">
          <DataTable columns={poColumns} data={purchaseOrders} loading={poLoading} rowKey={(po) => po._id} />
          {poTotalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setPoPage(p => Math.max(1, p - 1))} disabled={poPage <= 1}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">Page {poPage} of {poTotalPages}</span>
              <Button variant="outline" size="sm" onClick={() => setPoPage(p => Math.min(poTotalPages, p + 1))} disabled={poPage >= poTotalPages}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Analytics Tab */}
      {tab === 'analytics' && stats?.topSuppliers && (
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Top Suppliers by Reliability</h3>
          <div className="space-y-3">
            {stats.topSuppliers.map((s: any, i: number) => (
              <div key={s._id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">{i + 1}</div>
                  <div>
                    <p className="font-medium">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.code}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                      <span className="text-sm font-semibold">{s.reliabilityScore?.toFixed(1) || '0.0'}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{s.totalOrders || 0} orders</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Supplier Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingSupplier ? 'Edit Supplier' : 'Add Supplier'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Supplier Name</label>
              <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Optional if you only want to create login access" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Login Email / ID</label>
                <Input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="supplier@example.com" />
              </div>
              <div>
                <label className="text-sm font-medium">Phone</label>
                <Input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Password</label>
              <Input type="password" value={formData.password || ''} onChange={e => setFormData({ ...formData, password: e.target.value })} placeholder={editingSupplier ? 'Leave blank to keep existing password' : 'Set supplier login password'} />
              <p className="text-xs text-muted-foreground mt-1">You can create only login access here. The supplier can sign in later and complete the remaining details by themselves.</p>
            </div>
            <div>
              <label className="text-sm font-medium">Contact Person</label>
              <Input value={formData.contactPerson} onChange={e => setFormData({ ...formData, contactPerson: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Address</label>
              <Input value={formData.addressLine1} onChange={e => setFormData({ ...formData, addressLine1: e.target.value })} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-sm font-medium">City</label>
                <Input value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">State</label>
                <Input value={formData.state} onChange={e => setFormData({ ...formData, state: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">Pincode</label>
                <Input value={formData.pincode} onChange={e => setFormData({ ...formData, pincode: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">GST Number</label>
                <Input value={formData.gstNumber} onChange={e => setFormData({ ...formData, gstNumber: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">Payment Terms</label>
                <Input value={formData.paymentTerms} onChange={e => setFormData({ ...formData, paymentTerms: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Status</label>
              <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="blacklisted">Blacklisted</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Notes</label>
              <Textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmitForm} disabled={submitting}>
              {submitting ? 'Saving...' : editingSupplier ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Supplier"
        description="This will permanently delete this supplier and all related data."
      />
    </div>
  );
}
