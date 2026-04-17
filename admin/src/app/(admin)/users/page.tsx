'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { useDebouncedValue } from '@/lib/hooks';
import toast from 'react-hot-toast';
import { ShieldBan, ShieldCheck, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable, Column } from '@/components/shared/data-table';
import { Pagination } from '@/components/shared/pagination';
import { ConfirmModal } from '@/components/shared/confirm-modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { userService } from '@/services/user.service';
import { formatCurrency, formatDate, getInitials } from '@/lib/utils';
import type { User } from '@/types';

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
      <PageHeader title="Users" description={`${totalItems} registered users`} />
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
