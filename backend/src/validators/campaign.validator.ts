import { z } from 'zod';

export const createCampaignValidator = z.object({
  body: z.object({
    name: z.string().min(1, 'Campaign name is required'),
    description: z.string().optional(),

    targetType: z.enum(['all', 'segment']),
    targetSegment: z.string().optional(),

    productTargetType: z.enum(['all', 'products', 'category']),
    productIds: z.array(z.string()).optional(),
    categoryId: z.union([z.string().uuid('Invalid categoryId format'), z.literal(''), z.null()]).optional().transform(e => e === '' ? null : e),

    couponId: z.union([z.string().uuid('Invalid couponId format'), z.literal(''), z.null()]).optional().transform(e => e === '' ? null : e),

    startDate: z.string().datetime({ offset: true }).or(z.string()),
    endDate: z.string().datetime({ offset: true }).or(z.string()),

    status: z.enum(['draft', 'scheduled', 'active', 'paused']).optional().default('draft')
  }).refine((data) => {
    if (data.targetType === 'segment' && !data.targetSegment) return false;
    return true;
  }, { message: 'targetSegment is required when targetType is segment', path: ['targetSegment'] })
    .refine((data) => {
      if (new Date(data.endDate) <= new Date(data.startDate)) return false;
      return true;
    }, { message: 'endDate must be after startDate', path: ['endDate'] })
});

export const updateCampaignValidator = z.object({
  params: z.object({
    id: z.string().uuid('Invalid campaign ID')
  }),
  body: z.object({
    name: z.string().min(1, 'Campaign name cannot be empty').optional(),
    description: z.string().optional(),

    targetType: z.enum(['all', 'segment']).optional(),
    targetSegment: z.string().optional(),

    productTargetType: z.enum(['all', 'products', 'category']).optional(),
    productIds: z.array(z.string()).optional(),
    categoryId: z.union([z.string().uuid('Invalid categoryId format'), z.literal(''), z.null()]).optional().transform(e => e === '' ? null : e),

    couponId: z.union([z.string().uuid('Invalid couponId format'), z.literal(''), z.null()]).optional().transform(e => e === '' ? null : e),

    startDate: z.string().datetime({ offset: true }).or(z.string()).optional(),
    endDate: z.string().datetime({ offset: true }).or(z.string()).optional(),

    status: z.enum(['draft', 'scheduled', 'active', 'paused', 'completed', 'archived']).optional()
  })
});

export const idValidator = z.object({
  params: z.object({
    id: z.string().uuid('Invalid campaign ID')
  })
});

export const getCampaignsValidator = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
    status: z.string().optional(),
    search: z.string().optional()
  }).optional()
});
