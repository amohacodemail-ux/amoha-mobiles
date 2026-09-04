'use client';
import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { couponService } from '@/services/coupon.service';
import { crmService } from '@/services/crm.service';
import type { Coupon } from '@/types';
import { ProductSelectorModal } from '@/components/shared/product-selector-modal';
import { Trash2 } from 'lucide-react';

const campaignSchema = z.object({
  name: z.string().min(3, 'Campaign name must be at least 3 characters'),
  description: z.string().optional(),
  targetType: z.enum(['all', 'segment']),
  targetSegment: z.string().optional(),
  productTargetType: z.enum(['all', 'products', 'category']),
  productIds: z.array(z.string()).optional(),
  categoryId: z.string().optional(),
  couponId: z.string().optional(),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  status: z.enum(['draft', 'scheduled', 'active', 'paused', 'completed', 'archived']).default('draft'),
}).refine((data) => {
  if (data.targetType === 'segment' && !data.targetSegment) return false;
  return true;
}, { message: 'Target segment is required', path: ['targetSegment'] })
  .refine((data) => {
    if (data.productTargetType === 'category' && !data.categoryId) return false;
    return true;
  }, { message: 'Category is required', path: ['categoryId'] })
  .refine((data) => {
    if (data.productTargetType === 'products' && (!data.productIds || data.productIds.length === 0)) return false;
    return true;
  }, { message: 'At least one product is required', path: ['productIds'] })
  .refine((data) => {
    if (new Date(data.endDate) <= new Date(data.startDate)) return false;
    return true;
  }, { message: 'End date must be after start date', path: ['endDate'] });

type FormData = z.infer<typeof campaignSchema>;

interface Props {
  initialData?: any;
  onSubmit: (data: any) => Promise<void>;
  loading?: boolean;
}

