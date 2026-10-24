import mongoose, { Document, Schema } from 'mongoose';

export interface IStockLevel extends Document {
  organizationId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  warehouseId: mongoose.Types.ObjectId;
  binLocation?: string;
  quantityOnHand: number;
  quantityAllocated: number;
  quantityOnOrder: number;
  safetyStock: number;
  reorderPoint: number;
  maxCapacity?: number;
  lastMovementAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const StockLevelSchema = new Schema<IStockLevel>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    warehouseId: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true, index: true },
    binLocation: { type: String, trim: true },
    quantityOnHand: { type: Number, default: 0, min: 0 },
    quantityAllocated: { type: Number, default: 0, min: 0 },
    quantityOnOrder: { type: Number, default: 0, min: 0 },
    safetyStock: { type: Number, default: 5, min: 0 },
    reorderPoint: { type: Number, default: 20, min: 0 },
    maxCapacity: { type: Number, min: 0 },
    lastMovementAt: { type: Date },
  },
  { timestamps: true }
);

// Compound unique index per org, product, warehouse
StockLevelSchema.index({ organizationId: 1, productId: 1, warehouseId: 1 }, { unique: true });

export const StockLevel = mongoose.model<IStockLevel>('StockLevel', StockLevelSchema);
