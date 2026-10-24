import { z } from 'zod';
export const StockLevelSchema = z.object({
    id: z.string(),
    organizationId: z.string(),
    productId: z.string(),
    warehouseId: z.string(),
    binLocation: z.string().optional(),
    quantityOnHand: z.number().min(0).default(0),
    quantityAllocated: z.number().min(0).default(0),
    quantityOnOrder: z.number().min(0).default(0),
    safetyStock: z.number().min(0).default(5),
    reorderPoint: z.number().min(0).default(20),
    maxCapacity: z.number().min(0).optional(),
    lastMovementAt: z.string().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
});
export const AdjustStockSchema = z.object({
    productId: z.string(),
    warehouseId: z.string(),
    adjustmentType: z.enum(['IN', 'OUT', 'SET']),
    quantity: z.number().min(0),
    reason: z.enum(['CYCLE_COUNT', 'DAMAGE', 'EXPIRY', 'DISCREPANCY', 'RECEIPT_CORRECTION', 'OTHER']),
    reference: z.string().optional(),
    notes: z.string().optional(),
});
