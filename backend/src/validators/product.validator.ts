import { z } from 'zod';

const emptyToUndefined = (val: unknown) => (val === '' || val === null) ? undefined : val;

export const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Product name is required'),
    slug: z.string().optional(),
    brand: z.preprocess(emptyToUndefined, z.string({ required_error: 'Brand is required' }).uuid('Invalid brand ID')),
    category: z.preprocess(emptyToUndefined, z.string({ required_error: 'Category is required' }).uuid('Invalid category ID')),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    shortDescription: z.string().optional(),
    price: z.coerce.number().min(0, 'Price must be positive'),
    originalPrice: z.coerce.number().min(0, 'Original price must be positive'),
    purchasePrice: z.coerce.number().min(0, 'Purchase price cannot be negative').optional(),
    discount: z.coerce.number().min(0).max(100).optional(),
    images: z.array(z.string()).min(1, 'At least one image is required'),
    thumbnail: z.string().min(1, 'Thumbnail is required'),
    specifications: z.record(z.union([z.string(), z.boolean(), z.number()])).optional(),
    stock: z.coerce.number().int().min(0).optional(),
    tags: z.array(z.string()).optional(),
    isFeatured: z.boolean().optional(),
    isTrending: z.boolean().optional(),
    colors: z.array(z.string()).optional(),
    warranty: z.string().optional(),
  }),
});

export const updateProductSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid product ID'),
  }),
  body: createProductSchema.shape.body.partial().extend({
    brand: z.preprocess(emptyToUndefined, z.string().uuid('Invalid brand ID').optional()),
    category: z.preprocess(emptyToUndefined, z.string().uuid('Invalid category ID').optional()),
  }),
});

export const reviewSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid product ID'),
  }),
  body: z.object({
    rating: z.coerce.number().int().min(1).max(5),
    title: z.string().optional().default(''),
    comment: z.string().min(5, 'Review comment must be at least 5 characters'),
  }),
});
