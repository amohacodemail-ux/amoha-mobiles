'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { ArrowLeft, X, Plus, Loader2, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@/components/shared/page-header';
import { MultiImageUploader } from '@/components/shared/image-uploader';
import { BarcodeVisual } from '@/components/shared/barcode-visual';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { productService } from '@/services/product.service';
import { categoryService } from '@/services/category.service';
import { brandService } from '@/services/brand.service';
import { barcodeService, type BarcodeType } from '@/services/barcode.service';
import type { Category, Brand } from '@/types';

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  brand: z.string().min(1, 'Brand is required'),
  category: z.string().min(1, 'Category is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  shortDescription: z.string().optional(),
  price: z.coerce.number().min(1, 'Price must be > 0'),
  originalPrice: z.coerce.number().min(1, 'Original price must be > 0'),
  purchasePrice: z.coerce.number().min(0, 'Purchase price cannot be negative').optional(),
  stock: z.coerce.number().min(0, 'Stock cannot be negative'),
  warranty: z.string().optional(),
  tags: z.string().optional(),
  colors: z.string().optional(),
  isFeatured: z.boolean().default(false),
  isTrending: z.boolean().default(false),
  barcode: z.string().optional(),
  barcodeType: z.enum(['EAN13', 'EAN8', 'UPCA', 'CODE128', 'CODE39']).default('EAN13'),
});
type FormData = z.infer<typeof schema>;

type OptionLike = {
  _id?: string;
  id?: string;
  name?: string;
  slug?: string;
};

const resolveOptionId = (value: string | undefined, items: OptionLike[]) => {
  if (!value) return '';
  const normalized = value.trim().toLowerCase();
  const match = items.find((item) =>
    [item._id, item.id, item.name, item.slug]
      .filter(Boolean)
      .some((candidate) => String(candidate).trim().toLowerCase() === normalized),
  );
  return String(match ? (match.id || match._id || value) : value);
};

const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

interface Props { productId?: string }

const BARCODE_TYPES = [
  { value: 'EAN13', label: 'EAN-13 (Retail)', description: '13-digit retail barcode' },
  { value: 'CODE128', label: 'Code 128', description: 'Alphanumeric barcode' },
  { value: 'EAN8', label: 'EAN-8', description: '8-digit small product barcode' },
  { value: 'UPCA', label: 'UPC-A', description: '12-digit North America barcode' },
  { value: 'CODE39', label: 'Code 39', description: 'Industrial barcode' },
];

