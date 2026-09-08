'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { ImageUploader } from '@/components/shared/image-uploader';

interface SupplierCatalogueFormProps {
  initialData?: any;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export function SupplierCatalogueForm({ initialData, onSubmit, onCancel, isLoading }: SupplierCatalogueFormProps) {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    defaultValues: initialData || {
      productName: '',
      category: '',
      description: '',
      unit: '',
      supplierPrice: '',
      moq: 1,
      availableStock: 0,
      deliveryTimeDays: '',
      status: 'active',
      imageUrl: '',
    }
  });

  // Upload handled by ImageUploader component

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-h-[80vh] overflow-y-auto p-1">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="col-span-2 md:col-span-1 space-y-2">
          <label htmlFor="productName" className="text-sm font-medium">Product Name <span className="text-destructive">*</span></label>
          <Input id="productName" {...register('productName', { required: 'Product name is required' })} />
          {errors.productName && <p className="text-sm text-destructive">{errors.productName.message as string}</p>}
        </div>

        <div className="col-span-2 md:col-span-1 space-y-2">
          <label htmlFor="category" className="text-sm font-medium">Category</label>
          <Input id="category" {...register('category')} />
        </div>

        <div className="col-span-2 space-y-2">
          <label htmlFor="description" className="text-sm font-medium">Description</label>
          <Textarea id="description" {...register('description')} rows={3} />
        </div>

        <div className="space-y-2">
          <label htmlFor="supplierPrice" className="text-sm font-medium">Price (₹) <span className="text-destructive">*</span></label>
          <Input type="number" step="0.01" id="supplierPrice" {...register('supplierPrice', { required: 'Price is required', min: 0 })} />
        </div>

        <div className="space-y-2">
          <label htmlFor="unit" className="text-sm font-medium">Unit (e.g., pcs, box)</label>
          <Input id="unit" {...register('unit')} />
        </div>

        <div className="space-y-2">
          <label htmlFor="moq" className="text-sm font-medium">Minimum Order Qty (MOQ) <span className="text-destructive">*</span></label>
          <Input type="number" id="moq" {...register('moq', { required: 'MOQ is required', min: 1 })} />
        </div>

        <div className="space-y-2">
          <label htmlFor="availableStock" className="text-sm font-medium">Available Stock</label>
          <Input type="number" id="availableStock" {...register('availableStock', { min: 0 })} />
        </div>

        <div className="space-y-2">
          <label htmlFor="deliveryTimeDays" className="text-sm font-medium">Delivery Time (Days)</label>
          <Input type="number" id="deliveryTimeDays" {...register('deliveryTimeDays', { min: 0 })} />
        </div>

        <div className="space-y-2">
          <label htmlFor="status" className="text-sm font-medium">Status</label>
          <Select value={watch('status')} onValueChange={(val) => setValue('status', val)}>
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="col-span-2 space-y-2">
          <label className="text-sm font-medium">Product Image</label>
          <ImageUploader 
            value={watch('imageUrl') || ''} 
            onChange={(url) => setValue('imageUrl', url)} 
            folder="products" 
          />
          <p className="text-xs text-muted-foreground">Upload a clear image of the product. Max size 2MB.</p>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData ? 'Update Product' : 'Add Product'}
        </Button>
      </div>
    </form>
  );
}
