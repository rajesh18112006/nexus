import mongoose, { Document, Schema } from 'mongoose';

export interface IOrganization extends Document {
  name: string;
  slug: string;
  currency: string;
  locale: string;
  taxConfig: {
    gstEnabled: boolean;
    defaultGstRate: number;
    pan?: string;
    gstin?: string;
  };
  settings: {
    fiscalYearStart: number;
    holdingCostPct: number;
    defaultServiceLevel: number;
    morningBriefEnabled: boolean;
    morningBriefTime: string;
    timezone: string;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const OrganizationSchema = new Schema<IOrganization>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^[a-z0-9-]+$/,
    },
    currency: { type: String, default: 'INR' },
    locale: { type: String, default: 'en-IN' },
    taxConfig: {
      gstEnabled: { type: Boolean, default: true },
      defaultGstRate: { type: Number, default: 18 },
      pan: String,
      gstin: {
        type: String,
        match: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
        sparse: true,
      },
    },
    settings: {
      fiscalYearStart: { type: Number, default: 4, min: 1, max: 12 },
      holdingCostPct: { type: Number, default: 20 },
      defaultServiceLevel: { type: Number, default: 95 },
      morningBriefEnabled: { type: Boolean, default: true },
      morningBriefTime: { type: String, default: '06:00' },
      timezone: { type: String, default: 'Asia/Kolkata' },
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Organization = mongoose.model<IOrganization>('Organization', OrganizationSchema);
