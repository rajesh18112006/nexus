import mongoose, { Document, Schema } from 'mongoose';
import type { WarehouseType, WarehouseStatus } from '@nexus/shared';

export interface IWarehouseZone {
  code: string;
  name: string;
  type: 'RECEIVING' | 'STORAGE' | 'PICKING' | 'PACKING' | 'SHIPPING' | 'HAZMAT' | 'COLD';
  capacityUnits: number;
  currentOccupancyUnits: number;
}

export interface IWarehouse extends Document {
  organizationId: mongoose.Types.ObjectId;
  code: string;
  name: string;
  type: WarehouseType;
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  capacityVolumeSqFt: number;
  maxPallets: number;
  currentOccupancyPallets: number;
  managerId?: mongoose.Types.ObjectId;
  status: WarehouseStatus;
  zones: IWarehouseZone[];
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const WarehouseSchema = new Schema<IWarehouse>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    code: { type: String, required: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['CENTRAL_HUB', 'REGIONAL_DC', 'FULFILLMENT_CENTER', 'PORT_LOGISTICS', 'COLD_STORAGE', 'TRANSIT_DEPOT'],
      default: 'REGIONAL_DC',
    },
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, default: 'India' },
    },
    contactPerson: String,
    contactEmail: String,
    contactPhone: String,
    capacityVolumeSqFt: { type: Number, required: true, min: 0 },
    maxPallets: { type: Number, required: true, min: 0 },
    currentOccupancyPallets: { type: Number, default: 0, min: 0 },
    managerId: { type: Schema.Types.ObjectId, ref: 'User' },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'MAINTENANCE', 'FULL'],
      default: 'ACTIVE',
      index: true,
    },
    zones: [
      {
        code: { type: String, required: true },
        name: { type: String, required: true },
        type: {
          type: String,
          enum: ['RECEIVING', 'STORAGE', 'PICKING', 'PACKING', 'SHIPPING', 'HAZMAT', 'COLD'],
          required: true,
        },
        capacityUnits: { type: Number, default: 1000 },
        currentOccupancyUnits: { type: Number, default: 0 },
      },
    ],
    deletedAt: { type: Date, sparse: true },
  },
  { timestamps: true }
);

WarehouseSchema.index({ organizationId: 1, code: 1 }, { unique: true });

export const Warehouse = mongoose.model<IWarehouse>('Warehouse', WarehouseSchema);
