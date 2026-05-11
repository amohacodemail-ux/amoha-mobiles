'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { HiOutlineLogout, HiOutlineOfficeBuilding, HiOutlineClipboardList } from 'react-icons/hi';
import { useAuthStore } from '@/store/auth.store';
import { supplierPortalService } from '@/services/supplier-portal.service';

const emptyProfile = {
  name: '',
  companyName: '',
  contactPerson: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  pincode: '',
  country: 'India',
  gstNumber: '',
  panNumber: '',
  bankName: '',
  bankAccountNumber: '',
  bankIfsc: '',
  paymentTerms: 'Net 30',
  notes: '',
};

const emptyEntry = {
  itemName: '',
  quantity: 1,
  price: '',
  note: '',
};

export default function SupplierProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [profile, setProfile] = useState<any>(emptyProfile);
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [entryForm, setEntryForm] = useState<any>(emptyEntry);
  const [submittingEntry, setSubmittingEntry] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [profileData, entryData] = await Promise.all([
        supplierPortalService.getMyProfile(),
        supplierPortalService.getMyEntries(),
      ]);
      setProfile({ ...emptyProfile, ...profileData });
      setEntries(entryData.entries || []);
    } catch {
      toast.error('Failed to load supplier information');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user?.role === 'supplier') {
      loadData();
    }
  }, [isAuthenticated, user?.role]);

  if (!isAuthenticated) {
    return (
      <div className="page-container flex flex-col items-center justify-center py-32 text-center">
        <h2 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">Supplier login required</h2>
        <p className="mt-2 text-sm text-gray-500">Please sign in with the supplier ID given by admin.</p>
        <Link href="/supplier/login" className="mt-6 rounded-xl bg-primary-600 px-8 py-3 text-sm font-semibold text-white hover:bg-primary-500">
          Open Supplier Login
        </Link>
      </div>
    );
  }

  if (user?.role !== 'supplier') {
    return (
      <div className="page-container flex flex-col items-center justify-center py-32 text-center">
        <h2 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">Supplier access only</h2>
        <p className="mt-2 text-sm text-gray-500">This area is reserved for supplier accounts.</p>
        <Link href="/profile" className="mt-6 rounded-xl bg-primary-600 px-8 py-3 text-sm font-semibold text-white hover:bg-primary-500">
          Go to My Profile
        </Link>
      </div>
    );
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await supplierPortalService.updateMyProfile(profile);
      setProfile({ ...emptyProfile, ...updated });
      toast.success('Supplier details updated');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update details');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entryForm.itemName || !entryForm.quantity) {
      toast.error('Item name and quantity are required');
      return;
    }
    setSubmittingEntry(true);
    try {
      await supplierPortalService.createEntry({
        itemName: entryForm.itemName,
        quantity: Number(entryForm.quantity),
        price: entryForm.price ? Number(entryForm.price) : undefined,
        note: entryForm.note,
      });
      toast.success('Entry submitted successfully');
      setEntryForm(emptyEntry);
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to submit entry');
    } finally {
      setSubmittingEntry(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/supplier/login');
  };

  return (
    <div className="page-container py-6 sm:py-10">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">Supplier Portal</h1>
          <p className="mt-1 text-sm text-gray-500">Complete your details and submit your supplier entries here.</p>
        </div>
        <button
          onClick={handleLogout}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/20"
        >
          <HiOutlineLogout className="h-4 w-4" />
          Sign Out
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={handleSave} className="glass-card p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2">
            <HiOutlineOfficeBuilding className="h-5 w-5 text-primary-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Complete Supplier Details</h2>
          </div>

          {loading ? <p className="text-sm text-gray-500">Loading profile...</p> : (
            <>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-500">Login ID</label>
                <input value={profile.loginEmail || user.email || ''} disabled className="glass-input py-3 text-sm opacity-80" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-500">Company / Business Name</label>
                <input value={profile.companyName || ''} onChange={(e) => setProfile({ ...profile, companyName: e.target.value })} className="glass-input py-3 text-sm" placeholder="Your business name" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-500">Contact Person</label>
                  <input value={profile.name || ''} onChange={(e) => setProfile({ ...profile, name: e.target.value })} className="glass-input py-3 text-sm" placeholder="Primary contact name" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-500">Alternate Contact</label>
                  <input value={profile.contactPerson || ''} onChange={(e) => setProfile({ ...profile, contactPerson: e.target.value })} className="glass-input py-3 text-sm" placeholder="Secondary contact (optional)" />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-500">Phone</label>
                  <input value={profile.phone || ''} onChange={(e) => setProfile({ ...profile, phone: e.target.value.replace(/\D/g, '') })} className="glass-input py-3 text-sm" placeholder="10-digit mobile number" maxLength={15} />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-500">Country</label>
                  <input value={profile.country || 'India'} onChange={(e) => setProfile({ ...profile, country: e.target.value })} className="glass-input py-3 text-sm" />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-500">Address Line 1</label>
                <input value={profile.addressLine1 || ''} onChange={(e) => setProfile({ ...profile, addressLine1: e.target.value })} className="glass-input py-3 text-sm" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-500">Address Line 2</label>
                <input value={profile.addressLine2 || ''} onChange={(e) => setProfile({ ...profile, addressLine2: e.target.value })} className="glass-input py-3 text-sm" />
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <input value={profile.city || ''} onChange={(e) => setProfile({ ...profile, city: e.target.value })} className="glass-input py-3 text-sm" placeholder="City" />
                <input value={profile.state || ''} onChange={(e) => setProfile({ ...profile, state: e.target.value })} className="glass-input py-3 text-sm" placeholder="State" />
                <input value={profile.pincode || ''} onChange={(e) => setProfile({ ...profile, pincode: e.target.value })} className="glass-input py-3 text-sm" placeholder="Pincode" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <input value={profile.gstNumber || ''} onChange={(e) => setProfile({ ...profile, gstNumber: e.target.value })} className="glass-input py-3 text-sm" placeholder="GST Number" />
                <input value={profile.panNumber || ''} onChange={(e) => setProfile({ ...profile, panNumber: e.target.value })} className="glass-input py-3 text-sm" placeholder="PAN Number" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <input value={profile.bankName || ''} onChange={(e) => setProfile({ ...profile, bankName: e.target.value })} className="glass-input py-3 text-sm" placeholder="Bank Name" />
                <input value={profile.bankIfsc || ''} onChange={(e) => setProfile({ ...profile, bankIfsc: e.target.value })} className="glass-input py-3 text-sm" placeholder="IFSC" />
              </div>
              <div>
                <input value={profile.bankAccountNumber || ''} onChange={(e) => setProfile({ ...profile, bankAccountNumber: e.target.value })} className="glass-input py-3 text-sm" placeholder="Bank Account Number" />
              </div>
              <div>
                <textarea value={profile.notes || ''} onChange={(e) => setProfile({ ...profile, notes: e.target.value })} className="glass-input min-h-[100px] py-3 text-sm" placeholder="Notes" />
              </div>
              <button type="submit" disabled={saving} className="rounded-xl bg-primary-600 px-5 py-3 text-sm font-semibold text-white hover:bg-primary-500 disabled:opacity-60">
                {saving ? 'Saving...' : 'Save Supplier Details'}
              </button>
            </>
          )}
        </form>

        <div className="space-y-6">
          <form onSubmit={handleSubmitEntry} className="glass-card p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2">
              <HiOutlineClipboardList className="h-5 w-5 text-primary-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Submit New Entry</h2>
            </div>
            <input value={entryForm.itemName} onChange={(e) => setEntryForm({ ...entryForm, itemName: e.target.value })} className="glass-input py-3 text-sm" placeholder="Item name" />
            <div className="grid gap-3 sm:grid-cols-2">
              <input type="number" min={1} value={entryForm.quantity} onChange={(e) => setEntryForm({ ...entryForm, quantity: e.target.value })} className="glass-input py-3 text-sm" placeholder="Quantity" />
              <input type="number" min={0} value={entryForm.price} onChange={(e) => setEntryForm({ ...entryForm, price: e.target.value })} className="glass-input py-3 text-sm" placeholder="Price" />
            </div>
            <textarea value={entryForm.note} onChange={(e) => setEntryForm({ ...entryForm, note: e.target.value })} className="glass-input min-h-[100px] py-3 text-sm" placeholder="Note" />
            <button type="submit" disabled={submittingEntry} className="rounded-xl bg-primary-600 px-5 py-3 text-sm font-semibold text-white hover:bg-primary-500 disabled:opacity-60">
              {submittingEntry ? 'Submitting...' : 'Submit Entry'}
            </button>
          </form>

          <div className="glass-card p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">My Recent Entries</h2>
            <div className="mt-4 space-y-3">
              {entries.length === 0 ? (
                <p className="text-sm text-gray-500">No entries submitted yet.</p>
              ) : entries.map((entry) => (
                <div key={entry._id || entry.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{entry.itemName}</p>
                      <p className="text-xs text-gray-500">Qty: {entry.quantity} • Price: ₹{entry.price || 0}</p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${entry.status === 'pending' ? 'bg-yellow-500/15 text-yellow-400' : entry.status === 'converted' ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
                      {entry.status}
                    </span>
                  </div>
                  {entry.note ? <p className="mt-2 text-sm text-gray-500">{entry.note}</p> : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
