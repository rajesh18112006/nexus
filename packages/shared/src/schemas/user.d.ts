import { z } from 'zod';
export declare const UserSchema: z.ZodObject<{
    _id: z.ZodString;
    firstName: z.ZodString;
    lastName: z.ZodString;
    email: z.ZodString;
    role: z.ZodEnum<["admin", "procurement_manager", "warehouse_manager", "finance", "auditor"]>;
    organizationId: z.ZodString;
    isActive: z.ZodBoolean;
    lastLogin: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    firstName: string;
    lastName: string;
    email: string;
    role: "admin" | "procurement_manager" | "warehouse_manager" | "finance" | "auditor";
    _id: string;
    organizationId: string;
    createdAt: string;
    isActive: boolean;
    updatedAt: string;
    lastLogin?: string | null | undefined;
}, {
    firstName: string;
    lastName: string;
    email: string;
    role: "admin" | "procurement_manager" | "warehouse_manager" | "finance" | "auditor";
    _id: string;
    organizationId: string;
    createdAt: string;
    isActive: boolean;
    updatedAt: string;
    lastLogin?: string | null | undefined;
}>;
export type User = z.infer<typeof UserSchema>;
export declare const CreateUserSchema: z.ZodObject<{
    firstName: z.ZodString;
    lastName: z.ZodString;
    email: z.ZodString;
    role: z.ZodEnum<["admin", "procurement_manager", "warehouse_manager", "finance", "auditor"]>;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: "admin" | "procurement_manager" | "warehouse_manager" | "finance" | "auditor";
}, {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: "admin" | "procurement_manager" | "warehouse_manager" | "finance" | "auditor";
}>;
export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export declare const UpdateUserSchema: z.ZodObject<{
    firstName: z.ZodOptional<z.ZodString>;
    lastName: z.ZodOptional<z.ZodString>;
    role: z.ZodOptional<z.ZodEnum<["admin", "procurement_manager", "warehouse_manager", "finance", "auditor"]>>;
    isActive: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    firstName?: string | undefined;
    lastName?: string | undefined;
    role?: "admin" | "procurement_manager" | "warehouse_manager" | "finance" | "auditor" | undefined;
    isActive?: boolean | undefined;
}, {
    firstName?: string | undefined;
    lastName?: string | undefined;
    role?: "admin" | "procurement_manager" | "warehouse_manager" | "finance" | "auditor" | undefined;
    isActive?: boolean | undefined;
}>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
