import { z } from 'zod';

// ─── Pagination ───────────────────────────────────────────────────────────────
export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(25),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});
export type PaginationInput = z.infer<typeof PaginationSchema>;

export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    data: z.array(itemSchema),
    meta: z.object({
      total: z.number(),
      page: z.number(),
      limit: z.number(),
      totalPages: z.number(),
      hasNext: z.boolean(),
      hasPrev: z.boolean(),
    }),
  });

// ─── API Error ────────────────────────────────────────────────────────────────
export const ApiErrorSchema = z.object({
  success: z.literal(false),
  message: z.string(),
  requestId: z.string(),
  code: z.string().optional(),
  details: z.unknown().optional(),
});
export type ApiError = z.infer<typeof ApiErrorSchema>;

// ─── API Success ──────────────────────────────────────────────────────────────
export const ApiSuccessSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
    message: z.string().optional(),
  });

// ─── Alert Severity ───────────────────────────────────────────────────────────
export const AlertSeverityEnum = z.enum(['CRITICAL', 'WARNING', 'INFO', 'OPPORTUNITY']);
export type AlertSeverity = z.infer<typeof AlertSeverityEnum>;

// ─── Movement Types ───────────────────────────────────────────────────────────
export const MovementTypeEnum = z.enum([
  'receipt',
  'issue',
  'transfer_out',
  'transfer_in',
  'adjustment',
  'return',
  'damage',
  'expiry',
  'reservation',
  'release',
  'cycle_count',
]);
export type MovementType = z.infer<typeof MovementTypeEnum>;

// ─── PO Status ────────────────────────────────────────────────────────────────
export const POStatusEnum = z.enum([
  'draft',
  'pending_approval',
  'approved',
  'sent_to_supplier',
  'confirmed',
  'shipped',
  'partially_received',
  'received',
  'closed',
  'cancelled',
]);
export type POStatus = z.infer<typeof POStatusEnum>;

// ─── PR Status ────────────────────────────────────────────────────────────────
export const PRStatusEnum = z.enum(['draft', 'pending', 'approved', 'rejected', 'fulfilled']);
export type PRStatus = z.infer<typeof PRStatusEnum>;

// ─── Forecast Horizons ────────────────────────────────────────────────────────
export const ForecastHorizonEnum = z.enum(['7', '14', '30', '60', '90']);
export type ForecastHorizon = z.infer<typeof ForecastHorizonEnum>;

// ─── Confidence Labels ────────────────────────────────────────────────────────
export const ConfidenceLabelEnum = z.enum(['HIGH', 'MEDIUM', 'LOW', 'VERY_LOW']);
export type ConfidenceLabel = z.infer<typeof ConfidenceLabelEnum>;

// ─── Recommendation Types ─────────────────────────────────────────────────────
export const RecommendationTypeEnum = z.enum([
  'reorder',
  'transfer',
  'dispose',
  'expedite',
  'discount',
  'bundle',
  'return_to_supplier',
]);
export type RecommendationType = z.infer<typeof RecommendationTypeEnum>;

// ─── INR Formatting Utilities ─────────────────────────────────────────────────
export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatLakhCrore(amount: number): string {
  if (amount >= 10_000_000) return `₹${(amount / 10_000_000).toFixed(2)} Cr`;
  if (amount >= 100_000) return `₹${(amount / 100_000).toFixed(2)} L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount.toFixed(0)}`;
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-IN').format(n);
}
