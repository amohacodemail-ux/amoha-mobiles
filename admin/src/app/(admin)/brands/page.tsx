'use client';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable, Column } from '@/components/shared/data-table';
import { ConfirmModal } from '@/components/shared/confirm-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { brandService } from '@/services/brand.service';
import { ImageUploader } from '@/components/shared/image-uploader';
import { formatDate } from '@/lib/utils';
import type { Brand } from '@/types';

const schema = z.object({
  name: z.string().min(2, 'Name required'),
  description: z.string().optional(),
  logo: z.string().optional(),
  isActive: z.boolean().default(true),
});
type FormData = z.infer<typeof schema>;

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { isActive: true },
  });

  const load = async () => {
    setLoading(true);
    try { const result = await brandService.getAll(); setBrands(Array.isArray(result) ? result : []); }
    catch { toast.error('Failed to load brands'); setBrands([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { reset({ name: '', description: '', logo: '', isActive: true }); setEditId(null); setModalOpen(true); };
  const openEdit = (b: Brand) => {
    reset({
      name: b.name,
      description: b.description || '',
      logo: b.logo || '',
      isActive: b.isActive,
    });
    setEditId(b._id); setModalOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    try {
      const payload = { name: data.name, description: data.description ?? '', logo: data.logo ?? '', isActive: data.isActive };
      if (editId) { await brandService.update(editId, payload); toast.success('Brand updated'); }
      else { await brandService.create(payload); toast.success('Brand created'); }
      setModalOpen(false); load();
    } catch (err: any) { toast.error(err?.response?.data?.message ?? 'Failed to save brand'); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try { await brandService.delete(deleteId); toast.success('Brand deleted'); setDeleteId(null); load(); }
    catch (err: any) { toast.error(err?.response?.data?.message ?? 'Delete failed'); }
    finally { setDeleting(false); }
  };

  const filtered = brands.filter((b) => b.name.toLowerCase().includes(search.toLowerCase()));

  const columns: Column<Brand>[] = [
    {
      key: 'name', header: 'Brand',
      render: (b) => (
        <div className="flex items-center gap-3">
          {b.logo && <img src={b.logo} alt={b.name} className="w-9 h-9 rounded-lg object-contain bg-secondary p-1" />}
          <div>
            <p className="font-medium text-foreground">{b.name}</p>
            <p className="text-xs text-muted-foreground">{b.slug}</p>
          </div>
        </div>
      ),
    },
    { key: 'description', header: 'Description', render: (b) => <span className="text-sm text-muted-foreground line-clamp-1">{b.description || '—'}</span> },
    { key: 'productCount', header: 'Products', render: (b) => <Badge variant="secondary">{b.productCount ?? 0} products</Badge> },
    { key: 'isActive', header: 'Status', render: (b) => <Badge variant={b.isActive ? 'success' : 'secondary'}>{b.isActive ? 'Active' : 'Inactive'}</Badge> },
    { key: 'createdAt', header: 'Created', render: (b) => <span className="text-xs text-muted-foreground">{formatDate(b.createdAt)}</span> },
    {
      key: 'actions', header: 'Actions',
      render: (b) => (
        <div className="flex gap-2">
          <Button variant="outline" size="icon-sm" onClick={() => openEdit(b)}><Pencil className="h-3.5 w-3.5" /></Button>
          <Button variant="outline" size="icon-sm" className="hover:border-destructive hover:text-destructive" onClick={() => setDeleteId(b._id)}><Trash2 className="h-3.5 w-3.5" /></Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Brands" description={`${brands.length} total brands`}>
        <Button onClick={openAdd}><Plus className="h-4 w-4" />Add Brand</Button>
      </PageHeader>

      <DataTable columns={columns} data={filtered} loading={loading} searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search brands..." rowKey={(b) => b._id} />

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editId ? 'Edit Brand' : 'Add Brand'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input label="Brand Name" placeholder="e.g. Samsung" error={errors.name?.message} {...register('name')} />
            <Textarea label="Description" placeholder="About this brand..." {...register('description')} />
            <ImageUploader value={watch('logo') ?? ''} onChange={(url) => setValue('logo', url)} folder="brands" label="Brand Logo" />
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

      <ConfirmModal open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} loading={deleting} title="Delete Brand?" description="This may affect products associated with this brand." confirmLabel="Delete" />
    </div>
  );
}
