import "dotenv/config";
import { z } from "zod";

// Same reasoning as server/src/config/env.ts: pin the process timezone so
// reminderTime comparisons ("NOW() >= reminderTime") aren't skewed by the host's own TZ.
process.env.TZ = "Asia/Jerusalem";

const envSchema = z.object({
  POSTGRES_HOST: z.string().min(1),
  POSTGRES_PORT: z.coerce.number().int().positive(),
  POSTGRES_USER: z.string().min(1),
  POSTGRES_PASSWORD: z.string().min(1),
  POSTGRES_DB: z.string().min(1),
  RABBITMQ_URL: z.string().min(1),
  SUPABASE_URL: z.url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SUPABASE_STORAGE_BUCKET: z.string().min(1).default("event-files"),
  // Firebase Admin SDK service-account credentials, as a single JSON string (not a file
  // path) — simplest to inject as one env var across local/.env and container secrets.
  FIREBASE_SERVICE_ACCOUNT_JSON: z.string().min(1),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

export const env = envSchema.parse(process.env);
