import { z } from 'zod';
export declare const PaginationSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    sortBy: z.ZodOptional<z.ZodString>;
    sortOrder: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    sortOrder: "asc" | "desc";
    sortBy?: string | undefined;
}, {
    page?: number | undefined;
    limit?: number | undefined;
    sortBy?: string | undefined;
    sortOrder?: "asc" | "desc" | undefined;
}>;
export type PaginationInput = z.infer<typeof PaginationSchema>;
export declare const PaginatedResponseSchema: <T extends z.ZodTypeAny>(itemSchema: T) => z.ZodObject<{
    data: z.ZodArray<T, "many">;
    meta: z.ZodObject<{
        total: z.ZodNumber;
        page: z.ZodNumber;
        limit: z.ZodNumber;
        totalPages: z.ZodNumber;
        hasNext: z.ZodBoolean;
        hasPrev: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    }, {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    }>;
}, "strip", z.ZodTypeAny, {
    data: T["_output"][];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}, {
    data: T["_input"][];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}>;
export declare const ApiErrorSchema: z.ZodObject<{
    success: z.ZodLiteral<false>;
    message: z.ZodString;
    requestId: z.ZodString;
    code: z.ZodOptional<z.ZodString>;
    details: z.ZodOptional<z.ZodUnknown>;
}, "strip", z.ZodTypeAny, {
    message: string;
    requestId: string;
    success: false;
    code?: string | undefined;
    details?: unknown;
}, {
    message: string;
    requestId: string;
    success: false;
    code?: string | undefined;
    details?: unknown;
}>;
export type ApiError = z.infer<typeof ApiErrorSchema>;
export declare const ApiSuccessSchema: <T extends z.ZodTypeAny>(dataSchema: T) => z.ZodObject<{
    success: z.ZodLiteral<true>;
    data: T;
    message: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, z.objectUtil.addQuestionMarks<z.baseObjectOutputType<{
    success: z.ZodLiteral<true>;
    data: T;
    message: z.ZodOptional<z.ZodString>;
}>, any> extends infer T_1 ? { [k in keyof T_1]: T_1[k]; } : never, z.baseObjectInputType<{
    success: z.ZodLiteral<true>;
    data: T;
    message: z.ZodOptional<z.ZodString>;
}> extends infer T_2 ? { [k_1 in keyof T_2]: T_2[k_1]; } : never>;
export declare const AlertSeverityEnum: z.ZodEnum<["CRITICAL", "WARNING", "INFO", "OPPORTUNITY"]>;
export type AlertSeverity = z.infer<typeof AlertSeverityEnum>;
export declare const MovementTypeEnum: z.ZodEnum<["receipt", "issue", "transfer_out", "transfer_in", "adjustment", "return", "damage", "expiry", "reservation", "release", "cycle_count"]>;
export type MovementType = z.infer<typeof MovementTypeEnum>;
export declare const POStatusEnum: z.ZodEnum<["draft", "pending_approval", "approved", "sent_to_supplier", "confirmed", "shipped", "partially_received", "received", "closed", "cancelled"]>;
export type POStatus = z.infer<typeof POStatusEnum>;
export declare const PRStatusEnum: z.ZodEnum<["draft", "pending", "approved", "rejected", "fulfilled"]>;
export type PRStatus = z.infer<typeof PRStatusEnum>;
export declare const ForecastHorizonEnum: z.ZodEnum<["7", "14", "30", "60", "90"]>;
export type ForecastHorizon = z.infer<typeof ForecastHorizonEnum>;
export declare const ConfidenceLabelEnum: z.ZodEnum<["HIGH", "MEDIUM", "LOW", "VERY_LOW"]>;
export type ConfidenceLabel = z.infer<typeof ConfidenceLabelEnum>;
export declare const RecommendationTypeEnum: z.ZodEnum<["reorder", "transfer", "dispose", "expedite", "discount", "bundle", "return_to_supplier"]>;
export type RecommendationType = z.infer<typeof RecommendationTypeEnum>;
export declare function formatINR(amount: number): string;
export declare function formatLakhCrore(amount: number): string;
export declare function formatNumber(n: number): string;
