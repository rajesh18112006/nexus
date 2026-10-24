import { z } from 'zod';
export declare const OrganizationSchema: z.ZodObject<{
    _id: z.ZodString;
    name: z.ZodString;
    slug: z.ZodString;
    currency: z.ZodDefault<z.ZodString>;
    locale: z.ZodDefault<z.ZodString>;
    taxConfig: z.ZodObject<{
        gstEnabled: z.ZodDefault<z.ZodBoolean>;
        defaultGstRate: z.ZodDefault<z.ZodNumber>;
        pan: z.ZodOptional<z.ZodString>;
        gstin: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        gstEnabled: boolean;
        defaultGstRate: number;
        pan?: string | undefined;
        gstin?: string | undefined;
    }, {
        gstEnabled?: boolean | undefined;
        defaultGstRate?: number | undefined;
        pan?: string | undefined;
        gstin?: string | undefined;
    }>;
    settings: z.ZodObject<{
        fiscalYearStart: z.ZodDefault<z.ZodNumber>;
        holdingCostPct: z.ZodDefault<z.ZodNumber>;
        defaultServiceLevel: z.ZodDefault<z.ZodNumber>;
        morningBriefEnabled: z.ZodDefault<z.ZodBoolean>;
        morningBriefTime: z.ZodDefault<z.ZodString>;
        timezone: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        fiscalYearStart: number;
        holdingCostPct: number;
        defaultServiceLevel: number;
        morningBriefEnabled: boolean;
        morningBriefTime: string;
        timezone: string;
    }, {
        fiscalYearStart?: number | undefined;
        holdingCostPct?: number | undefined;
        defaultServiceLevel?: number | undefined;
        morningBriefEnabled?: boolean | undefined;
        morningBriefTime?: string | undefined;
        timezone?: string | undefined;
    }>;
    isActive: z.ZodBoolean;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    _id: string;
    createdAt: string;
    isActive: boolean;
    updatedAt: string;
    name: string;
    slug: string;
    currency: string;
    locale: string;
    taxConfig: {
        gstEnabled: boolean;
        defaultGstRate: number;
        pan?: string | undefined;
        gstin?: string | undefined;
    };
    settings: {
        fiscalYearStart: number;
        holdingCostPct: number;
        defaultServiceLevel: number;
        morningBriefEnabled: boolean;
        morningBriefTime: string;
        timezone: string;
    };
}, {
    _id: string;
    createdAt: string;
    isActive: boolean;
    updatedAt: string;
    name: string;
    slug: string;
    taxConfig: {
        gstEnabled?: boolean | undefined;
        defaultGstRate?: number | undefined;
        pan?: string | undefined;
        gstin?: string | undefined;
    };
    settings: {
        fiscalYearStart?: number | undefined;
        holdingCostPct?: number | undefined;
        defaultServiceLevel?: number | undefined;
        morningBriefEnabled?: boolean | undefined;
        morningBriefTime?: string | undefined;
        timezone?: string | undefined;
    };
    currency?: string | undefined;
    locale?: string | undefined;
}>;
export type Organization = z.infer<typeof OrganizationSchema>;
