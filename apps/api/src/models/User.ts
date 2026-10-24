import mongoose, { Document, Schema } from 'mongoose';
import type { Role } from '@nexus/shared';

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  role: Role;
  organizationId: mongoose.Types.ObjectId;
  isActive: boolean;
  approvalStatus: 'APPROVED' | 'PENDING' | 'REJECTED';
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  rejectionReason?: string;
  refreshTokens: Array<{
    tokenHash: string;
    expiresAt: Date;
    createdAt: Date;
    userAgent?: string;
    ip?: string;
  }>;
  isEmailVerified: boolean;
  emailVerificationCode?: string;
  emailVerificationExpiresAt?: Date;
  googleId?: string;
  avatarUrl?: string;
  authProvider?: 'local' | 'google';
  lastLogin?: Date;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  get fullName(): string;
  get isApproved(): boolean;
}

const UserSchema = new Schema<IUser>(
  {
    firstName: { type: String, required: true, trim: true, maxlength: 50 },
    lastName: { type: String, required: true, trim: true, maxlength: 50 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    passwordHash: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ['admin', 'procurement_manager', 'warehouse_manager', 'finance', 'auditor'],
      required: true,
    },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    isActive: { type: Boolean, default: true, index: true },
    approvalStatus: {
      type: String,
      enum: ['APPROVED', 'PENDING', 'REJECTED'],
      default: 'APPROVED',
      index: true,
    },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    rejectionReason: { type: String },
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationCode: { type: String, select: false },
    emailVerificationExpiresAt: { type: Date, select: false },
    googleId: { type: String, sparse: true, index: true },
    avatarUrl: { type: String },
    authProvider: { type: String, enum: ['local', 'google'], default: 'local' },
    refreshTokens: [
      {
        tokenHash: { type: String, required: true },
        expiresAt: { type: Date, required: true },
        createdAt: { type: Date, default: Date.now },
        userAgent: String,
        ip: String,
      },
    ],
    lastLogin: Date,
    deletedAt: { type: Date, sparse: true },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, any>) => {
        delete ret.passwordHash;
        delete ret.refreshTokens;
        return ret;
      },
    },
  }
);

UserSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

UserSchema.virtual('isApproved').get(function () {
  return this.approvalStatus === 'APPROVED';
});

// Compound index for org + role queries
UserSchema.index({ organizationId: 1, role: 1 });
UserSchema.index({ organizationId: 1, isActive: 1 });
UserSchema.index({ organizationId: 1, approvalStatus: 1 });

export const User = mongoose.model<IUser>('User', UserSchema);
