import mongoose, { Schema, Document } from 'mongoose';

export interface IPOLineItem {
  productId: mongoose.Types.ObjectId;
  sku: string;
  productName: string;
  quantityOrdered: number;
  quantityReceived: number;
  unitPrice: number;
  gstRate: number;
  totalPrice: number;
}

export interface IPurchaseOrder extends Document {
  organizationId: mongoose.Types.ObjectId;
  poNumber: string;
  supplierId: mongoose.Types.ObjectId;
  supplierName: string;
  warehouseId: mongoose.Types.ObjectId;
  warehouseName: string;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'SENT' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'CANCELLED' | 'REJECTED';
  expectedDeliveryDate: Date;
  items: IPOLineItem[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  notes?: string;
  createdByUserId: mongoose.Types.ObjectId;
  createdByName: string;
  approvedByUserId?: mongoose.Types.ObjectId;
  approvedByName?: string;
  approvedAt?: Date;
  submittedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const POLineItemSchema = new Schema<IPOLineItem>({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  sku: { type: String, required: true },
  productName: { type: String, required: true },
  quantityOrdered: { type: Number, required: true, min: 1 },
  quantityReceived: { type: Number, default: 0, min: 0 },
  unitPrice: { type: Number, required: true, min: 0 },
  gstRate: { type: Number, default: 18, min: 0 },
  totalPrice: { type: Number, required: true },
});

const PurchaseOrderSchema = new Schema<IPurchaseOrder>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    poNumber: { type: String, required: true, uppercase: true },
    supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier', required: true, index: true },
    supplierName: { type: String, required: true },
    warehouseId: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    warehouseName: { type: String, required: true },
    status: {
      type: String,
      enum: ['DRAFT', 'SUBMITTED', 'APPROVED', 'SENT', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED', 'REJECTED'],
      default: 'DRAFT',
      index: true,
    },
    expectedDeliveryDate: { type: Date, required: true },
    items: [POLineItemSchema],
    subtotal: { type: Number, required: true },
    taxAmount: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    notes: String,
    createdByUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    createdByName: { type: String, required: true },
    approvedByUserId: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedByName: String,
    approvedAt: Date,
    submittedAt: Date,
  },
  { timestamps: true }
);

PurchaseOrderSchema.index({ organizationId: 1, poNumber: 1 }, { unique: true });

export const PurchaseOrder = mongoose.model<IPurchaseOrder>('PurchaseOrder', PurchaseOrderSchema);
