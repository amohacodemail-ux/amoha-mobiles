'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import apiClient from '@/lib/api-client';
import type { ApiResponse } from '@/types';
import toast from 'react-hot-toast';
import { Plus, RefreshCw, Eye, Trash2, Send } from 'lucide-react';

interface Supplier { _id: string; name: string; companyName: string; email: string; }
interface RFQItem { name: string; sku?: string; quantity: number; unitPrice?: number; notes?: string; }
interface RFQ {
  _id: string;
  rfqNumber: string;
  createdAt: string;
  status: string;
  supplier?: Supplier;
  items: RFQItem[];
  notes?: string;
  supplierNotes?: string;
  supplierQuote?: any;
  quotedAt?: string;
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  sent: 'bg-blue-100 text-blue-700',
  quoted: 'bg-purple-100 text-purple-700',
  accepted: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  closed: 'bg-gray-100 text-gray-500',
};

const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

export default function RFQPage() {
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  // Suppliers for select
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  // Create modal
  const [createOpen, setCreateOpen] = useState(false);
  const [supplierId, setSupplierId] = useState('');
  const [rfqNotes, setRfqNotes] = useState('');
  const [rfqItems, setRfqItems] = useState<RFQItem[]>([{ name: '', quantity: 1 }]);
  const [expectedDelivery, setExpectedDelivery] = useState('');
  const [creating, setCreating] = useState(false);

  // View modal
  const [viewRFQ, setViewRFQ] = useState<RFQ | null>(null);

  // Update status modal
  const [updateOpen, setUpdateOpen] = useState(false);
  const [updateRFQ, setUpdateRFQ] = useState<RFQ | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [supplierNotes, setSupplierNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (statusFilter) params.set('status', statusFilter);
      if (search) params.set('search', search);
      const { data } = await apiClient.get<ApiResponse<any>>(`/rfq?${params}`);
      setRfqs(data.data?.rfqs || []);
      setTotal(data.data?.total || 0);
      setTotalPages(data.data?.totalPages || 1);
    } catch {
      toast.error('Failed to load RFQs');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  const loadSuppliers = async () => {
    try {
      const { data } = await apiClient.get<ApiResponse<any>>('/suppliers?limit=100');
      setSuppliers(data.data?.suppliers || []);
    } catch { /* ignore */ }
  };

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadSuppliers(); }, []);

  const handleCreate = async () => {
    if (!supplierId) { toast.error('Select a supplier'); return; }
    if (rfqItems.some(i => !i.name || i.quantity < 1)) { toast.error('Fill all item names and quantities'); return; }
    setCreating(true);
    try {
      await apiClient.post('/rfq', {
        supplierId,
        items: rfqItems,
        notes: rfqNotes,
        expectedDeliveryDate: expectedDelivery || undefined,
      });
      toast.success('RFQ created and sent to supplier');
      setCreateOpen(false);
      setSupplierId(''); setRfqNotes(''); setExpectedDelivery('');
      setRfqItems([{ name: '', quantity: 1 }]);
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to create RFQ');
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!updateRFQ || !newStatus) return;
    setUpdating(true);
    try {
      await apiClient.put(`/rfq/${updateRFQ._id}`, { status: newStatus, supplierNotes });
      toast.success('RFQ status updated');
      setUpdateOpen(false); setUpdateRFQ(null);
      load();
    } catch {
      toast.error('Failed to update RFQ');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this RFQ?')) return;
    try {
      await apiClient.delete(`/rfq/${id}`);
      toast.success('RFQ deleted');
      load();
    } catch {
      toast.error('Failed to delete RFQ');
    }
  };

  const addItem = () => setRfqItems(prev => [...prev, { name: '', quantity: 1 }]);
  const removeItem = (i: number) => setRfqItems(prev => prev.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: keyof RFQItem, val: string | number) => {
    setRfqItems(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: val } : item));
  };

  return (
    <div>
      <PageHeader
        title="Request for Quote (RFQ)"
        description="Create and manage supplier quotation requests"
        action={
          <Button onClick={() => setCreateOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" /> New RFQ
          </Button>
        }
      />

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search RFQ number..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-48 h-8 text-sm"
        />
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="h-8 rounded-md border border-input bg-background px-3 text-sm text-foreground"
        >
          <option value="">All Status</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="quoted">Quoted</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
          <option value="closed">Closed</option>
        </select>
        <button onClick={load} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <RefreshCw className="h-3 w-3" /> Refresh
        </button>
        <span className="ml-auto text-xs text-muted-foreground">{total} RFQs</span>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">RFQ #</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Date</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Supplier</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Items</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Status</th>
              <th className="text-right px-4 py-3 text-muted-foreground font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</td></tr>
            ) : rfqs.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">No RFQs found. Create your first one.</td></tr>
            ) : rfqs.map((rfq) => (
              <tr key={rfq._id} className="border-b border-border/50 hover:bg-muted/20">
                <td className="px-4 py-3 font-mono text-xs font-semibold text-foreground">{rfq.rfqNumber}</td>
                <td className="px-4 py-3 text-muted-foreground">{fmtDate(rfq.createdAt)}</td>
                <td className="px-4 py-3">
                  <div className="font-medium text-foreground">{rfq.supplier?.companyName || rfq.supplier?.name || 'N/A'}</div>
                  <div className="text-xs text-muted-foreground">{rfq.supplier?.email || ''}</div>
                </td>
                <td className="px-4 py-3 text-foreground">{rfq.items?.length || 0} item{(rfq.items?.length || 0) !== 1 ? 's' : ''}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[rfq.status] || 'bg-gray-100 text-gray-600'}`}>
                    {rfq.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => setViewRFQ(rfq)} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => { setUpdateRFQ(rfq); setNewStatus(rfq.status); setSupplierNotes(rfq.supplierNotes || ''); setUpdateOpen(true); }}
                      className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                      title="Update Status"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(rfq._id)} className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-xs text-muted-foreground">Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
            <Button size="sm" variant="outline" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Next</Button>
          </div>
        </div>
      )}

      {/* Create RFQ Modal */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New RFQ</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Supplier *</label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground"
              >
                <option value="">Select supplier...</option>
                {suppliers.map((s) => (
                  <option key={s._id} value={s._id}>{s.companyName || s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Items *</label>
              <div className="space-y-2">
                {rfqItems.map((item, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-center">
                    <Input placeholder="Item name" value={item.name} onChange={(e) => updateItem(i, 'name', e.target.value)} className="col-span-5 h-8 text-sm" />
                    <Input placeholder="SKU" value={item.sku || ''} onChange={(e) => updateItem(i, 'sku', e.target.value)} className="col-span-2 h-8 text-sm" />
                    <Input type="number" placeholder="Qty" min={1} value={item.quantity} onChange={(e) => updateItem(i, 'quantity', parseInt(e.target.value) || 1)} className="col-span-2 h-8 text-sm" />
                    <Input type="number" placeholder="Est. Price" value={item.unitPrice || ''} onChange={(e) => updateItem(i, 'unitPrice', parseFloat(e.target.value) || 0)} className="col-span-2 h-8 text-sm" />
                    <button onClick={() => removeItem(i)} className="col-span-1 text-red-500 hover:text-red-700 text-xs font-bold">✕</button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addItem}>+ Add Item</Button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Expected Delivery Date</label>
              <Input type="date" value={expectedDelivery} onChange={(e) => setExpectedDelivery(e.target.value)} className="w-48 h-8 text-sm" />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Notes</label>
              <Textarea value={rfqNotes} onChange={(e) => setRfqNotes(e.target.value)} rows={3} placeholder="Any additional requirements..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={creating}>{creating ? 'Creating...' : 'Create & Send RFQ'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View RFQ Modal */}
      {viewRFQ && (
        <Dialog open={!!viewRFQ} onOpenChange={() => setViewRFQ(null)}>
          <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{viewRFQ.rfqNumber}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-muted-foreground">Status:</span> <span className={`px-2 py-0.5 rounded-full text-xs font-medium ml-1 ${STATUS_COLORS[viewRFQ.status] || ''}`}>{viewRFQ.status}</span></div>
                <div><span className="text-muted-foreground">Date:</span> <span className="ml-1">{fmtDate(viewRFQ.createdAt)}</span></div>
              </div>
              <div>
                <span className="text-muted-foreground">Supplier:</span>
                <span className="ml-1 font-medium">{viewRFQ.supplier?.companyName || viewRFQ.supplier?.name || 'N/A'}</span>
                {viewRFQ.supplier?.email && <span className="ml-1 text-muted-foreground">({viewRFQ.supplier.email})</span>}
              </div>
              <div>
                <p className="text-muted-foreground font-medium mb-1">Items:</p>
                <table className="w-full text-xs border rounded-lg overflow-hidden">
                  <thead><tr className="bg-muted/40"><th className="text-left px-3 py-1.5">Name</th><th className="text-left px-3 py-1.5">SKU</th><th className="text-right px-3 py-1.5">Qty</th><th className="text-right px-3 py-1.5">Est. Price</th></tr></thead>
                  <tbody>
                    {(viewRFQ.items || []).map((item, i) => (
                      <tr key={i} className="border-t border-border/30">
                        <td className="px-3 py-1.5">{item.name}</td>
                        <td className="px-3 py-1.5 text-muted-foreground">{item.sku || '-'}</td>
                        <td className="px-3 py-1.5 text-right">{item.quantity}</td>
                        <td className="px-3 py-1.5 text-right">{item.unitPrice ? `₹${item.unitPrice}` : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {viewRFQ.notes && <div><span className="text-muted-foreground">Notes:</span> <span className="ml-1">{viewRFQ.notes}</span></div>}
              {viewRFQ.supplierNotes && <div><span className="text-muted-foreground">Supplier Response:</span> <span className="ml-1">{viewRFQ.supplierNotes}</span></div>}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setViewRFQ(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Update Status Modal */}
      <Dialog open={updateOpen} onOpenChange={setUpdateOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Update RFQ Status</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-sm font-medium mb-1 block">New Status</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                {['draft','sent','quoted','accepted','rejected','closed'].map(s => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Supplier Notes</label>
              <Textarea value={supplierNotes} onChange={(e) => setSupplierNotes(e.target.value)} rows={3} placeholder="Supplier response or notes..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUpdateOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateStatus} disabled={updating}>{updating ? 'Saving...' : 'Update'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
