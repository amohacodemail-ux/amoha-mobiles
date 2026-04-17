import { z } from 'zod';

export const createReturnSchema = z.object({
  body: z.object({
    orderId: z.string().uuid('Invalid order ID'),
    items: z.array(z.object({
      product: z.string().uuid('Invalid product ID'),
      quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1'),
      reason: z.enum(['defective', 'wrong_item', 'not_as_described', 'damaged_in_transit', 'size_fit_issue', 'changed_mind', 'better_price_elsewhere', 'other']),
    })).min(1, 'At least one item is required'),
    returnType: z.enum(['return', 'replacement', 'refund']),
    reason: z.enum(['defective', 'wrong_item', 'not_as_described', 'damaged_in_transit', 'size_fit_issue', 'changed_mind', 'better_price_elsewhere', 'other']),
    description: z.string().min(1, 'Description is required').max(2000),
    refundMethod: z.enum(['original_payment', 'wallet', 'bank_transfer']).optional(),
    pickupAddress: z.object({
      fullName: z.string().min(1).max(100),
      phone: z.string().min(10).max(15),
      addressLine1: z.string().min(1).max(200),
      addressLine2: z.string().max(200).optional(),
      city: z.string().min(1).max(100),
      state: z.string().min(1).max(100),
      pincode: z.string().min(6).max(6),
    }),
  }),
});

export const updateReturnStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid return ID'),
  }),
  body: z.object({
    status: z.enum(['requested', 'approved', 'rejected', 'pickup_scheduled', 'picked_up', 'received', 'inspected', 'refund_initiated', 'refund_completed', 'replacement_shipped', 'closed']),
    message: z.string().max(500).optional(),
    adminNotes: z.string().max(1000).optional(),
  }),
});
