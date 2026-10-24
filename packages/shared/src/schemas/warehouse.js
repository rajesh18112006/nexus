import { z } from 'zod';
export const WarehouseTypeEnum = z.enum([
    'CENTRAL_HUB',
    'REGIONAL_DC',
    'FULFILLMENT_CENTER',
    'PORT_LOGISTICS',
    'COLD_STORAGE',
    'TRANSIT_DEPOT',
]);
export const WarehouseStatusEnum = z.enum(['ACTIVE', 'INACTIVE', 'MAINTENANCE', 'FULL']);
export const WarehouseZoneSchema = z.object({
    id: z.string(),
    name: z.string(),
    code: z.string(),
    type: z.enum(['RECEIVING', 'STORAGE', 'PICKING', 'PACKING', 'SHIPPING', 'HAZMAT', 'COLD']),
    capacityUnits: z.number().min(0),
    currentOccupancyUnits: z.number().min(0).default(0),
});
export const WarehouseSchema = z.object({
    id: z.string(),
    organizationId: z.string(),
    code: z.string().min(2).max(20),
    name: z.string().min(2).max(100),
    type: WarehouseTypeEnum.default('REGIONAL_DC'),
    address: z.object({
        street: z.string(),
        city: z.string(),
        state: z.string(),
        postalCode: z.string(),
        country: z.string().default('India'),
    }),
    contactPerson: z.string().optional(),
    contactEmail: z.string().email().optional(),
    contactPhone: z.string().optional(),
    capacityVolumeSqFt: z.number().min(0),
    maxPallets: z.number().min(0),
    currentOccupancyPallets: z.number().min(0).default(0),
    managerId: z.string().optional(),
    status: WarehouseStatusEnum.default('ACTIVE'),
    zones: z.array(WarehouseZoneSchema).default([]),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
});
export const CreateWarehouseSchema = WarehouseSchema.omit({
    id: true,
    organizationId: true,
    currentOccupancyPallets: true,
    createdAt: true,
    updatedAt: true,
});
export const UpdateWarehouseSchema = CreateWarehouseSchema.partial();
