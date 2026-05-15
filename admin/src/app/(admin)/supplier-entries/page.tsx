'use client';
import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  ClipboardList, Package, CheckCircle, XCircle,
  Search, ChevronLeft, ChevronRight, Clock, Eye,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable, Column } from '@/components/shared/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { supplierEntryService } from '@/services/supplier-entry.service';
import { brandService } from '@/services/brand.service';
import { categoryService } from '@/services/category.service';
import { formatDate } from '@/lib/utils';

const LIMIT = 15;

function StatCard({ title, value, icon: Icon, color }: { title: string; value: string | number; icon: any; color: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
    </div>
  );
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700',
  converted: 'bg-green-50 text-green-700',
  rejected: 'bg-red-50 text-red-700',
};

type Tab = 'all' | 'pending' | 'converted' | 'rejected';

export default function SupplierEntriesPage() {
  const [tab, setTab] = useState<Tab>('all');
  const [stats, setStats] = useState<any>(null);
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // View detail
  const [viewEntry, setViewEntry] = useState<any>(null);

  // Convert dialog
  const [convertOpen, setConvertOpen] = useState(false);
  const [convertEntry, setConvertEntry] = useState<any>(null);
  const [convertForm, setConvertForm] = useState({
    name: '', description: '', sellingPrice: '', originalPrice: '',
    categoryId: '', brandId: '', thumbnail: '',
  });
  const [converting, setConverting] = useState(false);

  // Reject dialog
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectEntry, setRejectEntry] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejecting, setRejecting] = useState(false);

  // Dropdown data
  const [brands, setBrands] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  const loadStats = async () => {
    try {
      const data = await supplierEntryService.getDashboardStats();
      setStats(data);
    } catch { /* ignore */ }
  };

  const loadDropdowns = async () => {
    try {
      const [b, c] = await Promise.all([brandService.getAll(), categoryService.getAll()]);
      setBrands(b || []);
      setCategories(c || []);
    } catch { /* ignore */ }
  };

  const loadEntries = useCallback(async () => {
    setLoading(true);
    try {
      const statusFilter = tab === 'all' ? undefined : tab;
      const result = await supplierEntryService.getAllEntries({
        page, limit: LIMIT, search, status: statusFilter,
      });
      setEntries(result.entries || []);
      setTotalPages(result.totalPages || 1);
    } catch { toast.error('Failed to load entries'); }
    finally { setLoading(false); }
  }, [page, search, tab]);

  useEffect(() => { loadStats(); loadDropdowns(); }, []);
  useEffect(() => { loadEntries(); }, [loadEntries]);

  // Convert
  const openConvert = (entry: any) => {
    setConvertEntry(entry);
    setConvertForm({
      name: entry.itemName || '',
      description: '',
      sellingPrice: entry.price ? String(entry.price) : '',
      originalPrice: entry.price ? String(entry.price) : '',
      categoryId: '',
      brandId: '',
      thumbnail: '',
    });
    setConvertOpen(true);
  };

  const handleConvert = async () => {
    if (!convertEntry) return;
    if (!convertForm.name.trim()) return toast.error('Product name is required');
    if (!convertForm.sellingPrice) return toast.error('Selling price is required');
    const parsedPrice = parseFloat(convertForm.sellingPrice);
    if (isNaN(parsedPrice) || parsedPrice <= 0) return toast.error('Selling price must be a valid positive number');
    setConverting(true);
    try {
      await supplierEntryService.convertEntry(convertEntry._id, {
        name: convertForm.name,
        description: convertForm.description,
        sellingPrice: parseFloat(convertForm.sellingPrice),
        originalPrice: convertForm.originalPrice ? parseFloat(convertForm.originalPrice) : undefined,
        categoryId: convertForm.categoryId || null,
        brandId: convertForm.brandId || null,
        thumbnail: convertForm.thumbnail || null,
      });
      toast.success('Entry converted to product + inventory created');
      setConvertOpen(false);
      loadEntries();
      loadStats();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Conversion failed');
    }
    finally { setConverting(false); }
  };

  // Reject
  const openReject = (entry: any) => {
    setRejectEntry(entry);
    setRejectReason('');
    setRejectOpen(true);
  };

  const handleReject = async () => {
    if (!rejectEntry) return;
    if (!rejectReason.trim()) return toast.error('Rejection reason is required');
    setRejecting(true);
    try {
      await supplierEntryService.rejectEntry(rejectEntry._id, rejectReason);
      toast.success('Entry rejected');
      setRejectOpen(false);
      loadEntries();
      loadStats();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Rejection failed');
    }
    finally { setRejecting(false); }
  };

  const columns: Column<any>[] = [
    {
      key: 'itemName', header: 'Item Name', sortable: true,
      render: (e) => <span className="font-medium text-foreground">{e.itemName}</span>,
    },
    {
      key: 'quantity', header: 'Qty',
      render: (e) => <span className="font-mono font-medium">{e.quantity}</span>,
    },
    {
      key: 'price', header: 'Price',
      render: (e) => e.price ? <span className="font-mono">₹{e.price.toLocaleString()}</span> : <span className="text-muted-foreground">-</span>,
    },
    {
      key: 'supplier', header: 'Supplier',
      render: (e) => <span className="text-sm">{e.supplier?.name || e.supplier?.email || '-'}</span>,
    },
    {
      key: 'status', header: 'Status',
      render: (e) => <Badge variant="outline" className={statusColors[e.status] || ''}>{e.status}</Badge>,
    },
    {
      key: 'createdAt', header: 'Submitted',
      render: (e) => <span className="text-xs text-muted-foreground">{formatDate(e.createdAt)}</span>,
    },
    {
      key: 'actions', header: '',
      render: (e) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => setViewEntry(e)}>
            <Eye className="h-3.5 w-3.5" />
          </Button>
          {e.status === 'pending' && (
            <>
              <Button variant="outline" size="sm" className="text-green-700" onClick={() => openConvert(e)}>
                <CheckCircle className="h-3.5 w-3.5 mr-1" /> Convert
              </Button>
              <Button variant="outline" size="sm" className="text-red-700" onClick={() => openReject(e)}>
                <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Supplier Entries" description="Review supplier submissions, convert to products, or reject" />

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Entries" value={stats.total} icon={ClipboardList} color="bg-slate-600" />
          <StatCard title="Pending" value={stats.pending} icon={Clock} color="bg-yellow-500" />
          <StatCard title="Converted" value={stats.converted} icon={Package} color="bg-green-500" />
          <StatCard title="Rejected" value={stats.rejected} icon={XCircle} color="bg-red-500" />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {(['all', 'pending', 'converted', 'rejected'] as Tab[]).map(t => (
          <button key={t} onClick={() => { setTab(t); setPage(1); }}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors capitalize ${tab === t ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Search + table */}
      <div className="space-y-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by item name..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="pl-9" />
        </div>
        <DataTable columns={columns} data={entries} loading={loading} rowKey={(e) => e._id || Math.random().toString()} />
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}><ChevronLeft className="h-4 w-4" /></Button>
            <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        )}
      </div>

      {/* View Detail Dialog */}
      <Dialog open={!!viewEntry} onOpenChange={() => setViewEntry(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Entry Details</DialogTitle></DialogHeader>
          {viewEntry && (
            <div className="space-y-3 py-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-muted-foreground">Item:</span> <span className="font-medium">{viewEntry.itemName}</span></div>
                <div><span className="text-muted-foreground">Quantity:</span> <span className="font-mono">{viewEntry.quantity}</span></div>
                <div><span className="text-muted-foreground">Price:</span> <span className="font-mono">{viewEntry.price ? `₹${viewEntry.price.toLocaleString()}` : '-'}</span></div>
                <div><span className="text-muted-foreground">Status:</span> <Badge variant="outline" className={statusColors[viewEntry.status]}>{viewEntry.status}</Badge></div>
                <div><span className="text-muted-foreground">Supplier:</span> <span>{viewEntry.supplier?.name || viewEntry.supplier?.email || '-'}</span></div>
                <div><span className="text-muted-foreground">Submitted:</span> <span>{formatDate(viewEntry.createdAt)}</span></div>
              </div>
              {viewEntry.note && <div><span className="text-muted-foreground">Note:</span> <p className="mt-1">{viewEntry.note}</p></div>}
              {viewEntry.rejectionReason && <div><span className="text-muted-foreground">Rejection Reason:</span> <p className="mt-1 text-red-700">{viewEntry.rejectionReason}</p></div>}
              {viewEntry.convertedProductId && <div><span className="text-muted-foreground">Converted Product ID:</span> <span className="font-mono text-xs">{viewEntry.convertedProductId}</span></div>}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Convert to Product Dialog */}
      <Dialog open={convertOpen} onOpenChange={setConvertOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Convert to Product</DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Converting: <strong>{convertEntry?.itemName}</strong> (Qty: {convertEntry?.quantity})
            </p>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Product Name *</label>
              <Input value={convertForm.name} onChange={e => setConvertForm({ ...convertForm, name: e.target.value })} placeholder="Product name" />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <textarea value={convertForm.description} onChange={e => setConvertForm({ ...convertForm, description: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background resize-none" rows={3} placeholder="Product description" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Selling Price *</label>
                <Input type="number" value={convertForm.sellingPrice} onChange={e => setConvertForm({ ...convertForm, sellingPrice: e.target.value })} min={0} placeholder="0" />
              </div>
              <div>
                <label className="text-sm font-medium">Original Price</label>
                <Input type="number" value={convertForm.originalPrice} onChange={e => setConvertForm({ ...convertForm, originalPrice: e.target.value })} min={0} placeholder="0" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Category</label>
                <select value={convertForm.categoryId} onChange={e => setConvertForm({ ...convertForm, categoryId: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background">
                  <option value="">None</option>
                  {categories.map(c => <option key={c._id || c.id} value={c._id || c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Brand</label>
                <select value={convertForm.brandId} onChange={e => setConvertForm({ ...convertForm, brandId: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background">
                  <option value="">None</option>
                  {brands.map(b => <option key={b._id || b.id} value={b._id || b.id}>{b.name}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Thumbnail URL</label>
              <Input value={convertForm.thumbnail} onChange={e => setConvertForm({ ...convertForm, thumbnail: e.target.value })} placeholder="https://..." />
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-700 dark:bg-surface-100 dark:border-white/[0.08] dark:text-slate-300">
              A product will be created with <strong>{convertEntry?.quantity}</strong> units of stock.
              An inventory record will be auto-created with full stock tracking.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConvertOpen(false)}>Cancel</Button>
            <Button onClick={handleConvert} disabled={converting}>{converting ? 'Converting...' : 'Convert to Product'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Entry</DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Rejecting: <strong>{rejectEntry?.itemName}</strong>
            </p>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Reason *</label>
              <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background resize-none" rows={3} placeholder="Why is this entry being rejected?" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject} disabled={rejecting}>{rejecting ? 'Rejecting...' : 'Reject Entry'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
