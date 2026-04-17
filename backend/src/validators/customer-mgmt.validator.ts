import { z } from 'zod';

export const updateSegmentSchema = z.object({
  body: z.object({
    segment: z.enum(['vip', 'frequent', 'regular', 'inactive', 'new']),
  }),
});

export const addTagSchema = z.object({
  body: z.object({
    tag: z.string().min(1, 'Tag is required').max(100),
  }),
});

export const addNoteSchema = z.object({
  body: z.object({
    note: z.string().min(1, 'Note is required'),
    type: z.enum(['note', 'call', 'email', 'meeting', 'follow_up', 'complaint']).optional(),
    isPinned: z.boolean().optional(),
  }),
});

export const createFraudFlagSchema = z.object({
  body: z.object({
    userId: z.string().uuid('Invalid user ID'),
    flagType: z.enum(['multiple_failed_payments', 'excessive_returns', 'suspicious_activity', 'chargebacks', 'address_mismatch', 'velocity_abuse']),
    severity: z.enum(['low', 'medium', 'high', 'critical']),
    description: z.string().min(5, 'Description must be at least 5 characters'),
  }),
});

export const resolveFraudFlagSchema = z.object({
  body: z.object({
    resolutionNote: z.string().min(5, 'Resolution note must be at least 5 characters'),
  }),
});
