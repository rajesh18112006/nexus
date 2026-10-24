import mongoose, { Document, Schema } from 'mongoose';
import type { MovementType } from '@nexus/shared';

export interface IStockLedger extends Document {
  organizationId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  warehouseId: mongoose.Types.ObjectId;
  movementType: MovementType;
  quantityDelta: number;
  previousQuantityOnHand: number;
  newQuantityOnHand: number;
  unitCost: number;
  totalValue: number;
  referenceType: 'PURCHASE_ORDER' | 'SALES_ORDER' | 'ADJUSTMENT' | 'TRANSFER' | 'INITIAL_SEED' | 'RETURN';
  referenceId?: string;
  batchNumber?: string;
  expiryDate?: Date;
  performedByUserId: mongoose.Types.ObjectId;
  performedByName?: string;
  notes?: string;
  createdAt: Date;
}

const StockLedgerSchema = new Schema<IStockLedger>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    warehouseId: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true, index: true },
    movementType: { type: String, required: true, index: true },
    quantityDelta: { type: Number, required: true },
    previousQuantityOnHand: { type: Number, required: true, min: 0 },
    newQuantityOnHand: { type: Number, required: true, min: 0 },
    unitCost: { type: Number, required: true, min: 0 },
    totalValue: { type: Number, required: true },
    referenceType: {
      type: String,
      enum: ['PURCHASE_ORDER', 'SALES_ORDER', 'ADJUSTMENT', 'TRANSFER', 'INITIAL_SEED', 'RETURN'],
      required: true,
    },
    referenceId: { type: String },
    batchNumber: { type: String },
    expiryDate: { type: Date },
    performedByUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    performedByName: { type: String },
    notes: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Indexes for high-speed audit log lookups
StockLedgerSchema.index({ organizationId: 1, createdAt: -1 });
StockLedgerSchema.index({ organizationId: 1, productId: 1, createdAt: -1 });
StockLedgerSchema.index({ organizationId: 1, warehouseId: 1, createdAt: -1 });

export const StockLedger = mongoose.model<IStockLedger>('StockLedger', StockLedgerSchema);
