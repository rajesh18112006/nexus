import mongoose, { Document, Schema } from 'mongoose';

export type AuditAction =
  | 'create' | 'update' | 'delete' | 'approve' | 'reject'
  | 'login' | 'logout' | 'adjust' | 'receive' | 'transfer'
  | 'execute' | 'acknowledge' | 'dismiss' | 'cancel';

export interface IAuditLog extends Document {
  organizationId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  userEmail: string;
  userRole: string;
  resource: string;
  resourceId: string;
  action: AuditAction;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  reason?: string;
  requestId: string;
  ip: string;
  userAgent?: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    userEmail: { type: String, required: true },
    userRole: { type: String, required: true },
    resource: { type: String, required: true },
    resourceId: { type: String, required: true },
    action: { type: String, required: true },
    before: { type: Schema.Types.Mixed },
    after: { type: Schema.Types.Mixed },
    reason: String,
    requestId: { type: String, required: true },
    ip: { type: String, required: true },
    userAgent: String,
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Append-only — no updatedAt
    // Prevent any updates to audit records
  }
);

// Indexes for querying by resource, user, and time
AuditLogSchema.index({ organizationId: 1, createdAt: -1 });
AuditLogSchema.index({ resource: 1, resourceId: 1, createdAt: -1 });
AuditLogSchema.index({ userId: 1, createdAt: -1 });
AuditLogSchema.index({ requestId: 1 });

// Make audit log append-only at the schema level
AuditLogSchema.pre('findOneAndUpdate', function () {
  throw new Error('AuditLog is append-only. Updates are not permitted.');
});
AuditLogSchema.pre('updateOne', function () {
  throw new Error('AuditLog is append-only. Updates are not permitted.');
});
AuditLogSchema.pre('deleteOne', function () {
  throw new Error('AuditLog is append-only. Deletes are not permitted.');
});

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
