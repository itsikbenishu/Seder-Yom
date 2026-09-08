import { z } from "zod";
import { notificationChannelSchema } from "./userPreferences.schema.js";

// A device's push platform is the same "browser" | "mobile" set as a user's
// notification channel — reuse that enum rather than declaring a parallel one.
export const devicePlatformSchema = notificationChannelSchema;

export const registerPushDeviceSchema = z.object({
  token: z.string().min(1),
  platform: devicePlatformSchema,
});

export const unregisterPushDeviceSchema = z.object({
  token: z.string().min(1),
});

export type DevicePlatform = z.infer<typeof devicePlatformSchema>;
export type RegisterPushDeviceInput = z.infer<typeof registerPushDeviceSchema>;
export type UnregisterPushDeviceInput = z.infer<typeof unregisterPushDeviceSchema>;
