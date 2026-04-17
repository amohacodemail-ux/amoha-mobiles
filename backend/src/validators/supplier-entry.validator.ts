import { z } from 'zod';

export const createEntrySchema = z.object({
  body: z.object({
    itemName: z.string().min(1, 'Item name is required').max(255),
    quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1'),
    price: z.coerce.number().min(0, 'Price must be >= 0').optional(),
    note: z.string().max(2000).optional(),
  }),
});

export const convertEntrySchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Product name is required').max(255),
    description: z.string().optional(),
    sellingPrice: z.coerce.number().min(0, 'Selling price must be >= 0'),
    originalPrice: z.coerce.number().min(0).optional(),
    categoryId: z.string().uuid('Invalid category ID').optional().nullable(),
    brandId: z.string().uuid('Invalid brand ID').optional().nullable(),
    images: z.array(z.string()).optional(),
    thumbnail: z.string().optional().nullable(),
  }),
});

export const rejectEntrySchema = z.object({
  body: z.object({
    reason: z.string().min(1, 'Rejection reason is required').max(1000),
  }),
});
