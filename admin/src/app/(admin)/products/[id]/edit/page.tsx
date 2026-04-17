'use client';
import { ProductForm } from '@/components/shared/product-form';

export default function EditProductPage({ params }: { params: { id: string } }) {
  return <ProductForm productId={params.id} />;
}
