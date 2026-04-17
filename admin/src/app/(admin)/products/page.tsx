'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { useDebouncedValue } from '@/lib/hooks';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Package, AlertTriangle } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable, Column } from '@/components/shared/data-table';
import { Pagination } from '@/components/shared/pagination';
import { ConfirmModal } from '@/components/shared/confirm-modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { productService } from '@/services/product.service';
import { formatCurrency, formatDate, safeImageSrc } from '@/lib/utils';
import type { Product } from '@/types';

const LIMIT = 10;

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const debouncedSearch = useDebouncedValue(search, 350);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await productService.getAll({ page, limit: LIMIT, search: debouncedSearch, sortBy, sortOrder });
      setProducts(Array.isArray(res.products) ? res.products : []);
      setTotalPages(res.totalPages ?? 1);
      setTotalItems(res.totalProducts ?? 0);
    } catch { toast.error('Failed to load products'); setProducts([]); }
    finally { setLoading(false); }
  }, [page, debouncedSearch, sortBy, sortOrder]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [debouncedSearch]);

  const handleSort = (key: string) => {
    if (sortBy === key) setSortOrder((o) => o === 'asc' ? 'desc' : 'asc');
    else { setSortBy(key); setSortOrder('asc'); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    const removedId = deleteId;
    try {
      await productService.delete(removedId);
      toast.success('Product deleted successfully');
      setDeleteId(null);
      setProducts((prev) => prev.filter((p) => p._id !== removedId));
      setTotalItems((prev) => Math.max(0, prev - 1));
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const columns: Column<Product>[] = [
    {
      key: 'name', header: 'Product', sortable: true,
      render: (p) => (
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
            {p.thumbnail ? <Image src={safeImageSrc(p.thumbnail)} alt={p.name} fill className="object-cover" onError={(e) => { (e.target as HTMLImageElement).src = '/images/no-image.svg'; }} /> : <Package className="h-4 w-4 m-auto text-muted-foreground" />}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-foreground truncate max-w-[200px]">{p.name}</p>
            <p className="text-xs text-muted-foreground">{typeof p.brand === 'object' ? p.brand?.name : p.brand}</p>
          </div>
        </div>
      ),
    },
    { key: 'category', header: 'Category', render: (p) => <span className="text-sm">{typeof p.category === 'object' ? p.category?.name : p.category}</span> },
    { key: 'price', header: 'Price', sortable: true, render: (p) => <span className="font-semibold">{formatCurrency(p.price)}</span> },
    {
      key: 'stock', header: 'Stock', sortable: true,
      render: (p) => (
        <div className="flex items-center gap-2">
          {p.stock < 10 && <AlertTriangle className="h-3.5 w-3.5 text-yellow-600 dark:text-yellow-400" />}
          <span className={p.stock === 0 ? 'text-destructive font-semibold' : p.stock < 10 ? 'text-yellow-600 dark:text-yellow-400 font-semibold' : 'text-foreground'}>{p.stock}</span>
        </div>
      ),
    },
    {
      key: 'inStock', header: 'Status',
      render: (p) => <Badge variant={p.inStock ? 'success' : 'destructive'}>{p.inStock ? 'In Stock' : 'Out of Stock'}</Badge>,
    },
    { key: 'createdAt', header: 'Added', sortable: true, render: (p) => <span className="text-muted-foreground text-xs">{formatDate(p.createdAt)}</span> },
    {
      key: 'actions', header: 'Actions',
      render: (p) => (
        <div className="flex items-center gap-2">
          <Link href={`/products/${p._id}/edit`}>
            <Button variant="outline" size="icon-sm"><Pencil className="h-3.5 w-3.5" /></Button>
          </Link>
          <Button variant="outline" size="icon-sm" className="hover:border-destructive hover:text-destructive" onClick={() => setDeleteId(p._id)}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Products" description={`${totalItems} total products`}>
        <Link href="/products/add"><Button><Plus className="h-4 w-4" />Add Product</Button></Link>
      </PageHeader>

      <DataTable
        columns={columns}
        data={products}
        loading={loading}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search products..."
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
        rowKey={(p) => p._id}
        emptyMessage="No products found."
      />

      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} totalItems={totalItems} pageSize={LIMIT} />

      <ConfirmModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Product?"
        description="This will permanently delete the product and cannot be undone."
        confirmLabel="Delete Product"
      />
    </div>
  );
}
