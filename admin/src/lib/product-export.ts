import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import { productService } from '@/services/product.service';
import type { Product } from '@/types';

function resolveName(value: string | { name?: string } | undefined): string {
  if (!value) return '';
  if (typeof value === 'object') return value.name || '';
  return value;
}

function formatSpecs(specs?: Record<string, string | boolean>): string {
  if (!specs || typeof specs !== 'object') return '';
  return Object.entries(specs)
    .filter(([, value]) => value !== '' && value !== false)
    .map(([key, value]) => `${key}: ${value}`)
    .join('; ');
}

function formatDateValue(value?: string): string {
  if (!value) return '';
  try {
    return format(new Date(value), 'dd MMM yyyy, hh:mm a');
  } catch {
    return value;
  }
}

function yesNo(value?: boolean): string {
  return value ? 'Yes' : 'No';
}

export function productToExportRow(product: Product): Record<string, string | number> {
  const purchasePrice = Number((product as any).purchasePrice ?? (product as any).purchase_price ?? 0);
  const sellingPrice = Number(product.price ?? 0);
  const originalPrice = Number(product.originalPrice ?? sellingPrice);
  const profit = sellingPrice - purchasePrice;
  const profitMargin = purchasePrice > 0 ? Math.round((profit / purchasePrice) * 100) : 0;
  const discount = product.discount ?? (originalPrice > sellingPrice
    ? Math.round(((originalPrice - sellingPrice) / originalPrice) * 100)
    : 0);

  return {
    'Product ID': product._id,
    'Product Name': product.name,
    'Slug': product.slug,
    'SKU': product.sku || '',
    'Barcode': product.barcode || '',
    'Barcode Type': product.barcodeType || '',
    'Brand': resolveName(product.brand),
    'Category': resolveName(product.category),
    'Description': product.description || '',
    'Short Description': product.shortDescription || '',
    'Selling Price (₹)': sellingPrice,
    'Original Price (₹)': originalPrice,
    'Purchase Price (₹)': purchasePrice,
    'Discount (%)': discount,
    'Profit (₹)': profit,
    'Profit Margin (%)': profitMargin,
    'Stock Qty': product.stock ?? 0,
    'Stock Status': product.inStock ? 'In Stock' : 'Out of Stock',
    'Active on Storefront': yesNo((product as any).isActive ?? product.inStock !== false),
    'Featured': yesNo(product.isFeatured),
    'Trending': yesNo(product.isTrending),
    'Average Rating': product.ratings ?? 0,
    'Review Count': product.numReviews ?? 0,
    'Tags': (product.tags || []).join(', '),
    'Colors': (product.colors || []).join(', '),
    'Warranty': product.warranty || '',
    'Specifications': formatSpecs(product.specifications),
    'Thumbnail URL': product.thumbnail || '',
    'Image URLs': (product.images || []).join(', '),
    'Created At': formatDateValue(product.createdAt),
    'Updated At': formatDateValue(product.updatedAt),
  };
}

export async function fetchAllProducts(search?: string): Promise<Product[]> {
  const all: Product[] = [];
  let page = 1;
  let totalPages = 1;
  const limit = 100;

  do {
    const response = await productService.getAll({
      page,
      limit,
      search: search || undefined,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
    all.push(...(response.products || []));
    totalPages = response.totalPages ?? 1;
    page += 1;
  } while (page <= totalPages);

  return all;
}

export function downloadProductsExcel(products: Product[], options?: { search?: string }): void {
  const rows = products.map(productToExportRow);
  const exportedAt = format(new Date(), 'dd-MMM-yyyy_HHmm');
  const filename = `amoha-products_${exportedAt}.xlsx`;

  const productsSheet = XLSX.utils.json_to_sheet(rows);
  productsSheet['!cols'] = [
    { wch: 38 }, { wch: 32 }, { wch: 28 }, { wch: 16 }, { wch: 18 }, { wch: 14 },
    { wch: 16 }, { wch: 16 }, { wch: 40 }, { wch: 28 }, { wch: 14 }, { wch: 14 },
    { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 16 }, { wch: 10 }, { wch: 14 },
    { wch: 18 }, { wch: 10 }, { wch: 10 }, { wch: 14 }, { wch: 12 }, { wch: 24 },
    { wch: 18 }, { wch: 14 }, { wch: 36 }, { wch: 40 }, { wch: 50 }, { wch: 22 }, { wch: 22 },
  ];

  const summarySheet = XLSX.utils.json_to_sheet([
    { Field: 'Store', Value: 'AMOHA Mobiles Admin' },
    { Field: 'Export Type', Value: 'Full Product Catalog' },
    { Field: 'Exported At', Value: format(new Date(), 'dd MMM yyyy, hh:mm a') },
    { Field: 'Total Products', Value: products.length },
    { Field: 'In Stock', Value: products.filter((p) => p.inStock).length },
    { Field: 'Out of Stock', Value: products.filter((p) => !p.inStock).length },
    { Field: 'Featured Products', Value: products.filter((p) => p.isFeatured).length },
    { Field: 'Search Filter Applied', Value: options?.search?.trim() || 'None (all products)' },
    { Field: 'Total Stock Units', Value: products.reduce((sum, p) => sum + (p.stock || 0), 0) },
    {
      Field: 'Catalog Value (Selling)',
      Value: products.reduce((sum, p) => sum + (p.price || 0) * (p.stock || 0), 0),
    },
  ]);
  summarySheet['!cols'] = [{ wch: 28 }, { wch: 48 }];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
  XLSX.utils.book_append_sheet(workbook, productsSheet, 'Products');
  XLSX.writeFile(workbook, filename);
}

export async function exportAllProductsToExcel(search?: string): Promise<number> {
  const products = await fetchAllProducts(search);
  downloadProductsExcel(products, { search });
  return products.length;
}
