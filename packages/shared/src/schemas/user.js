import { z } from 'zod';
import { RoleEnum } from './auth';
export const UserSchema = z.object({
    _id: z.string(),
    firstName: z.string().min(1).max(50),
    lastName: z.string().min(1).max(50),
    email: z.string().email(),
    role: RoleEnum,
    organizationId: z.string(),
    isActive: z.boolean(),
    lastLogin: z.string().nullable().optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
});
export const CreateUserSchema = z.object({
    firstName: z.string().min(1).max(50),
    lastName: z.string().min(1).max(50),
    email: z.string().email(),
    role: RoleEnum,
    password: z.string().min(8),
});
export const UpdateUserSchema = z.object({
    firstName: z.string().min(1).max(50).optional(),
    lastName: z.string().min(1).max(50).optional(),
    role: RoleEnum.optional(),
    isActive: z.boolean().optional(),
});
