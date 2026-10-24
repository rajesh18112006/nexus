import { z } from 'zod';

// ─── Roles ───────────────────────────────────────────────────────────────────
export const RoleEnum = z.enum([
  'admin',
  'procurement_manager',
  'warehouse_manager',
  'finance',
  'auditor',
]);
export type Role = z.infer<typeof RoleEnum>;

// ─── Approval Status ────────────────────────────────────────────────────────
export const ApprovalStatusEnum = z.enum(['APPROVED', 'PENDING', 'REJECTED']);
export type ApprovalStatus = z.infer<typeof ApprovalStatusEnum>;

// ─── Register ─────────────────────────────────────────────────────────────────
export const RegisterSchema = z.object({
  mode: z.enum(['create_org', 'join_org']).default('create_org'),
  organizationName: z.string().min(2).max(100).optional(),
  organizationSlug: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  email: z.string().email(),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/, 'Must contain uppercase')
    .regex(/[0-9]/, 'Must contain number'),
  role: RoleEnum.optional().default('admin'),
});
export type RegisterInput = z.infer<typeof RegisterSchema>;

// ─── Login ────────────────────────────────────────────────────────────────────
export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof LoginSchema>;

// ─── Change Password ──────────────────────────────────────────────────────────
export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z
    .string()
    .min(8)
    .regex(/[A-Z]/, 'Must contain uppercase')
    .regex(/[0-9]/, 'Must contain number'),
});
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;

// ─── Token Payload ────────────────────────────────────────────────────────────
export const TokenPayloadSchema = z.object({
  sub: z.string(),        // userId
  org: z.string(),        // organizationId
  role: RoleEnum,
  approvalStatus: ApprovalStatusEnum.optional().default('APPROVED'),
  iat: z.number().optional(),
  exp: z.number().optional(),
});
export type TokenPayload = z.infer<typeof TokenPayloadSchema>;

// ─── Auth Response ────────────────────────────────────────────────────────────
export const AuthUserSchema = z.object({
  _id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
  role: RoleEnum,
  organizationId: z.string(),
  organizationName: z.string(),
  approvalStatus: ApprovalStatusEnum.default('APPROVED'),
  isApproved: z.boolean().default(true),
  isActive: z.boolean().default(true),
  lastLogin: z.string().optional(),
  createdAt: z.string(),
});
export type AuthUser = z.infer<typeof AuthUserSchema>;

// ─── Email Verification ───────────────────────────────────────────────────────
export const VerifyEmailSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6, 'Verification code must be 6 digits'),
});
export type VerifyEmailInput = z.infer<typeof VerifyEmailSchema>;

export const ResendCodeSchema = z.object({
  email: z.string().email(),
});
export type ResendCodeInput = z.infer<typeof ResendCodeSchema>;

// ─── Google OAuth ─────────────────────────────────────────────────────────────
export const GoogleAuthSchema = z.object({
  code: z.string().optional(),
  idToken: z.string().optional(),
  email: z.string().email().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  avatarUrl: z.string().optional(),
  googleId: z.string().optional(),
  mode: z.enum(['create_org', 'join_org']).optional(),
  organizationSlug: z.string().optional(),
  role: RoleEnum.optional(),
  approvalStatus: ApprovalStatusEnum.optional(),
});
export type GoogleAuthInput = z.infer<typeof GoogleAuthSchema>;
