import { z } from "zod";

export const loginRequestSchema = z.object({
  email: z.email("validation.email.invalid"),
});

export const verifyRequestSchema = z.object({
  email: z.email("validation.email.invalid"),
  code: z.string().regex(/^\d{6}$/, "validation.code.invalid"),
});

export type LoginRequestInput = z.infer<typeof loginRequestSchema>;
export type VerifyRequestInput = z.infer<typeof verifyRequestSchema>;
