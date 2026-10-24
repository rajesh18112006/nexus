import { z } from 'zod';
export const SupplierStatusEnum = z.enum(['ACTIVE', 'INACTIVE', 'UNDER_REVIEW', 'BLOCKED']);
export const CreateSupplierSchema = z.object({
    code: z.string().min(2).max(20),
    name: z.string().min(2).max(100),
    contactName: z.string().min(2).max(100),
    email: z.string().email(),
    phone: z.string().min(5).max(20),
    gstin: z.string().optional(),
    address: z.object({
        street: z.string().optional(),
        city: z.string(),
        state: z.string(),
        postalCode: z.string().optional(),
        country: z.string().default('India'),
    }).optional(),
    paymentTerms: z.string().default('Net 30'),
    leadTimeDays: z.number().min(1).default(7),
    rating: z.number().min(1).max(5).default(4.5),
    status: SupplierStatusEnum.default('ACTIVE'),
});
export const UpdateSupplierSchema = CreateSupplierSchema.partial();
export const SupplierQuerySchema = z.object({
    search: z.string().optional(),
    status: SupplierStatusEnum.optional(),
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
});
