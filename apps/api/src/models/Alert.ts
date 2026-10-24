import mongoose, { Schema, Document } from 'mongoose';

export interface IAlert extends Document {
  organizationId: mongoose.Types.ObjectId;
  type: 'STOCKOUT_RISK' | 'PO_OVERDUE' | 'SUPPLIER_DELAY' | 'DEAD_STOCK' | 'PRICE_VARIANCE';
  severity: 'CRITICAL' | 'WARNING' | 'LOW' | 'HEALTHY';
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
  isResolved: boolean;
  resolvedAt?: Date;
  resolvedByUserId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AlertSchema = new Schema<IAlert>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    type: {
      type: String,
      enum: ['STOCKOUT_RISK', 'PO_OVERDUE', 'SUPPLIER_DELAY', 'DEAD_STOCK', 'PRICE_VARIANCE'],
      required: true,
      index: true,
    },
    severity: {
      type: String,
      enum: ['CRITICAL', 'WARNING', 'LOW', 'HEALTHY'],
      default: 'WARNING',
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    entityType: String,
    entityId: String,
    isResolved: { type: Boolean, default: false, index: true },
    resolvedAt: Date,
    resolvedByUserId: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const Alert = mongoose.model<IAlert>('Alert', AlertSchema);
