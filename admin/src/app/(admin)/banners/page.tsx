'use client';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable, Column } from '@/components/shared/data-table';
import { ConfirmModal } from '@/components/shared/confirm-modal';
import { ImageUploader } from '@/components/shared/image-uploader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { bannerService } from '@/services/banner.service';
import { formatDate } from '@/lib/utils';
import type { Banner } from '@/types';

const schema = z.object({
  title: z.string().min(2, 'Title required'),
  subtitle: z.string().optional(),
  image: z.string().min(1, 'Image required'),
  link: z.string().optional(),
  position: z.enum(['hero', 'sidebar', 'popup', 'footer']),
  order: z.coerce.number().min(0),
  isActive: z.boolean().default(true),
});
type FormData = z.infer<typeof schema>;

export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { position: 'hero', isActive: true, order: 0 },
  });

  const load = async () => {
    setLoading(true);
    try { const result = await bannerService.getAll(); setBanners(Array.isArray(result) ? result : []); }
    catch { toast.error('Failed to load banners'); setBanners([]); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const openAdd = () => { reset(); setEditId(null); setModalOpen(true); };
  const openEdit = (b: Banner) => {
    reset({
      title: b.title,
      subtitle: b.subtitle || '',
      image: b.image,
      link: b.link || '',
      position: b.position,
      order: b.order,
      isActive: b.isActive,
    });
    setEditId(b._id); setModalOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    try {
      const payload = { ...data, subtitle: data.subtitle ?? '', link: data.link ?? '' };
      if (editId) { await bannerService.update(editId, payload); toast.success('Banner updated'); }
      else { await bannerService.create(payload); toast.success('Banner created'); }
      setModalOpen(false); load();
    } catch (err: any) { toast.error(err?.response?.data?.message ?? 'Failed to save banner'); }
  };

  const handleToggle = async (b: Banner) => {
    try {
      await bannerService.toggleActive(b._id, !b.isActive);
      toast.success(`Banner ${b.isActive ? 'deactivated' : 'activated'}`);
      load();
    } catch { toast.error('Toggle failed'); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try { await bannerService.delete(deleteId); toast.success('Banner deleted'); setDeleteId(null); load(); }
    catch { toast.error('Delete failed'); }
    finally { setDeleting(false); }
  };

  const filtered = banners.filter((b) => b.title.toLowerCase().includes(search.toLowerCase()));

  const columns: Column<Banner>[] = [
    {
      key: 'title', header: 'Banner',
      render: (b) => (
        <div className="flex items-center gap-3">
          <img src={b.image} alt={b.title} className="w-16 h-10 rounded-md object-cover bg-secondary flex-shrink-0" />
          <div>
            <p className="font-medium text-foreground text-sm">{b.title}</p>
            {b.subtitle && <p className="text-xs text-muted-foreground">{b.subtitle}</p>}
          </div>
        </div>
      ),
    },
    { key: 'position', header: 'Position', render: (b) => <Badge variant="secondary" className="capitalize">{b.position}</Badge> },
    { key: 'order', header: 'Order', render: (b) => <span className="text-sm font-medium">{b.order}</span> },
    { key: 'isActive', header: 'Status', render: (b) => <Badge variant={b.isActive ? 'success' : 'secondary'}>{b.isActive ? 'Active' : 'Inactive'}</Badge> },
    { key: 'createdAt', header: 'Created', render: (b) => <span className="text-xs text-muted-foreground">{formatDate(b.createdAt)}</span> },
    {
      key: 'actions', header: 'Actions',
      render: (b) => (
        <div className="flex gap-2">
          <Button variant="outline" size="icon-sm" onClick={() => handleToggle(b)} title={b.isActive ? 'Deactivate' : 'Activate'}>
            {b.isActive ? <ToggleRight className="h-3.5 w-3.5 text-green-600 dark:text-green-400" /> : <ToggleLeft className="h-3.5 w-3.5 text-muted-foreground" />}
          </Button>
          <Button variant="outline" size="icon-sm" onClick={() => openEdit(b)}><Pencil className="h-3.5 w-3.5" /></Button>
          <Button variant="outline" size="icon-sm" className="hover:border-destructive hover:text-destructive" onClick={() => setDeleteId(b._id)}><Trash2 className="h-3.5 w-3.5" /></Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Banners" description={`${banners.length} total banners`}>
        <Button onClick={openAdd}><Plus className="h-4 w-4" />Add Banner</Button>
      </PageHeader>

      <DataTable columns={columns} data={filtered} loading={loading} searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search banners..." rowKey={(b) => b._id} />

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editId ? 'Edit Banner' : 'Add Banner'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Position</label>
                <Select value={watch('position')} onValueChange={(v) => setValue('position', v as Banner['position'])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hero">Hero (Homepage Slider)</SelectItem>
                    <SelectItem value="sidebar">Sidebar</SelectItem>
                    <SelectItem value="popup">Popup</SelectItem>
                    <SelectItem value="footer">Footer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Input label="Display Order" type="number" {...register('order')} />
            </div>
            <Input label="Title" placeholder="Summer Sale" error={errors.title?.message} {...register('title')} />
            <Input label="Subtitle" placeholder="Up to 50% off on all smartphones" {...register('subtitle')} />
            <div>
              <ImageUploader value={watch('image')} onChange={(url) => setValue('image', url)} folder="banners" label="Banner Image" />
              {watch('position') === 'hero' && (
                <p className="mt-1 text-xs text-muted-foreground">Recommended: <strong>1920 x 700 px</strong> (landscape 21:8 ratio). Image will be cropped to fill — center your subject.</p>
              )}
              {errors.image?.message && <p className="mt-1 text-xs text-destructive">{errors.image.message}</p>}
            </div>
            <Input label="Link URL" placeholder="/products?category=smartphones" {...register('link')} />
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

      <ConfirmModal open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} loading={deleting} title="Delete Banner?" description="This banner will be permanently removed." confirmLabel="Delete" />
    </div>
  );
}
