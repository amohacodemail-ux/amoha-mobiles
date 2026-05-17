'use client';
import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { ClipboardList, Plus, Clock, CheckCircle, XCircle, ChevronLeft, ChevronRight, User, Building2 } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { supplierEntryService } from '@/services/supplier-entry.service';
import apiClient from '@/lib/api-client';
import { useAuthStore } from '@/store/auth.store';
import { formatDate } from '@/lib/utils';

const LIMIT = 15;

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700',
  converted: 'bg-green-50 text-green-700',
  rejected: 'bg-red-50 text-red-700',
};

export default function SupplierPortalPage() {
  const { user } = useAuthStore();

  // Profile state
  const [profile, setProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileForm, setProfileForm] = useState<any>({
    name: '', companyName: '', contactPerson: '', phone: '',
    addressLine1: '', addressLine2: '', city: '', state: '',
    pincode: '', country: 'India', gstNumber: '', panNumber: '',
    bankName: '', bankAccountNumber: '', bankIfsc: '', paymentTerms: 'Net 30', notes: '',
  });

  // Entries state
  const [entries, setEntries] = useState<any[]>([]);
  const [entriesLoading, setEntriesLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Submit entry dialog
  const [submitOpen, setSubmitOpen] = useState(false);
  const [entryForm, setEntryForm] = useState({ itemName: '', quantity: 1, price: '', note: '' });
  const [submitting, setSubmitting] = useState(false);

  // Load supplier profile
  const loadProfile = async () => {
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
  };

  // Load my entries
  const loadEntries = useCallback(async () => {
    setEntriesLoading(true);
    try {
      const result = await supplierEntryService.getMyEntries({ page, limit: LIMIT });
      setEntries(result.entries || []);
      setTotalPages(result.totalPages || 1);
    } catch {
      toast.error('Failed to load entries');
    } finally {
      setEntriesLoading(false);
    }
  }, [page]);

  useEffect(() => { loadProfile(); }, []);
  useEffect(() => { loadEntries(); }, [loadEntries]);

  // Save profile
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

  // Submit entry
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

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Profile Form */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
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

        {/* Entries Panel */}
        <div className="space-y-4">
          {/* Submit New Entry */}
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
      </div>

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
    </div>
  );
}