export function CampaignForm({ initialData, onSubmit, loading }: Props) {
  const router = useRouter();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [segments, setSegments] = useState<any[]>([]);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [selectedProductDetails, setSelectedProductDetails] = useState<any[]>([]);

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      targetType: initialData?.targetType || 'all',
      targetSegment: initialData?.targetSegment || '',
      productTargetType: initialData?.productTargetType || 'all',
      productIds: initialData?.productIds || [],
      categoryId: initialData?.categoryId || '',
      couponId: initialData?.couponId || (initialData?.coupon?.id) || '',
      startDate: initialData?.startDate ? new Date(initialData.startDate).toISOString().slice(0, 16) : '',
      endDate: initialData?.endDate ? new Date(initialData.endDate).toISOString().slice(0, 16) : '',
      status: initialData?.status || 'draft',
    },
  });

  const targetType = watch('targetType');
  const targetSegment = watch('targetSegment');
  const productTargetType = watch('productTargetType');
  const couponId = watch('couponId');

  useEffect(() => {
    couponService.getAll().then(setCoupons).catch(console.error);
    crmService.getSegmentSummary().then(setSegments).catch(console.error);

    // Load initial product details if editing
    const initialProductIds = initialData?.productIds || [];
    if (initialProductIds.length > 0) {
      // Import productService at top or just use it here
      // Wait, we need to import productService
      import('@/services/product.service').then(({ productService }) => {
        Promise.all(initialProductIds.map((id: string) => productService.getById(id).catch(() => null)))
          .then(results => {
            const validProducts = results.filter(Boolean);
            setSelectedProductDetails(validProducts);
          });
      });
    }
  }, [initialData]);

  useEffect(() => {
    if (couponId && couponId !== 'none') {
      const selected = coupons.find(c => (c._id || c.id) === couponId);
      if (selected?.expiresAt) {
        setValue('endDate', new Date(selected.expiresAt).toISOString().slice(0, 16));
      }
    }
  }, [couponId, coupons, setValue]);

  const selectedSegment = segments.find(s => s.segment === targetSegment);
  const selectedCoupon = coupons.find(c => (c._id || c.id) === couponId);
  const now = new Date();
  const availableCoupons = coupons.filter(c => c.isActive && new Date(c.expiresAt) > now);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-4xl">
      <Card>
        <CardHeader><CardTitle>Basic Info</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Input label="Campaign Name" error={errors.name?.message} {...register('name')} />
          <Input label="Description (Optional)" error={errors.description?.message} {...register('description')} />

          <div className="grid grid-cols-2 gap-4">
            <Input label="Start Date & Time" type="datetime-local" error={errors.startDate?.message} {...register('startDate')} />
            <div className="space-y-1">
              <Input label="End Date & Time" type="datetime-local" error={errors.endDate?.message} {...register('endDate')} disabled={!!(couponId && couponId !== 'none')} />
              {couponId && couponId !== 'none' && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <span className="text-[10px]">🔒</span> Auto-set from Coupon
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Status</label>
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Target Audience</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Audience Target</label>
            <Controller
              control={control}
              name="targetType"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue placeholder="Select target" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Customers</SelectItem>
                    <SelectItem value="segment">Specific CRM Segment</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {targetType === 'segment' && (
            <div className="p-4 bg-muted rounded-lg border">
              <label className="block text-sm font-medium mb-1.5">Select Segment</label>
              <Controller
                control={control}
                name="targetSegment"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue placeholder="Select CRM Segment" /></SelectTrigger>
                    <SelectContent>
                      {segments.map((s) => (
                        <SelectItem key={s.segment} value={s.segment} className="capitalize">
                          {s.segment}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.targetSegment && <p className="text-destructive text-sm mt-1">{errors.targetSegment.message}</p>}

              {selectedSegment && (
                <p className="mt-2 text-sm text-muted-foreground font-medium">
                  Estimated Customers: {selectedSegment.count}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Products Target</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Product Scope</label>
            <Controller
              control={control}
              name="productTargetType"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue placeholder="Select products" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Products</SelectItem>
                    <SelectItem value="category">Specific Category</SelectItem>
                    <SelectItem value="products">Specific Products</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {productTargetType === 'category' && (
            <Input label="Category ID" error={errors.categoryId?.message} {...register('categoryId')} placeholder="Enter category UUID (mock for now)" />
          )}

          {productTargetType === 'products' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Selected Products ({watch('productIds')?.length || 0})</p>
                <Button type="button" variant="outline" size="sm" onClick={() => setIsProductModalOpen(true)}>
                  + Select Products
                </Button>
              </div>

              {selectedProductDetails.length > 0 && (
                <div className="space-y-2 border rounded-md divide-y">
                  {selectedProductDetails.map(p => (
                    <div key={p._id} className="flex items-center justify-between p-2 text-sm">
                      <div className="flex items-center gap-2">
                        {p.thumbnail && <img src={p.thumbnail} alt="" className="w-8 h-8 rounded object-cover" />}
                        <span>{p.name}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          const currentIds = watch('productIds') || [];
                          setValue('productIds', currentIds.filter(id => id !== p._id));
                          setSelectedProductDetails(prev => prev.filter(item => item._id !== p._id));
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {errors.productIds && <p className="text-destructive text-sm mt-1">{errors.productIds.message}</p>}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Linked Coupon (Optional)</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Select Existing Coupon</label>
            <Controller
              control={control}
              name="couponId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue placeholder="Select a coupon" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {availableCoupons.map((c) => (
                      <SelectItem key={c._id || c.id} value={c._id || c.id || ''}>
                        {c.code} ({c.discountType === 'percentage' ? `${c.discount}%` : `₹${c.discount}`})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {selectedCoupon && (
            <div className="p-4 bg-muted rounded-lg border grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Discount:</span>{' '}
                <span className="font-semibold">{selectedCoupon.discountType === 'percentage' ? `${selectedCoupon.discount}%` : `₹${selectedCoupon.discount}`} OFF</span>
              </div>
              <div>
                <span className="text-muted-foreground">Min Order:</span>{' '}
                <span className="font-semibold">₹{selectedCoupon.minOrderAmount}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Usage Limit:</span>{' '}
                <span className="font-semibold">{selectedCoupon.usageLimit} uses</span>
              </div>
              <div>
                <span className="text-muted-foreground">Expiry:</span>{' '}
                <span className="font-semibold">{new Date(selectedCoupon.expiresAt).toLocaleDateString()}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-4 justify-end">
        <Button type="button" variant="outline" onClick={() => router.push('/coupons?tab=campaigns')}>Cancel</Button>
        <Button type="submit" loading={loading}>Save Campaign</Button>
      </div>

      <ProductSelectorModal
        open={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        selectedIds={watch('productIds') || []}
        onConfirm={(ids, products) => {
          setValue('productIds', ids);

          // Merge newly selected products with existing ones to avoid losing details
          setSelectedProductDetails(prev => {
            const newDetails = [...prev];
            products.forEach(p => {
              if (!newDetails.find(item => item._id === p._id)) {
                newDetails.push(p);
              }
            });
            // Filter out any that were unselected
            return newDetails.filter(p => ids.includes(p._id));
          });
        }}
      />
    </form>
  );
}