export function ProductForm({ productId }: Props) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [specs, setSpecs] = useState<{ key: string; value: string }[]>([{ key: '', value: '' }]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(!!productId);
  const [imagesUploading, setImagesUploading] = useState(false);
  const [barcodePreview, setBarcodePreview] = useState<string>('');
  const [regeneratingBarcode, setRegeneratingBarcode] = useState(false);

  const { register, handleSubmit, control, watch, reset, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { brand: '', category: '', isFeatured: false, isTrending: false, barcodeType: 'EAN13' },
  });

  const barcodeType = watch('barcodeType');
  const barcodeValue = watch('barcode');

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load categories and brands FIRST
        const [cats, brds] = await Promise.all([categoryService.getAll(), brandService.getAll()]);
        setCategories(Array.isArray(cats) ? cats : []);
        setBrands(Array.isArray(brds) ? brds : []);

        // THEN load product data so Select options exist when values are set
        if (productId) {
          const p = await productService.getById(productId);
          reset({
            name: p.name,
            brand: String((p as any).brandId || (p.brand as any)?.id || (p.brand as any)?._id || p.brand || ''),
            category: String((p as any).categoryId || (p.category as any)?.id || (p.category as any)?._id || p.category || ''),
            description: p.description,
            shortDescription: p.shortDescription,
            price: p.price,
            originalPrice: p.originalPrice,
            purchasePrice: (p as any).purchasePrice || 0,
            stock: p.stock,
            warranty: p.warranty || '',
            tags: p.tags?.join(', ') || '',
            colors: p.colors?.join(', ') || '',
            isFeatured: p.isFeatured,
            isTrending: p.isTrending,
            barcode: p.barcode || '',
            barcodeType: (p.barcodeType as BarcodeType) || 'EAN13',
          });
          setBarcodePreview(p.barcode || '');
          setExistingImages(p.images || []);
          const specEntries = p.specifications
            ? Object.entries(p.specifications).filter(([, v]) => v !== '' && v !== false).map(([key, value]) => ({ key, value: String(value) }))
            : [];
          setSpecs(specEntries.length ? specEntries : [{ key: '', value: '' }]);
        }
      } catch (err) {
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [productId, reset]);

  const handleRegenerateBarcode = async () => {
    if (!productId) {
      // For new products, just generate a preview
      toast.success('Barcode will be auto-generated on create');
      return;
    }

    setRegeneratingBarcode(true);
    try {
      const result = await barcodeService.regenerate(productId, {
        type: barcodeType,
      });
      setValue('barcode', result.barcode);
      setBarcodePreview(result.barcode);
      toast.success('Barcode regenerated successfully');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to regenerate barcode');
    } finally {
      setRegeneratingBarcode(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    if (imagesUploading) {
      toast.error('Please wait for images to finish uploading');
      return;
    }
    if (existingImages.length === 0) {
      toast.error('Please upload at least one product image');
      return;
    }
    setSubmitting(true);
    try {
      const specsObj = Object.fromEntries(specs.filter((s) => s.key).map((s) => [s.key, s.value]));
      const discount = data.originalPrice > 0
        ? Math.round(((data.originalPrice - data.price) / data.originalPrice) * 100)
        : 0;
      const brandId = resolveOptionId(data.brand, brands);
      const categoryId = resolveOptionId(data.category, categories);

      if (!isUuid(brandId) || !isUuid(categoryId)) {
        toast.error('Please select a valid brand and category');
        return;
      }

      const payload: any = {
        name: data.name,
        slug: data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        brand: brandId,
        category: categoryId,
        description: data.description,
        shortDescription: data.shortDescription || '',
        price: data.price,
        originalPrice: data.originalPrice,
        purchasePrice: data.purchasePrice || 0,
        discount: Math.max(0, discount),
        stock: data.stock,
        specifications: specsObj,
        tags: data.tags ? data.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
        colors: data.colors ? data.colors.split(',').map((c: string) => c.trim()).filter(Boolean) : [],
        isFeatured: data.isFeatured,
        isTrending: data.isTrending,
        warranty: data.warranty || '',
        images: existingImages.length > 0 ? existingImages : [],
        thumbnail: existingImages[0] || '',
        barcode: data.barcode || undefined,
        barcodeType: data.barcodeType,
      };

      if (productId) {
        await productService.update(productId, payload);
        toast.success('Product updated successfully');
      } else {
        await productService.create(payload);
        toast.success('Product created successfully');
      }
      router.push('/products');
    } catch (err: any) {
      const errData = err?.response?.data;
      if (errData?.errors && typeof errData.errors === 'object') {
        const fieldErrors = Object.entries(errData.errors).map(([k, v]) => `${k}: ${v}`).join(', ');
        toast.error(`Validation failed — ${fieldErrors}`, { duration: 6000 });
      } else {
        toast.error(errData?.message ?? 'Failed to save product');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader title={productId ? 'Edit Product' : 'Add Product'} description={productId ? 'Update product details' : 'Create a new product listing'}>
        <Link href="/products"><Button variant="outline"><ArrowLeft className="h-4 w-4" />Back</Button></Link>
      </PageHeader>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Main Details */}
          <div className="xl:col-span-2 space-y-6">
            <Card>
              <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <Input label="Product Name" placeholder="e.g. Samsung Galaxy S24 Ultra" error={errors.name?.message} {...register('name')} />
                <Textarea label="Description" placeholder="Full product description..." rows={4} error={errors.description?.message} {...register('description')} />
                <Textarea label="Short Description" placeholder="Brief summary..." rows={2} error={errors.shortDescription?.message} {...register('shortDescription')} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Brand <span className="text-destructive">*</span></label>
                    <Controller
                      name="brand"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value || ''}>
                          <SelectTrigger error={errors.brand?.message}><SelectValue placeholder="Select brand" /></SelectTrigger>
                          <SelectContent>
                            {brands.map((b) => {
                              const brandValue = String((b as any).id || b._id || (b as any).slug || b.name || '');
                              if (!brandValue) return null;
                              return <SelectItem key={brandValue} value={brandValue}>{b.name}</SelectItem>;
                            })}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.brand && <p className="mt-1 text-xs text-destructive">{errors.brand.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Category <span className="text-destructive">*</span></label>
                    <Controller
                      name="category"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value || ''}>
                          <SelectTrigger error={errors.category?.message}><SelectValue placeholder="Select category" /></SelectTrigger>
                          <SelectContent>
                            {categories.map((c) => {
                              const categoryValue = String((c as any).id || c._id || (c as any).slug || c.name || '');
                              if (!categoryValue) return null;
                              return <SelectItem key={categoryValue} value={categoryValue}>{c.name}</SelectItem>;
                            })}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.category && <p className="mt-1 text-xs text-destructive">{errors.category.message}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input label="Sale Price" type="number" error={errors.price?.message} {...register('price')} />
                  <Input label="Original Price" type="number" error={errors.originalPrice?.message} {...register('originalPrice')} />
                  <Input label="Purchase Price" type="number" placeholder="Cost price" error={errors.purchasePrice?.message} {...register('purchasePrice')} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Stock Quantity" type="number" error={errors.stock?.message} {...register('stock')} />
                </div>
                <Input label="Tags (comma separated)" placeholder="smartphone, 5g, flagship" {...register('tags')} />
                <Input label="Colors (comma separated)" placeholder="Black, Silver, Gold" {...register('colors')} />
                <Input label="Warranty" placeholder="e.g. 1 Year, 6 Months" {...register('warranty')} />

                {/* Barcode Section */}
                <div className="border-t pt-4 mt-4">
                  <h4 className="text-sm font-medium mb-3">Barcode Information</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">Barcode Type</label>
                      <Controller
                        name="barcodeType"
                        control={control}
                        render={({ field }) => (
                          <Select onValueChange={field.onChange} value={field.value || 'EAN13'}>
                            <SelectTrigger><SelectValue placeholder="Select barcode type" /></SelectTrigger>
                            <SelectContent>
                              {BARCODE_TYPES.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  <div>
                                    <div>{type.label}</div>
                                    <div className="text-xs text-muted-foreground">{type.description}</div>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">Barcode</label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Auto-generated if empty"
                          {...register('barcode')}
                          value={barcodeValue || ''}
                        />
                        {productId && (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={handleRegenerateBarcode}
                            disabled={regeneratingBarcode}
                            title="Regenerate barcode"
                          >
                            <RefreshCw className={`h-4 w-4 ${regeneratingBarcode ? 'animate-spin' : ''}`} />
                          </Button>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Leave empty to auto-generate {barcodeType === 'EAN13' ? 'EAN-13' : barcodeType} barcode
                      </p>
                    </div>
                  </div>

                  {/* Barcode Preview */}
                  {barcodeValue && (
                    <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-2">Preview:</p>
                      <div className="flex items-center gap-4">
                        <BarcodeVisual
                          code={barcodeValue}
                          type={barcodeType as any}
                          compact
                          height={40}
                        />
                        <code className="text-sm font-mono bg-background px-2 py-1 rounded">
                          {barcodeValue}
                        </code>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Specifications */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Specifications</CardTitle>
                  <Button type="button" variant="outline" size="sm" onClick={() => setSpecs((p) => [...p, { key: '', value: '' }])}>
                    <Plus className="h-3.5 w-3.5" /> Add Row
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {specs.map((spec, i) => (
                  <div key={i} className="flex gap-2">
                    <Input placeholder="e.g. RAM" value={spec.key} onChange={(e) => setSpecs((p) => p.map((s, idx) => idx === i ? { ...s, key: e.target.value } : s))} />
                    <Input placeholder="e.g. 8GB" value={spec.value} onChange={(e) => setSpecs((p) => p.map((s, idx) => idx === i ? { ...s, value: e.target.value } : s))} />
                    <Button type="button" variant="ghost" size="icon" onClick={() => setSpecs((p) => p.filter((_, idx) => idx !== i))}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Product Images</CardTitle></CardHeader>
              <CardContent>
                <MultiImageUploader
                  value={existingImages}
                  onChange={setExistingImages}
                  folder="products"
                  max={10}
                  onUploadingChange={setImagesUploading}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Visibility</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Featured</p>
                    <p className="text-xs text-muted-foreground">Show on homepage</p>
                  </div>
                  <Controller name="isFeatured" control={control} render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Trending</p>
                    <p className="text-xs text-muted-foreground">Show in trending section</p>
                  </div>
                  <Controller name="isTrending" control={control} render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />} />
                </div>
              </CardContent>
            </Card>

            <Button type="submit" className="w-full" size="lg" loading={submitting || imagesUploading} disabled={submitting || imagesUploading}>
              {imagesUploading ? 'Uploading Images...' : productId ? 'Update Product' : 'Create Product'}
            </Button>
          </div>
        </div>
      </form>
      )}
    </div>
  );
}
