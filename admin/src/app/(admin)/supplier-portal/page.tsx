'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { ClipboardList, Plus, Clock, CheckCircle, XCircle, ChevronLeft, ChevronRight, User, Building2, ShieldAlert } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { supplierEntryService } from '@/services/supplier-entry.service';
import apiClient from '@/lib/api-client';
import { useAuthStore } from '@/store/auth.store';
import { normalizeRole } from '@/lib/permissions';
import { formatDate } from '@/lib/utils';

const LIMIT = 15;

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700',
  converted: 'bg-green-50 text-green-700',
  rejected: 'bg-red-50 text-red-700',
};

export default function SupplierPortalPage() {
  const { user } = useAuthStore();
  const router = useRouter();

  // ALL hooks must come before any conditional return
  const [profile, setProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileForm, setProfileForm] = useState<any>({
    name: '', companyName: '', contactPerson: '', phone: '',
    addressLine1: '', addressLine2: '', city: '', state: '',
    pincode: '', country: 'India', gstNumber: '', panNumber: '',
    bankName: '', bankAccountNumber: '', bankIfsc: '', paymentTerms: 'Net 30', notes: '',
  });
  const [entries, setEntries] = useState<any[]>([]);
  const [entriesLoading, setEntriesLoading] = useState(false);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [posLoading, setPosLoading] = useState(false);
  const [grns, setGrns] = useState<any[]>([]);
  const [grnsLoading, setGrnsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'entries' | 'orders' | 'grns'>('profile');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [entryForm, setEntryForm] = useState({ itemName: '', quantity: 1, price: '', note: '' });
  const [submitting, setSubmitting] = useState(false);
  const [viewPO, setViewPO] = useState<any>(null);
  const [viewGRN, setViewGRN] = useState<any>(null);

  const [updateDeliveryOpen, setUpdateDeliveryOpen] = useState(false);
  const [updateDeliveryPO, setUpdateDeliveryPO] = useState<any>(null);
  const [deliveryForm, setDeliveryForm] = useState({
    status: '',
    trackingNumber: '',
    dispatchDate: '',
    expectedDeliveryDate: '',
    notes: ''
  });
  const [updatingDelivery, setUpdatingDelivery] = useState(false);

  // Strict RBAC check
  const normalizedRole = user ? normalizeRole(user.role as any) : null;
  const isAllowed = normalizedRole === 'supplier' || normalizedRole === 'admin';

  const loadProfile = useCallback(async () => {
    if (!isAllowed) return;
    setProfileLoading(true);
    try {
      const { data } = await apiClient.get('/suppliers/me');
      const p = data.data;
      setProfile(p);
      setProfileForm({
        name: p.name || '',
        companyName: p.companyName || '',
        contactPerson: p.contactPerson || '',
        phone: p.phone || '',
        addressLine1: p.addressLine1 || '',
        addressLine2: p.addressLine2 || '',
        city: p.city || '',
        state: p.state || '',
        pincode: p.pincode || '',
        country: p.country || 'India',
        gstNumber: p.gstNumber || '',
        panNumber: p.panNumber || '',
        bankName: p.bankName || '',
        bankAccountNumber: p.bankAccountNumber || '',
        bankIfsc: p.bankIfsc || '',
        paymentTerms: p.paymentTerms || 'Net 30',
        notes: p.notes || '',
      });
    } catch {
      toast.error('Failed to load supplier profile');
    } finally {
      setProfileLoading(false);
    }
  }, [isAllowed]);

  const loadEntries = useCallback(async () => {
    if (!isAllowed) return;
    setEntriesLoading(true);
    try {
      const data = await supplierEntryService.getMyEntries({ page, limit: LIMIT });
      setEntries(data?.entries || []);
      setTotalPages(data?.totalPages || 1);
    } catch {
      toast.error('Failed to load supplier entries');
    } finally {
      setEntriesLoading(false);
    }
  }, [page, isAllowed]);

  const loadPurchaseOrders = useCallback(async () => {
    if (!isAllowed) return;
    setPosLoading(true);
    try {
      const { data } = await apiClient.get('/suppliers/purchase-orders');
      setPurchaseOrders(data?.data?.purchaseOrders || []);
    } catch {
      toast.error('Failed to load purchase orders');
    } finally {
      setPosLoading(false);
    }
  }, [isAllowed]);

  const loadGRNs = useCallback(async () => {
    if (!isAllowed) return;
    setGrnsLoading(true);
    try {
      const { data } = await apiClient.get('/suppliers/grns');
      setGrns(data?.data || []);
    } catch {
      toast.error('Failed to load GRNs');
    } finally {
      setGrnsLoading(false);
    }
  }, [isAllowed]);

  useEffect(() => {
    if (user && !isAllowed) {
      toast.error('Access denied. This page is for suppliers only.');
      router.replace('/dashboard');
    }
  }, [user, isAllowed, router]);

  useEffect(() => { loadProfile(); }, [loadProfile]);
  useEffect(() => { 
    if (activeTab === 'entries') loadEntries(); 
    if (activeTab === 'orders') loadPurchaseOrders();
    if (activeTab === 'grns') loadGRNs();
  }, [activeTab, loadEntries, loadPurchaseOrders, loadGRNs]);

  // Conditional render AFTER all hooks
  if (!user || !isAllowed) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <ShieldAlert className="h-12 w-12 text-red-400 mb-4" />
        <h2 className="text-xl font-bold text-foreground">Access Denied</h2>
        <p className="text-sm text-muted-foreground mt-2">This page is for supplier accounts only.</p>
      </div>
    );
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await apiClient.put('/suppliers/me', profileForm);
      setProfile(data.data);
      toast.success('Profile updated successfully');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entryForm.itemName.trim()) return toast.error('Item name is required');
    if (!entryForm.quantity || Number(entryForm.quantity) < 1) return toast.error('Quantity must be at least 1');
    setSubmitting(true);
    try {
      await supplierEntryService.createEntry({
        itemName: entryForm.itemName,
        quantity: Number(entryForm.quantity),
        price: entryForm.price ? Number(entryForm.price) : undefined,
        note: entryForm.note,
      });
      toast.success('Entry submitted! Admin will review it.');
      setEntryForm({ itemName: '', quantity: 1, price: '', note: '' });
      setSubmitOpen(false);
      loadEntries();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to submit entry');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcceptPO = async (poId: string) => {
    if (!confirm('Accept this Purchase Order?')) return;
    try {
      await apiClient.post(`/suppliers/purchase-orders/${poId}/accept`);
      toast.success('Purchase Order accepted successfully');
      loadPurchaseOrders();
    } catch {
      toast.error('Failed to accept Purchase Order');
    }
  };

  const handleRejectPO = async (poId: string) => {
    const reason = prompt('Enter rejection reason:');
    if (reason === null) return;
    try {
      await apiClient.post(`/suppliers/purchase-orders/${poId}/reject`, { rejectReason: reason });
      toast.success('Purchase Order rejected');
      loadPurchaseOrders();
    } catch {
      toast.error('Failed to reject Purchase Order');
    }
  };

  const openUpdateDeliveryModal = (po: any) => {
    setUpdateDeliveryPO(po);
    setDeliveryForm({
      status: '', // Force user to select a valid delivery status
      trackingNumber: po.tracking_number || '',
      dispatchDate: po.dispatch_date ? new Date(po.dispatch_date).toISOString().split('T')[0] : '',
      expectedDeliveryDate: '',
      notes: ''
    });
    setUpdateDeliveryOpen(true);
  };

  const submitDeliveryUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updateDeliveryPO) return;
    
    const { status, trackingNumber, dispatchDate, expectedDeliveryDate, notes } = deliveryForm;
    if (!status) return toast.error('Delivery status is required');
    if (['dispatched', 'in_transit'].includes(status)) {
      if (!trackingNumber) return toast.error('Tracking Number is required for dispatched/in-transit orders');
      if (!dispatchDate) return toast.error('Dispatch Date is required for dispatched/in-transit orders');
    }
    
    setUpdatingDelivery(true);
    try {
      await apiClient.put(`/suppliers/purchase-orders/${updateDeliveryPO._id || updateDeliveryPO.id}/delivery`, { 
        status, trackingNumber, dispatchDate, expectedDeliveryDate, notes 
      });
      toast.success('Delivery status updated');
      setUpdateDeliveryOpen(false);
      loadPurchaseOrders();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update delivery status');
    } finally {
      setUpdatingDelivery(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Supplier Portal"
        description="Manage your profile and submit product entries for admin review"
      />

      {/* Welcome banner */}
      <div className="flex items-center gap-3 rounded-xl bg-primary/5 border border-primary/20 px-5 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <User className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="font-semibold text-foreground">{profile?.companyName || profile?.name || user?.name || 'Supplier'}</p>
          <p className="text-sm text-muted-foreground">{user?.email} · Supplier Account</p>
        </div>
      </div>

      <div className="flex gap-2">
        {(['profile', 'entries', 'orders', 'grns'] as const).map((tab) => (
          <Button key={tab} variant={activeTab === tab ? 'default' : 'outline'} onClick={() => setActiveTab(tab)} className="capitalize">
            {tab === 'grns' ? 'GRN / Delivery Status' : tab}
          </Button>
        ))}
      </div>

      {activeTab === 'profile' && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-4 max-w-2xl">
          <div className="flex items-center gap-2 pb-2 border-b border-border">
            <Building2 className="h-4 w-4 text-primary" />
            <h2 className="font-semibold text-foreground">Supplier Details</h2>
          </div>

          {profileLoading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">Loading profile...</div>
          ) : (
            <form onSubmit={handleSaveProfile} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Login Email</label>
                <Input value={user?.email || ''} disabled className="mt-1 opacity-60" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Company Name</label>
                  <Input value={profileForm.companyName} onChange={e => setProfileForm({ ...profileForm, companyName: e.target.value })} placeholder="Business name" className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Contact Person</label>
                  <Input value={profileForm.name} onChange={e => setProfileForm({ ...profileForm, name: e.target.value })} placeholder="Your name" className="mt-1" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Phone</label>
                  <Input value={profileForm.phone} onChange={e => setProfileForm({ ...profileForm, phone: e.target.value.replace(/\D/g, '') })} placeholder="10-digit number" maxLength={15} className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Country</label>
                  <Input value={profileForm.country} onChange={e => setProfileForm({ ...profileForm, country: e.target.value })} className="mt-1" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Address Line 1</label>
                <Input value={profileForm.addressLine1} onChange={e => setProfileForm({ ...profileForm, addressLine1: e.target.value })} placeholder="Street address" className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Address Line 2</label>
                <Input value={profileForm.addressLine2} onChange={e => setProfileForm({ ...profileForm, addressLine2: e.target.value })} placeholder="Area, landmark" className="mt-1" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Input value={profileForm.city} onChange={e => setProfileForm({ ...profileForm, city: e.target.value })} placeholder="City" />
                <Input value={profileForm.state} onChange={e => setProfileForm({ ...profileForm, state: e.target.value })} placeholder="State" />
                <Input value={profileForm.pincode} onChange={e => setProfileForm({ ...profileForm, pincode: e.target.value })} placeholder="Pincode" maxLength={6} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input value={profileForm.gstNumber} onChange={e => setProfileForm({ ...profileForm, gstNumber: e.target.value })} placeholder="GST Number" />
                <Input value={profileForm.panNumber} onChange={e => setProfileForm({ ...profileForm, panNumber: e.target.value })} placeholder="PAN Number" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input value={profileForm.bankName} onChange={e => setProfileForm({ ...profileForm, bankName: e.target.value })} placeholder="Bank Name" />
                <Input value={profileForm.bankIfsc} onChange={e => setProfileForm({ ...profileForm, bankIfsc: e.target.value })} placeholder="IFSC Code" />
              </div>
              <Input value={profileForm.bankAccountNumber} onChange={e => setProfileForm({ ...profileForm, bankAccountNumber: e.target.value })} placeholder="Bank Account Number" />
              <textarea
                value={profileForm.notes}
                onChange={e => setProfileForm({ ...profileForm, notes: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background resize-none"
                rows={2}
                placeholder="Additional notes"
              />
              <Button type="submit" disabled={saving} className="w-full">
                {saving ? 'Saving...' : 'Save Details'}
              </Button>
            </form>
          )}
        </div>
      )}

      {activeTab === 'grns' && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-primary" />
              <h2 className="font-semibold text-foreground">GRN / Delivery Status</h2>
            </div>
          </div>

          {grnsLoading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">Loading GRNs...</div>
          ) : grns.length === 0 ? (
            <div className="py-12 text-center bg-muted/30 rounded-lg border border-dashed">
              <ClipboardList className="h-8 w-8 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-sm font-medium">No GRNs found</p>
              <p className="text-xs text-muted-foreground mt-1">You have no delivery records yet.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">GRN Number</th>
                    <th className="px-4 py-3 font-medium">PO Number</th>
                    <th className="px-4 py-3 font-medium">Received Date</th>
                    <th className="px-4 py-3 font-medium text-right">Ordered</th>
                    <th className="px-4 py-3 font-medium text-right">Received</th>
                    <th className="px-4 py-3 font-medium text-right">Accepted</th>
                    <th className="px-4 py-3 font-medium text-right">Rejected</th>
                    <th className="px-4 py-3 font-medium text-center">Status</th>
                    <th className="px-4 py-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {grns.map((g) => (
                    <tr key={g.id || g._id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium text-primary cursor-pointer hover:underline" onClick={() => setViewGRN(g)}>{g.grnNumber || g.grn_number}</td>
                      <td className="px-4 py-3">{g.purchaseOrder?.po_number || g.poId}</td>
                      <td className="px-4 py-3">{formatDate(g.receivedDate || g.createdAt)}</td>
                      <td className="px-4 py-3 text-right">{g.totalOrdered || 0}</td>
                      <td className="px-4 py-3 text-right">{g.totalReceived || 0}</td>
                      <td className="px-4 py-3 text-right font-medium text-green-600">{g.totalAccepted || 0}</td>
                      <td className="px-4 py-3 text-right text-red-500">{g.totalRejected || 0}</td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant="outline" className={statusColors[g.status] || 'bg-secondary text-secondary-foreground'}>{g.status}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="outline" size="sm" onClick={() => setViewGRN(g)}>View Details</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold text-lg">Purchase Orders</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">PO Number</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Products / Items</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Payment</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {posLoading ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Loading orders...</td></tr>
                ) : purchaseOrders.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No purchase orders found</td></tr>
                ) : (
                  purchaseOrders.map((po) => (
                    <tr key={po._id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium text-foreground">
                        <button className="text-primary hover:underline font-semibold" onClick={() => setViewPO(po)}>
                          {po.poNumber}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(po.orderDate)}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {po.items?.length ? `${po.items.length} Items` : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={po.status === 'sent' ? 'bg-cyan-50 text-cyan-700' : po.status === 'confirmed' ? 'bg-green-50 text-green-700' : ''}>
                          {po.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {po.paymentStatus === 'paid' ? (
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none text-[10px]">Paid</Badge>
                        ) : po.paymentStatus === 'partial' ? (
                          <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-none text-[10px]">Partial</Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-none text-[10px]">Unpaid</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium">₹{Number(po.totalAmount).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <Button size="sm" variant="outline" onClick={() => setViewPO(po)}>View Details</Button>
                        {po.status === 'sent' && (
                          <>
                            <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleAcceptPO(po._id)}>Accept</Button>
                            <Button size="sm" variant="destructive" onClick={() => handleRejectPO(po._id)}>Reject</Button>
                          </>
                        )}
                        {['accepted', 'preparing', 'dispatched', 'in_transit'].includes(po.status) && (
                          <div className="inline-block" title={po.paymentStatus !== 'paid' ? 'Awaiting Advance Payment' : 'Update Delivery Status'}>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              disabled={po.paymentStatus !== 'paid'}
                              onClick={() => openUpdateDeliveryModal(po)}
                            >
                              Update Delivery
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'entries' && (
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-primary" />
                <h2 className="font-semibold text-foreground">Submit New Entry</h2>
              </div>
              <Button size="sm" onClick={() => setSubmitOpen(true)}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Submit Entry
              </Button>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Submit a product entry for admin review. Once approved, it will be added to inventory.
            </p>
          </div>

          {/* My Entries List */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-3">
            <h2 className="font-semibold text-foreground">My Submitted Entries</h2>

            {entriesLoading ? (
              <div className="py-6 text-center text-sm text-muted-foreground">Loading entries...</div>
            ) : entries.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">No entries submitted yet.</div>
            ) : (
              <div className="space-y-2">
                {entries.map((entry) => (
                  <div key={entry._id || entry.id} className="rounded-lg border border-border p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-sm text-foreground">{entry.itemName}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Qty: {entry.quantity}
                          {entry.price ? ` · ₹${Number(entry.price).toLocaleString()}` : ''}
                          {' · '}{formatDate(entry.createdAt)}
                        </p>
                        {entry.rejectionReason && (
                          <p className="text-xs text-red-600 mt-1">Reason: {entry.rejectionReason}</p>
                        )}
                        {entry.note && (
                          <p className="text-xs text-muted-foreground mt-1 italic">{entry.note}</p>
                        )}
                      </div>
                      <Badge variant="outline" className={statusColors[entry.status] || ''}>
                        {entry.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                        {entry.status === 'converted' && <CheckCircle className="h-3 w-3 mr-1" />}
                        {entry.status === 'rejected' && <XCircle className="h-3 w-3 mr-1" />}
                        {entry.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-2">
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
        </div>
      )}

      {/* Submit Entry Dialog */}
      <Dialog open={submitOpen} onOpenChange={setSubmitOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Submit New Entry</DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">Admin will review and convert this to a product.</p>
          </DialogHeader>
          <form onSubmit={handleSubmitEntry}>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium">Item Name *</label>
                <Input
                  value={entryForm.itemName}
                  onChange={e => setEntryForm({ ...entryForm, itemName: e.target.value })}
                  placeholder="Product / item name"
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Quantity *</label>
                  <Input
                    type="number"
                    min={1}
                    value={entryForm.quantity}
                    onChange={e => setEntryForm({ ...entryForm, quantity: Number(e.target.value) })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Unit Price (₹)</label>
                  <Input
                    type="number"
                    min={0}
                    value={entryForm.price}
                    onChange={e => setEntryForm({ ...entryForm, price: e.target.value })}
                    placeholder="0"
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Note</label>
                <textarea
                  value={entryForm.note}
                  onChange={e => setEntryForm({ ...entryForm, note: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-background resize-none"
                  rows={3}
                  placeholder="Any additional information..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setSubmitOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit Entry'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Update Delivery Modal */}
      <Dialog open={updateDeliveryOpen} onOpenChange={setUpdateDeliveryOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update Delivery Status</DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">Provide delivery updates for {updateDeliveryPO?.poNumber}</p>
          </DialogHeader>
          <form onSubmit={submitDeliveryUpdate}>
            <div className="space-y-4 py-4">
              <div className="bg-muted/50 p-3 rounded-lg flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Current Status:</span>
                <Badge variant="outline" className="capitalize">{updateDeliveryPO?.status || 'Unknown'}</Badge>
              </div>
              
              <div>
                <label className="text-sm font-medium">New Delivery Status *</label>
                <select 
                  className="w-full mt-1 flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={deliveryForm.status}
                  onChange={e => setDeliveryForm({ ...deliveryForm, status: e.target.value })}
                  required
                >
                  <option value="" disabled>Select status</option>
                  <option value="preparing">Preparing</option>
                  <option value="dispatched">Dispatched</option>
                  <option value="in_transit">In Transit</option>
                  <option value="delivered">Delivered</option>
                </select>
              </div>

              {['dispatched', 'in_transit', 'delivered'].includes(deliveryForm.status) && (
                <>
                  <div>
                    <label className="text-sm font-medium">Tracking Number *</label>
                    <Input
                      value={deliveryForm.trackingNumber}
                      onChange={e => setDeliveryForm({ ...deliveryForm, trackingNumber: e.target.value })}
                      placeholder="e.g., AWB123456789"
                      className="mt-1"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Dispatch Date *</label>
                    <Input
                      type="date"
                      value={deliveryForm.dispatchDate}
                      onChange={e => setDeliveryForm({ ...deliveryForm, dispatchDate: e.target.value })}
                      className="mt-1"
                      required
                    />
                  </div>
                </>
              )}

              <div>
                <label className="text-sm font-medium">Expected Delivery Date (Optional)</label>
                <Input
                  type="date"
                  value={deliveryForm.expectedDeliveryDate}
                  onChange={e => setDeliveryForm({ ...deliveryForm, expectedDeliveryDate: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Notes (Optional)</label>
                <textarea
                  value={deliveryForm.notes}
                  onChange={e => setDeliveryForm({ ...deliveryForm, notes: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-background resize-none"
                  rows={2}
                  placeholder="Additional delivery instructions or notes..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setUpdateDeliveryOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={updatingDelivery}>{updatingDelivery ? 'Updating...' : 'Update Delivery'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* GRN View Modal */}
      <Dialog open={!!viewGRN} onOpenChange={(open) => !open && setViewGRN(null)}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>GRN / Delivery Status Details</DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">Review the delivery items for {viewGRN?.grnNumber || viewGRN?.grn_number}.</p>
          </DialogHeader>
          {viewGRN && (
            <div className="space-y-6 py-2">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-muted/30 p-4 rounded-xl border border-border">
                <div>
                  <p className="text-xs text-muted-foreground">GRN Number</p>
                  <p className="font-semibold text-sm mt-1">{viewGRN.grnNumber || viewGRN.grn_number}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">PO Number</p>
                  <p className="font-semibold text-sm mt-1">{viewGRN.purchaseOrder?.po_number || viewGRN.poId}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Received Date</p>
                  <p className="font-semibold text-sm mt-1">{formatDate(viewGRN.receivedDate || viewGRN.createdAt)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge variant="outline" className={`mt-1 ${statusColors[viewGRN.status] || 'bg-secondary text-secondary-foreground'}`}>{viewGRN.status}</Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Supplier Name</p>
                  <p className="font-semibold text-sm mt-1">{viewGRN.supplier?.name || profile?.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Warehouse / Location</p>
                  <p className="font-semibold text-sm mt-1">{viewGRN.warehouseLocation || 'N/A'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground">Invoice / Delivery Note</p>
                  <p className="font-semibold text-sm mt-1">{viewGRN.invoiceChallanNumber || 'N/A'}</p>
                </div>
              </div>

              <div className="rounded-xl border border-border overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-medium">Product / SKU</th>
                      <th className="px-4 py-3 font-medium text-right">Ordered</th>
                      <th className="px-4 py-3 font-medium text-right">Prev. Received</th>
                      <th className="px-4 py-3 font-medium text-right text-blue-600">Received Now</th>
                      <th className="px-4 py-3 font-medium text-right">Total Received</th>
                      <th className="px-4 py-3 font-medium text-right text-green-600">Accepted</th>
                      <th className="px-4 py-3 font-medium text-right text-red-500">Rejected</th>
                      <th className="px-4 py-3 font-medium">Rejection Reason</th>
                      <th className="px-4 py-3 font-medium text-right">Pending</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {viewGRN.items?.length > 0 ? (
                      viewGRN.items.map((item: any) => (
                        <tr key={item.id || item._id} className="hover:bg-muted/30">
                          <td className="px-4 py-3">
                            <p className="font-medium">{item.products?.name || item.product?.name || item.productName || 'Unknown Product'}</p>
                            {(item.products?.sku || item.product?.sku) && <p className="text-xs text-muted-foreground">SKU: {item.products?.sku || item.product?.sku}</p>}
                          </td>
                          <td className="px-4 py-3 text-right">{item.orderedQty || 0}</td>
                          <td className="px-4 py-3 text-right">{item.previouslyReceivedQty || 0}</td>
                          <td className="px-4 py-3 text-right font-medium text-blue-600">{item.receivedThisTime || 0}</td>
                          <td className="px-4 py-3 text-right">{item.totalReceivedQty || 0}</td>
                          <td className="px-4 py-3 text-right font-medium text-green-600">{item.acceptedQty || 0}</td>
                          <td className="px-4 py-3 text-right text-red-500">{item.rejectedQty || 0}</td>
                          <td className="px-4 py-3">{item.rejectionReason || '-'}</td>
                          <td className="px-4 py-3 text-right">{item.pendingQty || 0}</td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">No items in this GRN</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              {viewGRN.notes && (
                <div className="bg-muted/30 p-4 rounded-xl border border-border">
                  <p className="text-xs text-muted-foreground mb-1">Notes / Remarks</p>
                  <p className="text-sm whitespace-pre-wrap">{viewGRN.notes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewGRN(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PO View Modal */}
      <Dialog open={!!viewPO} onOpenChange={(open) => !open && setViewPO(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Purchase Order Details</DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">Review the items requested in {viewPO?.poNumber}.</p>
          </DialogHeader>
          {viewPO && (
            <div className="space-y-6 py-2">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-muted/30 p-4 rounded-xl border border-border">
                <div>
                  <p className="text-xs text-muted-foreground">PO Number</p>
                  <p className="font-semibold text-sm mt-1">{viewPO.poNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Date</p>
                  <p className="font-semibold text-sm mt-1">{formatDate(viewPO.orderDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge variant="outline" className="mt-1">{viewPO.status}</Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Amount</p>
                  <p className="font-semibold text-sm mt-1">₹{Number(viewPO.totalAmount).toLocaleString()}</p>
                </div>
              </div>

              <div className="rounded-xl border border-border overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2 font-medium">Product / SKU</th>
                      <th className="px-4 py-2 font-medium text-right">Quantity</th>
                      <th className="px-4 py-2 font-medium text-right">Unit Price</th>
                      <th className="px-4 py-2 font-medium text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {viewPO.items?.length > 0 ? (
                      viewPO.items.map((item: any) => (
                        <tr key={item.id || item._id} className="hover:bg-muted/30">
                          <td className="px-4 py-3">
                            <p className="font-medium">{item.products?.name || item.product?.name || item.productName || 'Custom Product'}</p>
                            {(item.products?.sku || item.product?.sku) && <p className="text-xs text-muted-foreground">SKU: {item.products?.sku || item.product?.sku}</p>}
                          </td>
                          <td className="px-4 py-3 text-right">{item.quantity}</td>
                          <td className="px-4 py-3 text-right">₹{Number(item.unitCost).toLocaleString()}</td>
                          <td className="px-4 py-3 text-right font-medium">₹{Number(item.totalCost).toLocaleString()}</td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">No items in this PO</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              {viewPO.notes && (
                <div className="bg-muted/30 p-4 rounded-xl border border-border">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Notes / Instructions</p>
                  <p className="text-sm">{viewPO.notes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewPO(null)}>Close</Button>
            {viewPO?.status === 'sent' && (
              <>
                <Button className="bg-green-600 hover:bg-green-700" onClick={() => {
                  handleAcceptPO(viewPO._id);
                  setViewPO(null);
                }}>Accept Order</Button>
                <Button variant="destructive" onClick={() => {
                  handleRejectPO(viewPO._id);
                  setViewPO(null);
                }}>Reject Order</Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
