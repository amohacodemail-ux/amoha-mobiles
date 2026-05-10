'use client';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useDebouncedValue } from '@/lib/hooks';
import toast from 'react-hot-toast';
import { ShieldBan, ShieldCheck, Trash2, CheckCircle2, XCircle, UserPlus, X } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable, Column } from '@/components/shared/data-table';
import { Pagination } from '@/components/shared/pagination';
import { ConfirmModal } from '@/components/shared/confirm-modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { userService, CreateUserPayload } from '@/services/user.service';
import { formatCurrency, formatDate, getInitials } from '@/lib/utils';
import type { User } from '@/types';

const EMPTY_FORM: CreateUserPayload = { name: '', phone: '', email: '', address: '', city: '', state: '', pincode: '' };

function AddUserModal({ onClose, onCreated }: { onClose: () => void; onCreated: (u: User) => void }) {
  const [form, setForm] = useState<CreateUserPayload>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof CreateUserPayload, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => { nameRef.current?.focus(); }, []);

  const set = (k: keyof CreateUserPayload, v: string) => {
    setForm((p) => ({ ...p, [k]: v }));
    setErrors((p) => ({ ...p, [k]: undefined }));
  };

  const validate = () => {
    const e: Partial<Record<keyof CreateUserPayload, string>> = {};
    if (!form.name.trim()) e.name = 'Full name is required';
    if (!form.phone.trim()) e.phone = 'Phone number is required';
    else if (!/^\d{10}$/.test(form.phone.trim())) e.phone = 'Phone must be exactly 10 digits';
    if (form.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = 'Invalid email format';
    if (form.pincode?.trim() && !/^\d{6}$/.test(form.pincode.trim())) e.pincode = 'Pincode must be 6 digits';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const payload: CreateUserPayload = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        ...(form.email?.trim() && { email: form.email.trim() }),
        ...(form.address?.trim() && { address: form.address.trim() }),
        ...(form.city?.trim() && { city: form.city.trim() }),
        ...(form.state?.trim() && { state: form.state.trim() }),
        ...(form.pincode?.trim() && { pincode: form.pincode.trim() }),
      };
      const user = await userService.createUser(payload);
      toast.success(`User "${user.name || payload.name}" added successfully`);
      onCreated(user);
      onClose();
    } catch (err: any) {
      const msg: string = err?.response?.data?.message || err?.message || 'Failed to create user';
      if (msg.toLowerCase().includes('phone') && msg.toLowerCase().includes('exists')) {
        setErrors((p) => ({ ...p, phone: 'This phone number is already registered' }));
        toast.error('User with this phone already exists');
      } else if (msg.toLowerCase().includes('email') && msg.toLowerCase().includes('exists')) {
        setErrors((p) => ({ ...p, email: 'This email is already registered' }));
        toast.error('User with this email already exists');
      } else {
        toast.error(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = (field: keyof CreateUserPayload) =>
    `w-full rounded-md border px-3 py-2 text-sm bg-background outline-none focus:ring-2 focus:ring-primary/40 transition ${errors[field] ? 'border-destructive' : 'border-input'}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-background rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Add New User</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-foreground mb-1">Full Name<span className="text-destructive ml-0.5">*</span></label>
              <input ref={nameRef} type="text" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Ramesh Kumar" className={inputCls('name')} />
              {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-medium text-foreground mb-1">Phone Number<span className="text-destructive ml-0.5">*</span></label>
              <input type="text" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="10-digit mobile number" className={inputCls('phone')} />
              {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone}</p>}
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-medium text-foreground mb-1">Email</label>
              <input type="email" value={form.email || ''} onChange={(e) => set('email', e.target.value)} placeholder="optional" className={inputCls('email')} />
              {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Address</label>
            <input type="text" value={form.address || ''} onChange={(e) => set('address', e.target.value)} placeholder="Street / Flat No." className={inputCls('address')} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">City</label>
              <input type="text" value={form.city || ''} onChange={(e) => set('city', e.target.value)} placeholder="City" className={inputCls('city')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">State</label>
              <input type="text" value={form.state || ''} onChange={(e) => set('state', e.target.value)} placeholder="State" className={inputCls('state')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Pincode</label>
              <input type="text" value={form.pincode || ''} onChange={(e) => set('pincode', e.target.value)} placeholder="6 digits" className={inputCls('pincode')} />
              {errors.pincode && <p className="text-xs text-destructive mt-1">{errors.pincode}</p>}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Adding...' : 'Add User'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

const LIMIT = 10;

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  const debouncedSearch = useDebouncedValue(search, 350);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await userService.getAll({ page, limit: LIMIT, search: debouncedSearch });
      setUsers(Array.isArray(res.users) ? res.users : []);
      setTotalPages(res.totalPages);
      setTotalItems(res.totalUsers);
    } catch { toast.error('Failed to load users'); setUsers([]); }
    finally { setLoading(false); }
  }, [page, debouncedSearch]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [debouncedSearch]);

  const handleToggleBlock = async (user: User) => {
    try {
      await userService.toggleBlock(user._id, !user.isBlocked);
      toast.success(user.isBlocked ? 'User unblocked' : 'User blocked');
      load();
    } catch { toast.error('Action failed'); }
  };

  const handleUserCreated = (u: User) => {
    const clean: User = { ...u, email: u.email?.endsWith('@noemail.local') ? '' : (u.email ?? '') };
    setUsers((prev) => [clean, ...prev]);
    setTotalItems((n) => n + 1);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await userService.delete(deleteId);
      toast.success('User deleted');
      setDeleteId(null);
      load();
    } catch { toast.error('Delete failed'); }
    finally { setDeleting(false); }
  };

  const columns: Column<User>[] = [
    {
      key: 'name', header: 'User',
      render: (u) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
            {getInitials(u.name)}
          </div>
          <div>
            <p className="font-medium text-foreground text-sm">{u.name}</p>
            <p className="text-xs text-muted-foreground">{u.email}</p>
          </div>
        </div>
      ),
    },
    { key: 'phone', header: 'Phone', render: (u) => <span className="text-sm text-muted-foreground">{u.phone || '—'}</span> },
    {
      key: 'role', header: 'Role',
      render: (u) => <Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>{u.role}</Badge>,
    },
    {
      key: 'isVerified', header: 'Verified',
      render: (u) => <Badge variant={u.isVerified ? 'success' : 'warning'}>{u.isVerified ? 'Verified' : 'Unverified'}</Badge>,
    },
    {
      key: 'isBlocked', header: 'Status',
      render: (u) => <Badge variant={u.isBlocked ? 'destructive' : 'success'}>{u.isBlocked ? 'Blocked' : 'Active'}</Badge>,
    },
    { key: 'totalOrders', header: 'Orders', render: (u) => <span className="font-medium">{u.totalOrders ?? 0}</span> },
    { key: 'totalSpent', header: 'Total Spent', render: (u) => <span className="font-semibold">{formatCurrency(u.totalSpent ?? 0)}</span> },
    {
      key: 'kyc', header: 'KYC',
      render: (u) => {
        const status = u.kyc?.status || 'not_submitted';
        const variant = status === 'verified' ? 'success' : status === 'pending' ? 'warning' : status === 'rejected' ? 'destructive' : 'secondary';
        return (
          <div className="flex items-center gap-1.5">
            <Badge variant={variant}>{status === 'not_submitted' ? 'N/A' : status}</Badge>
            {status === 'pending' && (
              <div className="flex gap-0.5">
                <Button variant="outline" size="icon-sm" className="h-6 w-6 hover:border-green-500 hover:text-green-600" title="Verify KYC" onClick={async () => { try { await userService.verifyKyc(u._id); toast.success('KYC verified'); load(); } catch { toast.error('Failed'); } }}>
                  <CheckCircle2 className="h-3 w-3" />
                </Button>
                <Button variant="outline" size="icon-sm" className="h-6 w-6 hover:border-destructive hover:text-destructive" title="Reject KYC" onClick={async () => { const reason = prompt('Rejection reason:'); if (reason) { try { await userService.rejectKyc(u._id, reason); toast.success('KYC rejected'); load(); } catch { toast.error('Failed'); } } }}>
                  <XCircle className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        );
      },
    },
    { key: 'createdAt', header: 'Joined', render: (u) => <span className="text-xs text-muted-foreground">{formatDate(u.createdAt)}</span> },
    {
      key: 'actions', header: 'Actions',
      render: (u) => (
        <div className="flex gap-2">
          <Button
            variant="outline" size="icon-sm"
            className={u.isBlocked ? 'hover:border-green-500 hover:text-green-600 dark:hover:text-green-400' : 'hover:border-yellow-500 hover:text-yellow-600 dark:hover:text-yellow-400'}
            onClick={() => handleToggleBlock(u)}
            title={u.isBlocked ? 'Unblock user' : 'Block user'}
          >
            {u.isBlocked ? <ShieldCheck className="h-3.5 w-3.5" /> : <ShieldBan className="h-3.5 w-3.5" />}
          </Button>
          {u.role !== 'admin' && (
            <Button variant="outline" size="icon-sm" className="hover:border-destructive hover:text-destructive" onClick={() => setDeleteId(u._id)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      {showAdd && <AddUserModal onClose={() => setShowAdd(false)} onCreated={handleUserCreated} />}
      <PageHeader
        title="Users"
        description={`${totalItems} registered users`}
        action={<Button onClick={() => setShowAdd(true)}><UserPlus className="h-4 w-4 mr-2" />Add New User</Button>}
      />
      <DataTable
        columns={columns} data={users} loading={loading}
        searchValue={search} onSearchChange={setSearch}
        searchPlaceholder="Search by name or email..."
        rowKey={(u) => u._id}
      />
      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} totalItems={totalItems} pageSize={LIMIT} />
      <ConfirmModal
        open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} loading={deleting}
        title="Delete User?" description="This will permanently delete the user account and all their data."
        confirmLabel="Delete User"
      />
    </div>
  );
}
