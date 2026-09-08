import postgres from "postgres";
import { env } from "../config/env.js";

// No Drizzle/schema here on purpose — worker and server are separate npm
// workspaces (worker can't import server's TS sources), and the worker only
// needs a couple of narrow, hand-written queries, not a full ORM layer.
// Supabase pooler (Supavisor, port 6543) requires SSL and doesn't support prepared statements.
export const sql = postgres({
  host: env.POSTGRES_HOST,
  port: env.POSTGRES_PORT,
  user: env.POSTGRES_USER,
  password: env.POSTGRES_PASSWORD,
  database: env.POSTGRES_DB,
  ssl: "require",
  prepare: false,
});
