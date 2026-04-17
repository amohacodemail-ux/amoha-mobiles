'use client';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Copy } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable, Column } from '@/components/shared/data-table';
import { ConfirmModal } from '@/components/shared/confirm-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { couponService } from '@/services/coupon.service';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Coupon } from '@/types';

const schema = z.object({
  code: z.string().min(3, 'Code required').transform((v) => v.toUpperCase()),
  discount: z.coerce.number().min(1, 'Discount required'),
  discountType: z.enum(['percentage', 'fixed']),
  minOrderAmount: z.coerce.number().min(0),
  maxDiscount: z.coerce.number().optional(),
  usageLimit: z.coerce.number().min(1),
  isActive: z.boolean().default(true),
  expiresAt: z.string().min(1, 'Expiry date required'),
});
type FormData = z.infer<typeof schema>;

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { discountType: 'percentage', isActive: true, usageLimit: 100, minOrderAmount: 0 },
  });

  const load = async () => {
    setLoading(true);
    try { const result = await couponService.getAll(); setCoupons(Array.isArray(result) ? result : []); }
    catch { toast.error('Failed to load coupons'); setCoupons([]); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const openAdd = () => { reset({ code: '', discount: 0, discountType: 'percentage', minOrderAmount: 0, maxDiscount: undefined, usageLimit: 100, isActive: true, expiresAt: '' }); setEditId(null); setModalOpen(true); };
  const openEdit = (c: Coupon) => {
    reset({
      code: c.code,
      discount: c.discount,
      discountType: c.discountType,
      minOrderAmount: c.minOrderAmount,
      maxDiscount: c.maxDiscount || undefined,
      usageLimit: c.usageLimit,
      isActive: c.isActive,
      expiresAt: c.expiresAt ? c.expiresAt.split('T')[0] : '',
    });
    setEditId(c._id); setModalOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    try {
      if (editId) { await couponService.update(editId, data); toast.success('Coupon updated'); }
      else { await couponService.create(data); toast.success('Coupon created'); }
      setModalOpen(false); load();
    } catch (err: any) { toast.error(err?.response?.data?.message ?? 'Failed to save coupon'); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try { await couponService.delete(deleteId); toast.success('Coupon deleted'); setDeleteId(null); load(); }
    catch { toast.error('Delete failed'); }
    finally { setDeleting(false); }
  };

  const copyCode = (code: string) => { navigator.clipboard.writeText(code); toast.success('Copied!'); };

  const filtered = coupons.filter((c) => c.code.toLowerCase().includes(search.toLowerCase()));

  const columns: Column<Coupon>[] = [
    {
      key: 'code', header: 'Code',
      render: (c) => (
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-primary">{c.code}</span>
          <button onClick={() => copyCode(c.code)} className="text-muted-foreground hover:text-foreground"><Copy className="h-3 w-3" /></button>
        </div>
      ),
    },
    {
      key: 'discount', header: 'Discount',
      render: (c) => <span className="font-semibold">{c.discountType === 'percentage' ? `${c.discount}%` : formatCurrency(c.discount)}</span>,
    },
    { key: 'minOrderAmount', header: 'Min Order', render: (c) => <span className="text-sm">{formatCurrency(c.minOrderAmount)}</span> },
    {
      key: 'usage', header: 'Usage',
      render: (c) => (
        <div>
          <p className="text-sm font-medium">{c.usedCount}/{c.usageLimit}</p>
          <div className="w-16 h-1 bg-secondary rounded-full mt-1"><div className="h-1 bg-primary rounded-full" style={{ width: `${Math.min((c.usedCount / c.usageLimit) * 100, 100)}%` }} /></div>
        </div>
      ),
    },
    {
      key: 'isActive', header: 'Status',
      render: (c) => {
        const expired = new Date(c.expiresAt) < new Date();
        return <Badge variant={c.isActive && !expired ? 'success' : 'destructive'}>{expired ? 'Expired' : c.isActive ? 'Active' : 'Inactive'}</Badge>;
      },
    },
    { key: 'expiresAt', header: 'Expires', render: (c) => <span className="text-xs text-muted-foreground">{formatDate(c.expiresAt)}</span> },
    {
      key: 'actions', header: 'Actions',
      render: (c) => (
        <div className="flex gap-2">
          <Button variant="outline" size="icon-sm" onClick={() => openEdit(c)}><Pencil className="h-3.5 w-3.5" /></Button>
          <Button variant="outline" size="icon-sm" className="hover:border-destructive hover:text-destructive" onClick={() => setDeleteId(c._id)}><Trash2 className="h-3.5 w-3.5" /></Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Coupons" description={`${coupons.length} total coupons`}>
        <Button onClick={openAdd}><Plus className="h-4 w-4" />Add Coupon</Button>
      </PageHeader>

      <DataTable columns={columns} data={filtered} loading={loading} searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search coupons..." rowKey={(c) => c._id} />

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editId ? 'Edit Coupon' : 'Add Coupon'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input label="Coupon Code" placeholder="SAVE20" error={errors.code?.message} {...register('code')} className="uppercase" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Discount Type</label>
                <Select value={watch('discountType')} onValueChange={(v) => setValue('discountType', v as 'percentage' | 'fixed')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Input label="Discount Value" type="number" error={errors.discount?.message} {...register('discount')} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input label="Min Order" type="number" {...register('minOrderAmount')} />
              <Input label="Max Discount" type="number" placeholder="Optional" {...register('maxDiscount')} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input label="Usage Limit" type="number" error={errors.usageLimit?.message} {...register('usageLimit')} />
              <Input label="Expires At" type="date" error={errors.expiresAt?.message} {...register('expiresAt')} />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Active</label>
              <Switch checked={watch('isActive')} onCheckedChange={(v) => setValue('isActive', v)} />
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button type="submit" loading={isSubmitting}>{editId ? 'Update' : 'Create'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmModal open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} loading={deleting} title="Delete Coupon?" description="This coupon will be permanently removed." confirmLabel="Delete" />
    </div>
  );
}
