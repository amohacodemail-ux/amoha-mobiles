'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { useDebouncedValue } from '@/lib/hooks';
import toast from 'react-hot-toast';
import { Wallet, Plus } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable, Column } from '@/components/shared/data-table';
import { Pagination } from '@/components/shared/pagination';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { walletService } from '@/services/wallet.service';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import type { AdminWallet } from '@/types';

const LIMIT = 20;

export default function WalletsPage() {
  const [wallets, setWallets] = useState<AdminWallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Credit dialog
  const [creditOpen, setCreditOpen] = useState(false);
  const [creditUserId, setCreditUserId] = useState('');
  const [creditAmount, setCreditAmount] = useState('');
  const [creditDescription, setCreditDescription] = useState('');
  const [crediting, setCrediting] = useState(false);

  const debouncedSearch = useDebouncedValue(search, 350);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await walletService.getAll({ page, limit: LIMIT, search: debouncedSearch });
      setWallets(Array.isArray(res.items) ? res.items : []);
      setTotalPages(res.totalPages);
      setTotalItems(res.totalItems);
    } catch { toast.error('Failed to load wallets'); setWallets([]); }
    finally { setLoading(false); }
  }, [page, debouncedSearch]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [debouncedSearch]);

  const handleCredit = async () => {
    if (!creditUserId || !creditAmount || !creditDescription) {
      toast.error('All fields are required');
      return;
    }
    setCrediting(true);
    try {
      await walletService.credit(creditUserId, Number(creditAmount), creditDescription);
      toast.success('Wallet credited');
      setCreditOpen(false);
      setCreditUserId('');
      setCreditAmount('');
      setCreditDescription('');
      load();
    } catch { toast.error('Failed to credit wallet'); }
    finally { setCrediting(false); }
  };

  const columns: Column<AdminWallet>[] = [
    {
      key: 'user', header: 'Customer',
      render: (w) => (
        <div>
          <p className="font-medium text-foreground text-sm">{w.user.name}</p>
          <p className="text-xs text-muted-foreground">{w.user.email}</p>
        </div>
      ),
    },
    {
      key: 'balance', header: 'Balance',
      render: (w) => (
        <span className={`font-bold text-sm ${w.balance > 0 ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
          {formatCurrency(w.balance)}
        </span>
      ),
    },
    {
      key: 'transactions', header: 'Transactions',
      render: (w) => <span className="text-sm">{w.transactions?.length ?? 0}</span>,
    },
    {
      key: 'lastActivity', header: 'Last Activity',
      render: (w) => {
        const last = w.transactions?.[0];
        return last ? (
          <div>
            <span className={`text-xs font-semibold ${last.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
              {last.type === 'credit' ? '+' : '-'}{formatCurrency(last.amount)}
            </span>
            <p className="text-xs text-muted-foreground truncate max-w-[150px]">{last.description}</p>
          </div>
        ) : <span className="text-xs text-muted-foreground">—</span>;
      },
    },
    {
      key: 'createdAt', header: 'Created',
      render: (w) => <span className="text-xs text-muted-foreground">{formatDateTime(w.createdAt)}</span>,
    },
    {
      key: 'actions', header: 'Actions',
      render: (w) => (
        <Button
          variant="outline" size="icon-sm"
          onClick={() => { setCreditUserId(w.user._id); setCreditOpen(true); }}
          title="Credit wallet"
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Wallets" description={`${totalItems} user wallets`}>
        <Button onClick={() => setCreditOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Credit Wallet
        </Button>
      </PageHeader>

      <DataTable
        columns={columns} data={wallets} loading={loading}
        searchValue={search} onSearchChange={setSearch}
        searchPlaceholder="Search customer..."
        rowKey={(w) => w._id}
      />
      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} totalItems={totalItems} pageSize={LIMIT} />

      {/* Credit Dialog */}
      <Dialog open={creditOpen} onOpenChange={(open) => !open && setCreditOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Credit User Wallet</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">User ID</label>
              <Input value={creditUserId} onChange={(e) => setCreditUserId(e.target.value)} placeholder="User ID" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Amount (₹)</label>
              <Input type="number" min="1" value={creditAmount} onChange={(e) => setCreditAmount(e.target.value)} placeholder="500" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Description</label>
              <Input value={creditDescription} onChange={(e) => setCreditDescription(e.target.value)} placeholder="Promotional credit, refund, etc." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreditOpen(false)}>Cancel</Button>
            <Button onClick={handleCredit} disabled={crediting}>
              {crediting ? 'Crediting...' : 'Credit Wallet'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
