import { z } from 'zod';
import { MovementTypeEnum } from './common';
export const StockLedgerSchema = z.object({
    id: z.string(),
    organizationId: z.string(),
    productId: z.string(),
    warehouseId: z.string(),
    movementType: MovementTypeEnum,
    quantityDelta: z.number(), // positive for addition, negative for deduction
    previousQuantityOnHand: z.number().min(0),
    newQuantityOnHand: z.number().min(0),
    unitCost: z.number().min(0),
    totalValue: z.number(),
    referenceType: z.enum(['PURCHASE_ORDER', 'SALES_ORDER', 'ADJUSTMENT', 'TRANSFER', 'INITIAL_SEED', 'RETURN']),
    referenceId: z.string().optional(),
    batchNumber: z.string().optional(),
    expiryDate: z.string().optional(),
    performedByUserId: z.string(),
    performedByName: z.string().optional(),
    notes: z.string().optional(),
    createdAt: z.string(),
});
export const StockLedgerQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(200).default(25),
    productId: z.string().optional(),
    warehouseId: z.string().optional(),
    movementType: MovementTypeEnum.optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    sortBy: z.enum(['createdAt', 'quantityDelta', 'totalValue']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
});
