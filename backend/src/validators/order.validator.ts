import { z } from 'zod';

export const createOrderSchema = z.object({
  body: z.object({
    shippingAddress: z.object({
      fullName: z.string().trim().min(2, 'Full name is required').max(80, 'Name too long'),
      // Indian mobile numbers: 10 digits, optionally prefixed with +91 or 0
      phone: z
        .string()
        .trim()
        .regex(/^(?:\+91|0)?[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'),
      addressLine1: z.string().trim().min(5, 'Address is required').max(200, 'Address too long'),
      addressLine2: z.string().trim().max(200).optional(),
      city: z.string().trim().min(2, 'City is required').max(100),
      state: z.string().trim().min(2, 'State is required').max(100),
      // Exactly 6 numeric digits, no leading zero
      pincode: z
        .string()
        .trim()
        .regex(/^[1-9][0-9]{5}$/, 'Enter a valid 6-digit pincode'),
      country: z.string().optional(),
      type: z.enum(['home', 'work', 'other']).optional(),
    }),
    paymentMethod: z.enum(['cod', 'razorpay'], {
      errorMap: () => ({ message: 'Payment method must be cod or razorpay' }),
    }),
    couponCode: z.string().optional(),
  }),
});

export const updateOrderStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid order ID'),
  }),
  body: z.object({
    orderStatus: z.enum([
      'placed', 'confirmed', 'processing', 'shipped',
      'out_for_delivery', 'delivered', 'cancelled', 'returned',
    ]),
    message: z.string().optional(),
  }),
});

export const cancelOrderSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid order ID'),
  }),
  body: z.object({
    reason: z.string().min(5, 'Cancellation reason is required'),
  }),
});
