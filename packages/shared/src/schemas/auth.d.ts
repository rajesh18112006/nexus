import { z } from 'zod';
export declare const RoleEnum: z.ZodEnum<["admin", "procurement_manager", "warehouse_manager", "finance", "auditor"]>;
export type Role = z.infer<typeof RoleEnum>;
export declare const RegisterSchema: z.ZodObject<{
    organizationName: z.ZodString;
    organizationSlug: z.ZodString;
    firstName: z.ZodString;
    lastName: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    organizationName: string;
    organizationSlug: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
}, {
    organizationName: string;
    organizationSlug: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
}>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
export declare const LoginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export type LoginInput = z.infer<typeof LoginSchema>;
export declare const ChangePasswordSchema: z.ZodObject<{
    currentPassword: z.ZodString;
    newPassword: z.ZodString;
}, "strip", z.ZodTypeAny, {
    currentPassword: string;
    newPassword: string;
}, {
    currentPassword: string;
    newPassword: string;
}>;
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;
export declare const TokenPayloadSchema: z.ZodObject<{
    sub: z.ZodString;
    org: z.ZodString;
    role: z.ZodEnum<["admin", "procurement_manager", "warehouse_manager", "finance", "auditor"]>;
    iat: z.ZodOptional<z.ZodNumber>;
    exp: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    sub: string;
    org: string;
    role: "admin" | "procurement_manager" | "warehouse_manager" | "finance" | "auditor";
    iat?: number | undefined;
    exp?: number | undefined;
}, {
    sub: string;
    org: string;
    role: "admin" | "procurement_manager" | "warehouse_manager" | "finance" | "auditor";
    iat?: number | undefined;
    exp?: number | undefined;
}>;
export type TokenPayload = z.infer<typeof TokenPayloadSchema>;
export declare const AuthUserSchema: z.ZodObject<{
    _id: z.ZodString;
    firstName: z.ZodString;
    lastName: z.ZodString;
    email: z.ZodString;
    role: z.ZodEnum<["admin", "procurement_manager", "warehouse_manager", "finance", "auditor"]>;
    organizationId: z.ZodString;
    organizationName: z.ZodString;
    lastLogin: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    organizationName: string;
    firstName: string;
    lastName: string;
    email: string;
    role: "admin" | "procurement_manager" | "warehouse_manager" | "finance" | "auditor";
    _id: string;
    organizationId: string;
    createdAt: string;
    lastLogin?: string | undefined;
}, {
    organizationName: string;
    firstName: string;
    lastName: string;
    email: string;
    role: "admin" | "procurement_manager" | "warehouse_manager" | "finance" | "auditor";
    _id: string;
    organizationId: string;
    createdAt: string;
    lastLogin?: string | undefined;
}>;
export type AuthUser = z.infer<typeof AuthUserSchema>;
