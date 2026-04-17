'use client';
import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Download, ShoppingCart, ChevronDown, ChevronUp } from 'lucide-react';
import Image from 'next/image';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable, Column } from '@/components/shared/data-table';
import { Pagination } from '@/components/shared/pagination';
import { Button } from '@/components/ui/button';
import { cartAbandonmentService, type AbandonedCart } from '@/services/cart-abandonment.service';
import { formatCurrency, formatDate } from '@/lib/utils';

const LIMIT = 20;

export default function AbandonedCartsPage() {
  const [carts, setCarts] = useState<AbandonedCart[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const [expandedCart, setExpandedCart] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await cartAbandonmentService.getAll({ page, limit: LIMIT, search });
      setCarts(Array.isArray(res.items) ? res.items : []);
      setTotalPages(res.totalPages);
      setTotalItems(res.totalItems);
    } catch { toast.error('Failed to load abandoned carts'); setCarts([]); }
    finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => { load(); }, 30000);
    return () => clearInterval(interval);
  }, [load]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await cartAbandonmentService.downloadCSV();
      toast.success('CSV downloaded successfully');
    } catch { toast.error('Failed to download CSV'); }
    finally { setDownloading(false); }
  };

  const columns: Column<AbandonedCart>[] = [
    {
      key: 'user', header: 'Customer',
      render: (c) => (
        <div>
          <p className="font-medium text-foreground text-sm">{c.user.name}</p>
          <p className="text-xs text-muted-foreground">{c.user.email}</p>
          {c.user.phone && <p className="text-xs text-muted-foreground">{c.user.phone}</p>}
        </div>
      ),
    },
    {
      key: 'itemCount', header: 'Items',
      render: (c) => (
        <span className="inline-flex items-center rounded-full bg-orange-100 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 px-2 py-0.5 text-xs font-semibold text-orange-700 dark:text-orange-400">
          {c.itemCount} item{c.itemCount > 1 ? 's' : ''}
        </span>
      ),
    },
    {
      key: 'totalAmount', header: 'Cart Value',
      render: (c) => <span className="font-semibold">{formatCurrency(c.totalAmount)}</span>,
    },
    {
      key: 'updatedAt', header: 'Abandoned Since',
      render: (c) => <span className="text-xs text-muted-foreground">{formatDate(c.updatedAt)}</span>,
    },
    {
      key: 'actions', header: 'Details',
      render: (c) => (
        <Button
          variant="outline" size="sm"
          onClick={() => setExpandedCart(expandedCart === c._id ? null : c._id)}
        >
          {expandedCart === c._id ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Abandoned Carts" description={`${totalItems} abandoned cart${totalItems !== 1 ? 's' : ''} found`}>
        <Button onClick={handleDownload} disabled={downloading} className="gap-2">
          <Download className="h-4 w-4" />
          {downloading ? 'Downloading...' : 'Download CSV'}
        </Button>
      </PageHeader>

      <DataTable
        columns={columns} data={carts} loading={loading}
        searchValue={search} onSearchChange={setSearch}
        searchPlaceholder="Search by customer name or email..."
        rowKey={(c) => c._id}
        expandedRow={expandedCart}
        renderExpandedRow={(cart) => (
          <div className="px-4 py-3 bg-muted/30 border-t">
            <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Cart Items</p>
            <div className="space-y-2">
              {cart.items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 rounded-md border bg-card p-2">
                  {item.product?.thumbnail && (
                    <div className="relative h-10 w-10 overflow-hidden rounded-md border flex-shrink-0">
                      <Image src={item.product.thumbnail} alt={item.product?.name || 'Product'} fill className="object-cover" sizes="40px" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{item.product?.name || 'Unknown Product'}</p>
                    <p className="text-xs text-muted-foreground">
                      Qty: {item.quantity}{item.color ? ` · Color: ${item.color}` : ''} · {formatCurrency(item.price)} each
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-foreground">{formatCurrency(item.totalPrice)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      />
      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} totalItems={totalItems} pageSize={LIMIT} />
    </div>
  );
}
