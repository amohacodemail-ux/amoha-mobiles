import { z } from 'zod';

export const addToCartSchema = z.object({
  body: z.object({
    productId: z.string().uuid('Invalid product ID'),
    quantity: z.coerce.number().int().min(1).default(1),
    color: z.string().optional(),
  }),
});

export const updateCartItemSchema = z.object({
  params: z.object({
    itemId: z.string().uuid('Invalid item ID'),
  }),
  body: z.object({
    quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1'),
  }),
});

export const applyCouponSchema = z.object({
  body: z.object({
    code: z.string().min(1, 'Coupon code is required'),
  }),
});
