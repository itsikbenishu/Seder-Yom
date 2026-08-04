import { z } from "zod";

export const apiErrorSchema = z.object({
  message: z.string(),
  code: z.string(),
});

export const apiErrorResponseSchema = z.object({
  success: z.literal(false),
  error: apiErrorSchema,
});

export function createApiSuccessSchema<T extends z.ZodType>(dataSchema: T) {
  return z.object({
    success: z.literal(true),
    data: dataSchema,
  });
}

export function createApiResponseSchema<T extends z.ZodType>(dataSchema: T) {
  return z.union([createApiSuccessSchema(dataSchema), apiErrorResponseSchema]);
}

export type ApiError = z.infer<typeof apiErrorSchema>;
export type ApiErrorResponse = z.infer<typeof apiErrorResponseSchema>;
export type ApiSuccessResponse<T> = { success: true; data: T };
export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
