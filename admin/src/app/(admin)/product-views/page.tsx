'use client';
import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Eye, Users } from 'lucide-react';
import Image from 'next/image';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable, Column } from '@/components/shared/data-table';
import { Pagination } from '@/components/shared/pagination';
import { Button } from '@/components/ui/button';
import { productViewService, type ProductViewItem, type UserViewSummary } from '@/services/product-view.service';
import { formatDate } from '@/lib/utils';

type ViewMode = 'all' | 'users';
const LIMIT = 20;

export default function ProductViewsPage() {
  const [mode, setMode] = useState<ViewMode>('all');

  // All views state
  const [views, setViews] = useState<ProductViewItem[]>([]);
  const [viewsLoading, setViewsLoading] = useState(true);
  const [viewsSearch, setViewsSearch] = useState('');
  const [viewsPage, setViewsPage] = useState(1);
  const [viewsTotalPages, setViewsTotalPages] = useState(1);
  const [viewsTotalItems, setViewsTotalItems] = useState(0);

  // User summary state
  const [users, setUsers] = useState<UserViewSummary[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersSearch, setUsersSearch] = useState('');
  const [usersPage, setUsersPage] = useState(1);
  const [usersTotalPages, setUsersTotalPages] = useState(1);
  const [usersTotalItems, setUsersTotalItems] = useState(0);

  // Selected user detail
  const [selectedUser, setSelectedUser] = useState<UserViewSummary | null>(null);
  const [userViews, setUserViews] = useState<ProductViewItem[]>([]);
  const [userViewsLoading, setUserViewsLoading] = useState(false);

  const loadViews = useCallback(async () => {
    setViewsLoading(true);
    try {
      const res = await productViewService.getAll({ page: viewsPage, limit: LIMIT, search: viewsSearch });
      setViews(Array.isArray(res.items) ? res.items : []);
      setViewsTotalPages(res.totalPages);
      setViewsTotalItems(res.totalItems);
    } catch { toast.error('Failed to load product views'); setViews([]); }
    finally { setViewsLoading(false); }
  }, [viewsPage, viewsSearch]);

  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const res = await productViewService.getUserSummary({ page: usersPage, limit: LIMIT, search: usersSearch });
      setUsers(Array.isArray(res.items) ? res.items : []);
      setUsersTotalPages(res.totalPages);
      setUsersTotalItems(res.totalItems);
    } catch { toast.error('Failed to load user summary'); setUsers([]); }
    finally { setUsersLoading(false); }
  }, [usersPage, usersSearch]);

  useEffect(() => { if (mode === 'all') loadViews(); }, [mode, loadViews]);
  useEffect(() => { if (mode === 'users') loadUsers(); }, [mode, loadUsers]);
  useEffect(() => { setViewsPage(1); }, [viewsSearch]);
  useEffect(() => { setUsersPage(1); }, [usersSearch]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (mode === 'all') loadViews();
      else loadUsers();
    }, 30000);
    return () => clearInterval(interval);
  }, [mode, loadViews, loadUsers]);

  const handleViewUser = async (user: UserViewSummary) => {
    setSelectedUser(user);
    setUserViewsLoading(true);
    try {
      const data = await productViewService.getUserViews(user.userId);
      setUserViews(data);
    } catch { toast.error('Failed to load user views'); }
    finally { setUserViewsLoading(false); }
  };

  const viewColumns: Column<ProductViewItem>[] = [
    {
      key: 'user', header: 'Customer',
      render: (v) => (
        <div>
          <p className="font-medium text-foreground text-sm">{v.user?.name ?? '—'}</p>
          <p className="text-xs text-muted-foreground">{v.user?.email ?? ''}</p>
        </div>
      ),
    },
    {
      key: 'product', header: 'Product Viewed',
      render: (v) => (
        <div className="flex items-center gap-2">
          {v.product?.thumbnail && (
            <div className="relative h-8 w-8 overflow-hidden rounded-md border flex-shrink-0">
              <Image src={v.product.thumbnail} alt={v.product?.name ?? ''} fill className="object-cover" sizes="32px" />
            </div>
          )}
          <span className="text-sm font-medium text-foreground truncate max-w-[200px]">{v.product.name}</span>
        </div>
      ),
    },
    {
      key: 'viewedAt', header: 'Viewed At',
      render: (v) => <span className="text-xs text-muted-foreground">{formatDate(v.viewedAt)}</span>,
    },
  ];

  const userColumns: Column<UserViewSummary>[] = [
    {
      key: 'user', header: 'Customer',
      render: (u) => (
        <div>
          <p className="font-medium text-foreground text-sm">{u.user?.name ?? '—'}</p>
          <p className="text-xs text-muted-foreground">{u.user?.email ?? ''}</p>
          {u.user?.phone && <p className="text-xs text-muted-foreground">{u.user.phone}</p>}
        </div>
      ),
    },
    {
      key: 'totalViews', header: 'Total Views',
      render: (u) => <span className="font-semibold text-sm">{u.totalViews}</span>,
    },
    {
      key: 'uniqueProducts', header: 'Unique Products',
      render: (u) => <span className="text-sm">{u.uniqueProducts}</span>,
    },
    {
      key: 'lastViewedAt', header: 'Last Active',
      render: (u) => <span className="text-xs text-muted-foreground">{formatDate(u.lastViewedAt)}</span>,
    },
    {
      key: 'actions', header: 'Actions',
      render: (u) => (
        <Button variant="outline" size="sm" onClick={() => handleViewUser(u)}>
          <Eye className="h-3.5 w-3.5 mr-1" /> View
        </Button>
      ),
    },
  ];

  const userViewDetailColumns: Column<ProductViewItem>[] = [
    {
      key: 'product', header: 'Product',
      render: (v) => (
        <div className="flex items-center gap-2">
          {v.product.thumbnail && (
            <div className="relative h-8 w-8 overflow-hidden rounded-md border flex-shrink-0">
              <Image src={v.product.thumbnail} alt={v.product.name} fill className="object-cover" sizes="32px" />
            </div>
          )}
          <span className="text-sm font-medium text-foreground truncate max-w-[200px]">{v.product.name}</span>
        </div>
      ),
    },
    {
      key: 'viewedAt', header: 'Viewed At',
      render: (v) => <span className="text-xs text-muted-foreground">{formatDate(v.viewedAt)}</span>,
    },
  ];

  return (
    <div>
      <PageHeader title="User Browsing Activity" description="Track which products logged-in users are viewing">
        <div className="flex items-center gap-2">
          <Button variant={mode === 'all' ? 'default' : 'outline'} size="sm" onClick={() => { setMode('all'); setSelectedUser(null); }}>
            <Eye className="h-3.5 w-3.5 mr-1" /> All Views
          </Button>
          <Button variant={mode === 'users' ? 'default' : 'outline'} size="sm" onClick={() => { setMode('users'); setSelectedUser(null); }}>
            <Users className="h-3.5 w-3.5 mr-1" /> By User
          </Button>
        </div>
      </PageHeader>

      {/* User detail modal */}
      {selectedUser && (
        <div className="mb-6 rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-semibold text-foreground">{selectedUser.user.name}&apos;s Browsing History</h3>
              <p className="text-xs text-muted-foreground">{selectedUser.user.email} — {selectedUser.totalViews} total views, {selectedUser.uniqueProducts} unique products</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setSelectedUser(null)}>Close</Button>
          </div>
          <DataTable
            columns={userViewDetailColumns}
            data={userViews}
            loading={userViewsLoading}
            rowKey={(v) => v._id}
          />
        </div>
      )}

      {mode === 'all' && !selectedUser && (
        <>
          <DataTable
            columns={viewColumns} data={views} loading={viewsLoading}
            searchValue={viewsSearch} onSearchChange={setViewsSearch}
            searchPlaceholder="Search by customer or product name..."
            rowKey={(v) => v._id}
          />
          <Pagination currentPage={viewsPage} totalPages={viewsTotalPages} onPageChange={setViewsPage} totalItems={viewsTotalItems} pageSize={LIMIT} />
        </>
      )}

      {mode === 'users' && !selectedUser && (
        <>
          <DataTable
            columns={userColumns} data={users} loading={usersLoading}
            searchValue={usersSearch} onSearchChange={setUsersSearch}
            searchPlaceholder="Search by customer name or email..."
            rowKey={(u) => u.userId}
          />
          <Pagination currentPage={usersPage} totalPages={usersTotalPages} onPageChange={setUsersPage} totalItems={usersTotalItems} pageSize={LIMIT} />
        </>
      )}
    </div>
  );
}
