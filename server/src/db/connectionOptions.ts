import { env } from "../config/env.js";

// Supabase pooler (Supavisor, port 6543) requires SSL and doesn't support prepared statements.
export const connectionOptions = {
  host: env.POSTGRES_HOST,
  port: env.POSTGRES_PORT,
  user: env.POSTGRES_USER,
  password: env.POSTGRES_PASSWORD,
  database: env.POSTGRES_DB,
  ssl: "require",
  prepare: false,
} as const;
