import { z } from 'zod';

export const addStockSchema = z.object({
  body: z.object({
    quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1'),
    notes: z.string().max(1000).optional(),
  }),
});

export const removeStockSchema = z.object({
  body: z.object({
    quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1'),
    notes: z.string().max(1000).optional(),
  }),
});

export const adjustStockSchema = z.object({
  body: z.object({
    newStock: z.coerce.number().int().min(0, 'Stock cannot be negative'),
    notes: z.string().max(1000).optional(),
  }),
});

export const markDamagedSchema = z.object({
  body: z.object({
    quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1'),
    notes: z.string().max(1000).optional(),
  }),
});
