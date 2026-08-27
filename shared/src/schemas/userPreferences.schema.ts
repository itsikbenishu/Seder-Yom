import { z } from "zod";

export const appLanguageSchema = z.enum(["he", "en"]);
export const appThemeSchema = z.enum(["light", "dark", "system"]);
export const notificationChannelSchema = z.enum(["browser", "mobile"]);

// Full read shape — every field has a default, so a row that doesn't exist yet
// (user never touched Settings) can still be parsed from just `{ user_id }`.
export const userPreferencesSchema = z.object({
  user_id: z.uuid(),
  language: appLanguageSchema.default("he"),
  theme: appThemeSchema.default("system"),
  reminderEnabled: z.boolean().default(true),
  channels: z
    .array(notificationChannelSchema)
    .min(1, "validation.notifications.channelRequired")
    .max(1, "validation.notifications.channelSingle")
    .default(["browser"]),
});

// Write shape — deliberately NOT `userPreferencesSchema.partial()`: that would keep
// each field's `.default()`, which fills in a value for every omitted key (Zod applies
// `.default()` whenever a key is `undefined`, missing or not) and defeat "any subset"
// partial updates. Every field here is a plain `.optional()` with no
// default, so an omitted key stays genuinely absent from the parsed object.
export const updateUserPreferencesSchema = z.object({
  language: appLanguageSchema.optional(),
  theme: appThemeSchema.optional(),
  reminderEnabled: z.boolean().optional(),
  channels: z
    .array(notificationChannelSchema)
    .min(1, "validation.notifications.channelRequired")
    .max(1, "validation.notifications.channelSingle")
    .optional(),
});

export type AppLanguage = z.infer<typeof appLanguageSchema>;
export type AppTheme = z.infer<typeof appThemeSchema>;
export type NotificationChannel = z.infer<typeof notificationChannelSchema>;
export type UserPreferences = z.infer<typeof userPreferencesSchema>;
export type UpdateUserPreferencesInput = z.infer<typeof updateUserPreferencesSchema>;
