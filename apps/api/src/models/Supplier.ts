import mongoose, { Schema, Document } from 'mongoose';

export interface ISupplier extends Document {
  organizationId: mongoose.Types.ObjectId;
  code: string;
  name: string;
  contactName: string;
  email: string;
  phone: string;
  gstin?: string;
  address?: {
    street?: string;
    city: string;
    state: string;
    postalCode?: string;
    country: string;
  };
  paymentTerms: string;
  leadTimeDays: number;
  rating: number;
  status: 'ACTIVE' | 'INACTIVE' | 'UNDER_REVIEW' | 'BLOCKED';
  createdAt: Date;
  updatedAt: Date;
}

const SupplierSchema = new Schema<ISupplier>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    code: { type: String, required: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    contactName: { type: String, required: true },
    email: { type: String, required: true, lowercase: true },
    phone: { type: String, required: true },
    gstin: { type: String, uppercase: true },
    address: {
      street: String,
      city: { type: String, required: true },
      state: { type: String, required: true },
      postalCode: String,
      country: { type: String, default: 'India' },
    },
    paymentTerms: { type: String, default: 'Net 30' },
    leadTimeDays: { type: Number, default: 7 },
    rating: { type: Number, default: 4.5 },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE', 'UNDER_REVIEW', 'BLOCKED'], default: 'ACTIVE' },
  },
  { timestamps: true }
);

SupplierSchema.index({ organizationId: 1, code: 1 }, { unique: true });

export const Supplier = mongoose.model<ISupplier>('Supplier', SupplierSchema);
