import { z } from 'zod';

export const addressSchema = z.object({
  body: z.object({
    fullName: z.string().min(2, 'Full name is required'),
    phone: z.string().min(10, 'Phone must be at least 10 digits'),
    addressLine1: z.string().min(5, 'Address line 1 is required'),
    addressLine2: z.string().optional(),
    city: z.string().min(2, 'City is required'),
    state: z.string().min(2, 'State is required'),
    pincode: z.string().min(6, 'Valid pincode is required').max(6),
    country: z.string().optional(),
    isDefault: z.boolean().optional(),
    type: z.enum(['home', 'work', 'other']).optional(),
  }),
});

export const updateAddressSchema = z.object({
  params: z.object({
    addressId: z.string().uuid('Invalid address ID'),
  }),
  body: z.object({
    fullName: z.string().min(2).optional(),
    phone: z.string().min(10).optional(),
    addressLine1: z.string().min(5).optional(),
    addressLine2: z.string().optional(),
    city: z.string().min(2).optional(),
    state: z.string().min(2).optional(),
    pincode: z.string().min(6).max(6).optional(),
    country: z.string().optional(),
    isDefault: z.boolean().optional(),
    type: z.enum(['home', 'work', 'other']).optional(),
  }),
});
