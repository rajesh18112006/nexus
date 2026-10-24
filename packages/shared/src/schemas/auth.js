import { z } from 'zod';
// ─── Roles ───────────────────────────────────────────────────────────────────
export const RoleEnum = z.enum([
    'admin',
    'procurement_manager',
    'warehouse_manager',
    'finance',
    'auditor',
]);
// ─── Register ─────────────────────────────────────────────────────────────────
export const RegisterSchema = z.object({
    organizationName: z.string().min(2).max(100),
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
});
// ─── Login ────────────────────────────────────────────────────────────────────
export const LoginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});
// ─── Change Password ──────────────────────────────────────────────────────────
export const ChangePasswordSchema = z.object({
    currentPassword: z.string().min(1),
    newPassword: z
        .string()
        .min(8)
        .regex(/[A-Z]/, 'Must contain uppercase')
        .regex(/[0-9]/, 'Must contain number'),
});
// ─── Token Payload ────────────────────────────────────────────────────────────
export const TokenPayloadSchema = z.object({
    sub: z.string(), // userId
    org: z.string(), // organizationId
    role: RoleEnum,
    iat: z.number().optional(),
    exp: z.number().optional(),
});
// ─── Auth Response ────────────────────────────────────────────────────────────
export const AuthUserSchema = z.object({
    _id: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    email: z.string(),
    role: RoleEnum,
    organizationId: z.string(),
    organizationName: z.string(),
    lastLogin: z.string().optional(),
    createdAt: z.string(),
});
