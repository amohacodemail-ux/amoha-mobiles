'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import apiClient from '@/lib/api-client';
import type { ApiResponse } from '@/types';
import toast from 'react-hot-toast';
import { Plus, RefreshCw, Eye, CheckCircle, XCircle, ArrowRight } from 'lucide-react';

interface PRItem { name: string; sku?: string; quantity: number; unitPrice?: number; }
interface PurchaseRequest {
  _id: string;
  prNumber: string;
  createdAt: string;
  status: string;
  urgency: string;
  reason: string;
  items: PRItem[];
  notes?: string;
  approvalNotes?: string;
  requestedBy?: { _id: string; name: string; email: string };
  approvedBy?: { _id: string; name: string; email: string };
}

interface Supplier { _id: string; name: string; companyName: string; }

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  converted: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-gray-100 text-gray-500',
};
const URGENCY_COLORS: Record<string, string> = {
  low: 'bg-gray-100 text-gray-600',
  normal: 'bg-blue-50 text-blue-600',
  high: 'bg-orange-100 text-orange-600',
  urgent: 'bg-red-100 text-red-600',
};

const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

export default function PurchaseRequestsPage() {
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  // Create modal
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newReason, setNewReason] = useState('');
  const [newUrgency, setNewUrgency] = useState('normal');
  const [newNotes, setNewNotes] = useState('');
  const [newSupplierId, setNewSupplierId] = useState('');
  const [newItems, setNewItems] = useState<PRItem[]>([{ name: '', quantity: 1 }]);

  // View / approve modals
  const [viewPR, setViewPR] = useState<PurchaseRequest | null>(null);
  const [approveOpen, setApproveOpen] = useState(false);
  const [approvePR, setApprovePR] = useState<PurchaseRequest | null>(null);
  const [approveNotes, setApproveNotes] = useState('');
  const [approving, setApproving] = useState(false);
  const [isReject, setIsReject] = useState(false);

  // Convert to PO modal
  const [convertOpen, setConvertOpen] = useState(false);
  const [convertPR, setConvertPR] = useState<PurchaseRequest | null>(null);
  const [convertSupplierId, setConvertSupplierId] = useState('');
  const [convertDelivery, setConvertDelivery] = useState('');
  const [converting, setConverting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (statusFilter) params.set('status', statusFilter);
      const { data } = await apiClient.get<ApiResponse<any>>(`/purchase-requests?${params}`);
      setRequests(data.data?.requests || []);
      setTotal(data.data?.total || 0);
      setTotalPages(data.data?.totalPages || 1);
    } catch {
      toast.error('Failed to load purchase requests');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  const loadSuppliers = async () => {
    try {
      const { data } = await apiClient.get<ApiResponse<any>>('/suppliers?limit=100');
      setSuppliers(data.data?.suppliers || []);
    } catch { /* ignore */ }
  };

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadSuppliers(); }, []);

  const handleCreate = async () => {
    if (!newReason) { toast.error('Reason is required'); return; }
    if (newItems.some(i => !i.name || i.quantity < 1)) { toast.error('Fill all item names and quantities'); return; }
    setCreating(true);
    try {
      await apiClient.post('/purchase-requests', {
        items: newItems,
        reason: newReason,
        urgency: newUrgency,
        notes: newNotes || undefined,
        supplierId: newSupplierId || undefined,
      });
      toast.success('Purchase request created');
      setCreateOpen(false);
      setNewReason(''); setNewUrgency('normal'); setNewNotes(''); setNewSupplierId('');
      setNewItems([{ name: '', quantity: 1 }]);
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to create request');
    } finally {
      setCreating(false);
    }
  };

  const handleApprove = async () => {
    if (!approvePR) return;
    setApproving(true);
    try {
      const endpoint = isReject ? `/purchase-requests/${approvePR._id}/reject` : `/purchase-requests/${approvePR._id}/approve`;
      await apiClient.patch(endpoint, { notes: approveNotes });
      toast.success(isReject ? 'Purchase request rejected' : 'Purchase request approved');
      setApproveOpen(false); setApprovePR(null); setApproveNotes('');
      load();
    } catch {
      toast.error('Failed to update request');
    } finally {
      setApproving(false);
    }
  };

  const handleConvert = async () => {
    if (!convertPR || !convertSupplierId) { toast.error('Select a supplier'); return; }
    setConverting(true);
    try {
      await apiClient.post(`/purchase-requests/${convertPR._id}/convert-to-po`, {
        supplierId: convertSupplierId,
        expectedDeliveryDate: convertDelivery || undefined,
      });
      toast.success('Purchase Order generated successfully');
      setConvertOpen(false); setConvertPR(null); setConvertSupplierId(''); setConvertDelivery('');
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to generate PO');
    } finally {
      setConverting(false);
    }
  };

  const addItem = () => setNewItems(prev => [...prev, { name: '', quantity: 1 }]);
  const removeItem = (i: number) => setNewItems(prev => prev.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: keyof PRItem, val: string | number) =>
    setNewItems(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: val } : item));

  return (
    <div>
      <PageHeader
        title="Purchase Requests"
        description="Raise, approve and convert internal purchase requests to POs"
        action={
          <Button onClick={() => setCreateOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" /> New Request
          </Button>
        }
      />

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="h-8 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="converted">Converted to PO</option>
        </select>
        <button onClick={load} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <RefreshCw className="h-3 w-3" /> Refresh
        </button>
        <span className="ml-auto text-xs text-muted-foreground">{total} requests</span>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">PR #</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Date</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Requested By</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Reason</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Urgency</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Items</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Status</th>
              <th className="text-right px-4 py-3 text-muted-foreground font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="text-center py-8 text-muted-foreground">Loading...</td></tr>
            ) : requests.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-8 text-muted-foreground">No purchase requests found</td></tr>
            ) : requests.map((pr) => (
              <tr key={pr._id} className="border-b border-border/50 hover:bg-muted/20">
                <td className="px-4 py-3 font-mono text-xs font-semibold text-foreground">{pr.prNumber}</td>
                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{fmtDate(pr.createdAt)}</td>
                <td className="px-4 py-3">
                  <div className="font-medium text-foreground">{pr.requestedBy?.name || 'Admin'}</div>
                  <div className="text-xs text-muted-foreground">{pr.requestedBy?.email || ''}</div>
                </td>
                <td className="px-4 py-3 max-w-[180px] truncate text-foreground">{pr.reason}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${URGENCY_COLORS[pr.urgency] || ''}`}>{pr.urgency}</span>
                </td>
                <td className="px-4 py-3 text-foreground">{pr.items?.length || 0}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[pr.status] || ''}`}>
                    {pr.status === 'converted' ? 'PO Created' : pr.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => setViewPR(pr)} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground" title="View">
                      <Eye className="h-4 w-4" />
                    </button>
                    {pr.status === 'pending' && (
                      <>
                        <button
                          onClick={() => { setApprovePR(pr); setIsReject(false); setApproveOpen(true); }}
                          className="p-1.5 rounded hover:bg-green-50 text-muted-foreground hover:text-green-600"
                          title="Approve"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => { setApprovePR(pr); setIsReject(true); setApproveOpen(true); }}
                          className="p-1.5 rounded hover:bg-red-50 text-muted-foreground hover:text-red-600"
                          title="Reject"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      </>
                    )}
                    {pr.status === 'approved' && (
                      <button
                        onClick={() => { setConvertPR(pr); setConvertOpen(true); }}
                        className="p-1.5 rounded hover:bg-blue-50 text-muted-foreground hover:text-blue-600"
                        title="Convert to PO"
                      >
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-xs text-muted-foreground">Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
            <Button size="sm" variant="outline" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Next</Button>
          </div>
        </div>
      )}

      {/* Create PR Modal */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New Purchase Request</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium mb-1 block">Reason *</label>
              <Input value={newReason} onChange={(e) => setNewReason(e.target.value)} placeholder="Why is this purchase needed?" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Urgency</label>
                <select value={newUrgency} onChange={(e) => setNewUrgency(e.target.value)} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Preferred Supplier</label>
                <select value={newSupplierId} onChange={(e) => setNewSupplierId(e.target.value)} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                  <option value="">Not specified</option>
                  {suppliers.map((s) => (
                    <option key={s._id} value={s._id}>{s.companyName || s.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Items *</label>
              <div className="space-y-2">
                {newItems.map((item, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-center">
                    <Input placeholder="Item name" value={item.name} onChange={(e) => updateItem(i, 'name', e.target.value)} className="col-span-5 h-8 text-sm" />
                    <Input placeholder="SKU" value={item.sku || ''} onChange={(e) => updateItem(i, 'sku', e.target.value)} className="col-span-2 h-8 text-sm" />
                    <Input type="number" placeholder="Qty" min={1} value={item.quantity} onChange={(e) => updateItem(i, 'quantity', parseInt(e.target.value) || 1)} className="col-span-2 h-8 text-sm" />
                    <Input type="number" placeholder="Unit Price" value={item.unitPrice || ''} onChange={(e) => updateItem(i, 'unitPrice', parseFloat(e.target.value) || 0)} className="col-span-2 h-8 text-sm" />
                    <button onClick={() => removeItem(i)} className="col-span-1 text-red-500 hover:text-red-700 text-xs font-bold">✕</button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addItem}>+ Add Item</Button>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Notes</label>
              <Textarea value={newNotes} onChange={(e) => setNewNotes(e.target.value)} rows={2} placeholder="Additional notes..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={creating}>{creating ? 'Submitting...' : 'Submit Request'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View PR Modal */}
      {viewPR && (
        <Dialog open={!!viewPR} onOpenChange={() => setViewPR(null)}>
          <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{viewPR.prNumber}</DialogTitle></DialogHeader>
            <div className="space-y-3 py-2 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-muted-foreground">Status:</span> <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[viewPR.status] || ''}`}>{viewPR.status}</span></div>
                <div><span className="text-muted-foreground">Urgency:</span> <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-medium ${URGENCY_COLORS[viewPR.urgency] || ''}`}>{viewPR.urgency}</span></div>
              </div>
              <div><span className="text-muted-foreground">Reason:</span> <span className="ml-1">{viewPR.reason}</span></div>
              {viewPR.requestedBy && <div><span className="text-muted-foreground">Requested by:</span> <span className="ml-1 font-medium">{viewPR.requestedBy.name}</span></div>}
              {viewPR.approvedBy && <div><span className="text-muted-foreground">Approved by:</span> <span className="ml-1 font-medium">{viewPR.approvedBy.name}</span></div>}
              {viewPR.approvalNotes && <div><span className="text-muted-foreground">Approval notes:</span> <span className="ml-1">{viewPR.approvalNotes}</span></div>}
              <div>
                <p className="text-muted-foreground font-medium mb-1">Items ({viewPR.items?.length || 0}):</p>
                <table className="w-full text-xs border rounded-lg overflow-hidden">
                  <thead><tr className="bg-muted/40"><th className="text-left px-3 py-1.5">Item</th><th className="text-right px-3 py-1.5">Qty</th><th className="text-right px-3 py-1.5">Unit Price</th></tr></thead>
                  <tbody>
                    {(viewPR.items || []).map((item, i) => (
                      <tr key={i} className="border-t border-border/30">
                        <td className="px-3 py-1.5">{item.name} {item.sku ? <span className="text-muted-foreground">({item.sku})</span> : ''}</td>
                        <td className="px-3 py-1.5 text-right">{item.quantity}</td>
                        <td className="px-3 py-1.5 text-right">{item.unitPrice ? `₹${item.unitPrice}` : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {viewPR.notes && <div><span className="text-muted-foreground">Notes:</span> <span className="ml-1">{viewPR.notes}</span></div>}
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setViewPR(null)}>Close</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Approve / Reject Modal */}
      <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{isReject ? 'Reject' : 'Approve'} Purchase Request</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <label className="text-sm font-medium mb-1 block">Notes (optional)</label>
            <Textarea value={approveNotes} onChange={(e) => setApproveNotes(e.target.value)} rows={3} placeholder={isReject ? 'Reason for rejection...' : 'Approval notes...'} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveOpen(false)}>Cancel</Button>
            <Button
              onClick={handleApprove}
              disabled={approving}
              variant={isReject ? 'destructive' : 'default'}
            >
              {approving ? 'Processing...' : (isReject ? 'Reject Request' : 'Approve Request')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Convert to PO Modal */}
      <Dialog open={convertOpen} onOpenChange={setConvertOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Generate Purchase Order</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-sm font-medium mb-1 block">Supplier *</label>
              <select value={convertSupplierId} onChange={(e) => setConvertSupplierId(e.target.value)} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                <option value="">Select supplier...</option>
                {suppliers.map((s) => (
                  <option key={s._id} value={s._id}>{s.companyName || s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Expected Delivery Date</label>
              <Input type="date" value={convertDelivery} onChange={(e) => setConvertDelivery(e.target.value)} className="h-8 text-sm" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConvertOpen(false)}>Cancel</Button>
            <Button onClick={handleConvert} disabled={converting}>{converting ? 'Creating PO...' : 'Create Purchase Order'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
