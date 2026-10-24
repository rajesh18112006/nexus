import { z } from 'zod';
import { RiskSeverityEnum } from './forecasting';

// ─── Simulator Schemas ────────────────────────────────────────────────────────
export const SimulationInputSchema = z.object({
  leadTimeIncreaseDays: z.number().min(0).max(60).default(5),
  demandSurgePercent: z.number().min(-50).max(200).default(25),
  priceInflationPercent: z.number().min(-20).max(100).default(10),
  affectedCategory: z.string().optional(),
});
export type SimulationInput = z.infer<typeof SimulationInputSchema>;

// ─── Alerts Schemas ───────────────────────────────────────────────────────────
export const AlertTypeEnum = z.enum(['STOCKOUT_RISK', 'PO_OVERDUE', 'SUPPLIER_DELAY', 'DEAD_STOCK', 'PRICE_VARIANCE']);
export type AlertType = z.infer<typeof AlertTypeEnum>;

export const AlertSchema = z.object({
  _id: z.string(),
  type: AlertTypeEnum,
  severity: RiskSeverityEnum,
  title: z.string(),
  message: z.string(),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  isResolved: z.boolean().default(false),
  createdAt: z.string(),
});
export type AlertItem = z.infer<typeof AlertSchema>;

// ─── Cost & Valuation Schemas ────────────────────────────────────────────────
export const ABCItemSchema = z.object({
  productId: z.string(),
  sku: z.string(),
  name: z.string(),
  category: z.string(),
  totalQuantity: z.number(),
  unitCost: z.number(),
  totalValue: z.number(),
  cumulativePercentage: z.number(),
  categoryClass: z.enum(['A', 'B', 'C']),
});
export type ABCItem = z.infer<typeof ABCItemSchema>;
