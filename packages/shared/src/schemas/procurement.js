import { z } from 'zod';
import { POStatusEnum } from './common';
export { POStatusEnum };
export const POLineItemSchema = z.object({
    productId: z.string(),
    sku: z.string(),
    productName: z.string(),
    quantityOrdered: z.number().positive(),
    quantityReceived: z.number().min(0).default(0),
    unitPrice: z.number().positive(),
    gstRate: z.number().min(0).default(18),
    totalPrice: z.number().optional(),
});
export const CreatePOSchema = z.object({
    supplierId: z.string(),
    supplierName: z.string(),
    warehouseId: z.string(),
    warehouseName: z.string(),
    expectedDeliveryDate: z.string().or(z.date()),
    items: z.array(POLineItemSchema).min(1, 'At least one line item is required'),
    notes: z.string().optional(),
});
export const UpdatePOStatusSchema = z.object({
    status: POStatusEnum,
    notes: z.string().optional(),
    rejectionReason: z.string().optional(),
});
export const CreateGRNSchema = z.object({
    purchaseOrderId: z.string(),
    warehouseId: z.string(),
    invoiceNumber: z.string().optional(),
    invoiceAmount: z.number().optional(),
    items: z.array(z.object({
        productId: z.string(),
        quantityReceived: z.number().min(0),
        quantityAccepted: z.number().min(0),
        quantityRejected: z.number().min(0).default(0),
        rejectionReason: z.string().optional(),
    })).min(1),
    notes: z.string().optional(),
});
export const POQuerySchema = z.object({
    search: z.string().optional(),
    status: POStatusEnum.optional(),
    supplierId: z.string().optional(),
    warehouseId: z.string().optional(),
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
});
