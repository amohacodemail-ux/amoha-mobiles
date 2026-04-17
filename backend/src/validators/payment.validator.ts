import { z } from 'zod';

const optionalCouponSchema = z.preprocess(
  (value) => {
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    return trimmed.length === 0 ? undefined : trimmed;
  },
  z.string().trim().min(1).max(30).optional(),
);

export const createRazorpayOrderSchema = z.object({
  body: z.object({
    // Optional coupon — strip whitespace, uppercase enforced server-side
    couponCode: optionalCouponSchema,
  }),
});

const shippingAddressSchema = z.object({
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
  // Exactly 6 numeric digits
  pincode: z
    .string()
    .trim()
    .regex(/^[1-9][0-9]{5}$/, 'Enter a valid 6-digit pincode'),
  country: z.string().optional(),
  type: z.enum(['home', 'work', 'other']).optional(),
});

export const verifyPaymentSchema = z.object({
  body: z.object({
    // Razorpay order IDs always start with 'order_'
    razorpayOrderId: z
      .string()
      .trim()
      .regex(/^order_[A-Za-z0-9]{14,}$/, 'Invalid Razorpay order ID format'),
    // Razorpay payment IDs always start with 'pay_'
    razorpayPaymentId: z
      .string()
      .trim()
      .regex(/^pay_[A-Za-z0-9]{14,}$/, 'Invalid Razorpay payment ID format'),
    // HMAC-SHA256 produces exactly 64 lowercase hex characters
    razorpaySignature: z
      .string()
      .trim()
      .regex(/^[a-f0-9]{64}$/, 'Invalid Razorpay signature format'),
    shippingAddress: shippingAddressSchema,
    couponCode: optionalCouponSchema,
  }),
});

