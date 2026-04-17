import { z } from 'zod';

export const createSupplierSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').optional().or(z.literal('')),
    code: z.string().optional(),
    email: z.string().email('Invalid email').optional().or(z.literal('')),
    password: z.string().min(6, 'Password must be at least 6 characters').optional().or(z.literal('')),
    phone: z.string().optional(),
    contactPerson: z.string().optional(),
    addressLine1: z.string().optional(),
    addressLine2: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    pincode: z.string().optional(),
    country: z.string().optional(),
    gstNumber: z.string().optional(),
    panNumber: z.string().optional(),
    bankName: z.string().optional(),
    bankAccountNumber: z.string().optional(),
    bankIfsc: z.string().optional(),
    paymentTerms: z.string().optional(),
    status: z.enum(['active', 'inactive', 'blacklisted']).optional(),
    notes: z.string().optional(),
  }),
});

export const updateSupplierSchema = z.object({
  body: createSupplierSchema.shape.body.partial(),
});

export const updateSupplierSelfSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').optional().or(z.literal('')),
    phone: z.string().optional(),
    contactPerson: z.string().optional(),
    addressLine1: z.string().optional(),
    addressLine2: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    pincode: z.string().optional(),
    country: z.string().optional(),
    gstNumber: z.string().optional(),
    panNumber: z.string().optional(),
    bankName: z.string().optional(),
    bankAccountNumber: z.string().optional(),
    bankIfsc: z.string().optional(),
    paymentTerms: z.string().optional(),
    notes: z.string().optional(),
  }),
});

export const assignProductSchema = z.object({
  body: z.object({
    productId: z.string().uuid('Invalid product ID'),
    unitCost: z.coerce.number().min(0, 'Unit cost must be >= 0'),
    leadTimeDays: z.coerce.number().int().min(0).optional(),
    minOrderQty: z.coerce.number().int().min(1).optional(),
    isPreferred: z.boolean().optional(),
  }),
});

export const createPurchaseOrderSchema = z.object({
  body: z.object({
    supplierId: z.string().uuid('Invalid supplier ID'),
    status: z.enum(['draft', 'sent', 'confirmed']).optional(),
    expectedDelivery: z.string().optional(),
    taxAmount: z.coerce.number().min(0).optional(),
    shippingCost: z.coerce.number().min(0).optional(),
    notes: z.string().optional(),
    items: z.array(z.object({
      productId: z.string().uuid('Invalid product ID'),
      quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1'),
      unitCost: z.coerce.number().min(0, 'Unit cost must be >= 0'),
    })).min(1, 'At least one item is required'),
  }),
});

export const receivePurchaseOrderSchema = z.object({
  body: z.object({
    items: z.array(z.object({
      itemId: z.string().uuid('Invalid item ID'),
      receivedQty: z.coerce.number().int().min(0, 'Received qty must be >= 0'),
    })).min(1, 'At least one item is required'),
  }),
});
