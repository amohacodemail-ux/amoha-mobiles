import { z } from 'zod';

export const createOrderSchema = z.object({
  body: z.object({
    shippingAddress: z.object({
      fullName: z.string().min(2, 'Full name is required'),
      phone: z.string().min(10, 'Phone is required'),
      addressLine1: z.string().min(5, 'Address is required'),
      addressLine2: z.string().optional(),
      city: z.string().min(2, 'City is required'),
      state: z.string().min(2, 'State is required'),
      pincode: z.string().min(6).max(6, 'Valid pincode is required'),
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
