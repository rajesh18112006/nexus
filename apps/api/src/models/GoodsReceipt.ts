import mongoose, { Schema, Document } from 'mongoose';

export interface IGRNItem {
  productId: mongoose.Types.ObjectId;
  quantityReceived: number;
  quantityAccepted: number;
  quantityRejected: number;
  rejectionReason?: string;
}

export interface IGoodsReceipt extends Document {
  organizationId: mongoose.Types.ObjectId;
  grnNumber: string;
  purchaseOrderId: mongoose.Types.ObjectId;
  warehouseId: mongoose.Types.ObjectId;
  invoiceNumber?: string;
  invoiceAmount?: number;
  items: IGRNItem[];
  receivedByUserId: mongoose.Types.ObjectId;
  receivedByName: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const GRNItemSchema = new Schema<IGRNItem>({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  quantityReceived: { type: Number, required: true },
  quantityAccepted: { type: Number, required: true },
  quantityRejected: { type: Number, default: 0 },
  rejectionReason: String,
});

const GoodsReceiptSchema = new Schema<IGoodsReceipt>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    grnNumber: { type: String, required: true, uppercase: true },
    purchaseOrderId: { type: Schema.Types.ObjectId, ref: 'PurchaseOrder', required: true, index: true },
    warehouseId: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    invoiceNumber: String,
    invoiceAmount: Number,
    items: [GRNItemSchema],
    receivedByUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    receivedByName: { type: String, required: true },
    notes: String,
  },
  { timestamps: true }
);

GoodsReceiptSchema.index({ organizationId: 1, grnNumber: 1 }, { unique: true });

export const GoodsReceipt = mongoose.model<IGoodsReceipt>('GoodsReceipt', GoodsReceiptSchema);
