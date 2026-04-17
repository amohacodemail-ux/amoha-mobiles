import { z } from 'zod';

export const createWarehouseSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    code: z.string().min(2, 'Code must be at least 2 characters'),
    addressLine1: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    pincode: z.string().optional(),
    managerName: z.string().optional(),
    managerPhone: z.string().optional(),
    isActive: z.boolean().optional(),
    isDefault: z.boolean().optional(),
  }),
});

export const updateWarehouseSchema = z.object({
  body: createWarehouseSchema.shape.body.partial(),
});

export const updateStockSchema = z.object({
  body: z.object({
    productId: z.string().uuid('Invalid product ID'),
    quantity: z.coerce.number().int().min(0, 'Quantity must be >= 0'),
    type: z.enum(['in', 'out', 'adjustment', 'return', 'damage']),
    notes: z.string().optional(),
    warehouseId: z.string().uuid('Invalid warehouse ID').optional(),
  }),
});

export const bulkUpdateStockSchema = z.object({
  body: z.object({
    items: z.array(z.object({
      productId: z.string().uuid('Invalid product ID'),
      quantity: z.coerce.number().int().min(0),
      type: z.enum(['in', 'out', 'adjustment', 'return', 'damage']).optional(),
      notes: z.string().optional(),
      warehouseId: z.string().uuid().optional(),
    })).min(1, 'At least one item required'),
  }),
});
