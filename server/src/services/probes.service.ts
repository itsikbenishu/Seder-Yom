import { sql } from "drizzle-orm";
import { db } from "../db/client.js";
import { getRabbitMqChannel } from "./rabbitmqClient.js";

const PROBE_TIMEOUT_MS = 2000;

export interface ReadinessResult {
  ready: boolean;
  checks: Record<"db" | "rabbitmq", "ok" | "unavailable">;
}

function withTimeout<T>(promise: Promise<T>, label: string): Promise<T> {
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(`${label} probe timed out`)), PROBE_TIMEOUT_MS);
  });
  return Promise.race([promise, timeout]);
}

async function isOk(probe: Promise<unknown>, label: string): Promise<boolean> {
  try {
    await withTimeout(probe, label);
    return true;
  } catch {
    return false;
  }
}

// Readiness probes Supabase Postgres and RabbitMQ; liveness has no dependencies.
export async function checkReadiness(): Promise<ReadinessResult> {
  const [dbOk, rabbitOk] = await Promise.all([
    isOk(db.execute(sql`select 1`), "db"),
    isOk(getRabbitMqChannel(), "rabbitmq"),
  ]);

  return {
    ready: dbOk && rabbitOk,
    checks: {
      db: dbOk ? "ok" : "unavailable",
      rabbitmq: rabbitOk ? "ok" : "unavailable",
    },
  };
}
