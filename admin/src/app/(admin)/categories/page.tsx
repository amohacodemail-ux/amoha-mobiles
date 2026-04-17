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
import { categoryService } from '@/services/category.service';
import { ImageUploader } from '@/components/shared/image-uploader';
import { formatDate } from '@/lib/utils';
import type { Category } from '@/types';

const schema = z.object({
  name: z.string().min(2, 'Name required'),
  description: z.string().optional(),
  image: z.string().min(1, 'Image is required'),
  isActive: z.boolean().default(true),
});
type FormData = z.infer<typeof schema>;

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState('');

  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { isActive: true },
  });

  const load = async () => {
    setLoading(true);
    try { const result = await categoryService.getAll(); setCategories(Array.isArray(result) ? result : []); }
    catch { toast.error('Failed to load categories'); setCategories([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { reset({ name: '', description: '', image: '', isActive: true }); setEditId(null); setModalOpen(true); };
  const openEdit = (c: Category) => {
    reset({
      name: c.name,
      description: c.description || '',
      image: c.image || '',
      isActive: c.isActive,
    });
    setEditId(c._id); setModalOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    try {
      if (editId) { await categoryService.update(editId, data); toast.success('Category updated'); }
      else { await categoryService.create({ ...data, description: data.description ?? '', image: data.image ?? '', isActive: data.isActive }); toast.success('Category created'); }
      setModalOpen(false); load();
    } catch (err: any) { toast.error(err?.response?.data?.message ?? 'Failed to save category'); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try { await categoryService.delete(deleteId); toast.success('Category deleted'); setDeleteId(null); load(); }
    catch { toast.error('Delete failed'); }
    finally { setDeleting(false); }
  };

  const filtered = categories.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));

  const columns: Column<Category>[] = [
    {
      key: 'name', header: 'Category',
      render: (c) => (
        <div className="flex items-center gap-3">
          {c.image && <img src={c.image} alt={c.name} className="w-9 h-9 rounded-lg object-cover bg-secondary" />}
          <div>
            <p className="font-medium text-foreground">{c.name}</p>
            <p className="text-xs text-muted-foreground">{c.slug}</p>
          </div>
        </div>
      ),
    },
    { key: 'description', header: 'Description', render: (c) => <span className="text-sm text-muted-foreground line-clamp-1">{c.description || '—'}</span> },
    { key: 'productCount', header: 'Products', render: (c) => <Badge variant="secondary">{c.productCount ?? 0} products</Badge> },
    { key: 'isActive', header: 'Status', render: (c) => <Badge variant={c.isActive ? 'success' : 'secondary'}>{c.isActive ? 'Active' : 'Inactive'}</Badge> },
    { key: 'createdAt', header: 'Created', render: (c) => <span className="text-xs text-muted-foreground">{formatDate(c.createdAt)}</span> },
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
      <PageHeader title="Categories" description={`${categories.length} total categories`}>
        <Button onClick={openAdd}><Plus className="h-4 w-4" />Add Category</Button>
      </PageHeader>

      <DataTable columns={columns} data={filtered} loading={loading} searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search categories..." rowKey={(c) => c._id} />

      {/* Add/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editId ? 'Edit Category' : 'Add Category'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input label="Category Name" placeholder="e.g. Smartphones" error={errors.name?.message} {...register('name')} />
            <Textarea label="Description" placeholder="Brief description..." {...register('description')} />
            <ImageUploader value={watch('image')} onChange={(url) => setValue('image', url)} folder="categories" label="Category Image" />
            {errors.image && <p className="text-xs text-destructive -mt-2">{errors.image.message}</p>}
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

      <ConfirmModal open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} loading={deleting} title="Delete Category?" description="All products in this category may be affected." confirmLabel="Delete" />
    </div>
  );
}
