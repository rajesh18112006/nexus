import { z } from 'zod';

export const OrganizationSchema = z.object({
  _id: z.string(),
  name: z.string().min(2).max(100),
  slug: z.string(),
  currency: z.string().default('INR'),
  locale: z.string().default('en-IN'),
  taxConfig: z.object({
    gstEnabled: z.boolean().default(true),
    defaultGstRate: z.number().default(18),
    pan: z.string().optional(),
    gstin: z.string().optional(),
  }),
  settings: z.object({
    fiscalYearStart: z.number().min(1).max(12).default(4), // April
    holdingCostPct: z.number().default(20),                // 20% annual
    defaultServiceLevel: z.number().default(95),           // 95%
    morningBriefEnabled: z.boolean().default(true),
    morningBriefTime: z.string().default('06:00'),
    timezone: z.string().default('Asia/Kolkata'),
  }),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Organization = z.infer<typeof OrganizationSchema>;
