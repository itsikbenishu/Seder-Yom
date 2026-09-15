import { and, eq } from "drizzle-orm";
import type { RegisterPushDeviceInput } from "@project/shared";
import { db } from "../db/client.js";
import { pushDevices } from "../db/schema/index.js";

interface UpsertPushDeviceInput extends RegisterPushDeviceInput {
  userAgent?: string;
}

// A token can move between users (same browser, different login) - conflict on the
// token PK and re-point it at the current user rather than erroring.
export async function upsertPushDevice(userId: string, input: UpsertPushDeviceInput): Promise<void> {
  const { token, platform, userAgent } = input;
  await db
    .insert(pushDevices)
    .values({ token, userId, platform, userAgent })
    .onConflictDoUpdate({
      target: pushDevices.token,
      set: { userId, platform, userAgent, lastSeenAt: new Date() },
    });
}

export async function deletePushDevice(userId: string, token: string): Promise<void> {
  await db.delete(pushDevices).where(and(eq(pushDevices.token, token), eq(pushDevices.userId, userId)));
}
