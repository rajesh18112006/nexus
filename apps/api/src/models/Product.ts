import mongoose, { Document, Schema } from 'mongoose';
import type { ProductCategory, ProductUnit, ProductStatus } from '@nexus/shared';

export interface IProduct extends Document {
  organizationId: mongoose.Types.ObjectId;
  sku: string;
  name: string;
  description?: string;
  category: ProductCategory;
  unit: ProductUnit;
  unitCost: number;
  sellingPrice?: number;
  minStockLevel: number;
  reorderPoint: number;
  reorderQuantity: number;
  leadTimeDays: number;
  safetyStock: number;
  gstRate: number;
  hsnCode?: string;
  barcode?: string;
  status: ProductStatus;
  attributes?: Record<string, any>;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    sku: { type: String, required: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    description: { type: String },
    category: {
      type: String,
      enum: [
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
      ],
      required: true,
      index: true,
    },
    unit: {
      type: String,
      enum: ['PCS', 'KG', 'METERS', 'LITERS', 'BOXES', 'PACKS', 'ROLLS', 'SET', 'PALLETS'],
      default: 'PCS',
    },
    unitCost: { type: Number, required: true, min: 0 },
    sellingPrice: { type: Number, min: 0 },
    minStockLevel: { type: Number, default: 10, min: 0 },
    reorderPoint: { type: Number, default: 25, min: 0 },
    reorderQuantity: { type: Number, default: 50, min: 1 },
    leadTimeDays: { type: Number, default: 7, min: 1 },
    safetyStock: { type: Number, default: 5, min: 0 },
    gstRate: { type: Number, default: 18, min: 0, max: 28 },
    hsnCode: { type: String, trim: true },
    barcode: { type: String, trim: true },
    status: {
      type: String,
      enum: ['ACTIVE', 'DISCONTINUED', 'DRAFT', 'ARCHIVED'],
      default: 'ACTIVE',
      index: true,
    },
    attributes: { type: Map, of: Schema.Types.Mixed },
    deletedAt: { type: Date, sparse: true },
  },
  { timestamps: true }
);

// Compound indexes
ProductSchema.index({ organizationId: 1, sku: 1 }, { unique: true });
ProductSchema.index({ organizationId: 1, category: 1, status: 1 });

export const Product = mongoose.model<IProduct>('Product', ProductSchema);
