import { z } from 'zod';
import { RoleEnum, ApprovalStatusEnum } from './auth';

export const UserSchema = z.object({
  _id: z.string(),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  email: z.string().email(),
  role: RoleEnum,
  organizationId: z.string(),
  isActive: z.boolean(),
  approvalStatus: ApprovalStatusEnum.default('APPROVED'),
  approvedBy: z.string().nullable().optional(),
  approvedAt: z.string().nullable().optional(),
  rejectionReason: z.string().nullable().optional(),
  authProvider: z.enum(['local', 'google']).default('local'),
  avatarUrl: z.string().optional(),
  lastLogin: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type User = z.infer<typeof UserSchema>;

export const CreateUserSchema = z.object({
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  email: z.string().email(),
  role: RoleEnum,
  password: z.string().min(8),
  approvalStatus: ApprovalStatusEnum.optional().default('APPROVED'),
});
export type CreateUserInput = z.infer<typeof CreateUserSchema>;

export const UpdateUserSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  role: RoleEnum.optional(),
  isActive: z.boolean().optional(),
  approvalStatus: ApprovalStatusEnum.optional(),
});
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;

export const ApproveUserSchema = z.object({
  role: RoleEnum.optional(),
});
export type ApproveUserInput = z.infer<typeof ApproveUserSchema>;

export const RejectUserSchema = z.object({
  reason: z.string().optional(),
});
export type RejectUserInput = z.infer<typeof RejectUserSchema>;
