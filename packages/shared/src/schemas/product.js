import { z } from 'zod';
export const ProductCategoryEnum = z.enum([
    'ELECTRONICS',
    'ELECTRICAL',
    'RAW_MATERIALS',
    'COMPONENTS',
    'PACKAGING',
    'TOOLS_EQUIPMENT',
    'SPARE_PARTS',
    'FINISHED_GOODS',
    'OFFICE_SUPPLIES',
    'CHEMICALS',
]);
export const ProductUnitEnum = z.enum([
    'PCS',
    'KG',
    'METERS',
    'LITERS',
    'BOXES',
    'PACKS',
    'ROLLS',
    'SET',
    'PALLETS',
]);
export const ProductStatusEnum = z.enum(['ACTIVE', 'DISCONTINUED', 'DRAFT', 'ARCHIVED']);
export const ProductSchema = z.object({
    id: z.string(),
    organizationId: z.string(),
    sku: z.string().min(3).max(50),
    name: z.string().min(2).max(150),
    description: z.string().optional(),
    category: ProductCategoryEnum,
    unit: ProductUnitEnum.default('PCS'),
    unitCost: z.number().min(0),
    sellingPrice: z.number().min(0).optional(),
    minStockLevel: z.number().min(0).default(10),
    reorderPoint: z.number().min(0).default(25),
    reorderQuantity: z.number().min(1).default(50),
    leadTimeDays: z.number().min(1).default(7),
    safetyStock: z.number().min(0).default(5),
    gstRate: z.number().min(0).max(28).default(18), // GST % (0, 5, 12, 18, 28)
    hsnCode: z.string().optional(),
    barcode: z.string().optional(),
    status: ProductStatusEnum.default('ACTIVE'),
    attributes: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
});
export const CreateProductSchema = ProductSchema.omit({
    id: true,
    organizationId: true,
    createdAt: true,
    updatedAt: true,
});
export const UpdateProductSchema = CreateProductSchema.partial();
export const ProductQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(200).default(25),
    search: z.string().optional(),
    category: ProductCategoryEnum.optional(),
    status: ProductStatusEnum.optional(),
    warehouseId: z.string().optional(),
    lowStockOnly: z.coerce.boolean().optional(),
    sortBy: z.enum(['sku', 'name', 'unitCost', 'category', 'createdAt']).default('name'),
    sortOrder: z.enum(['asc', 'desc']).default('asc'),
});
