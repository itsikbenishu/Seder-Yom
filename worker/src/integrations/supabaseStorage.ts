import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";

// Mirrors server/src/config/supabaseClient.ts's supabaseStorageClient — service-role
// client for server-side Storage writes/deletes, kept separate here since the worker
// can't import server's TS sources (see worker/src/db/client.ts for the same reasoning).
const supabaseStorageClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});

// Mirrors server/src/services/files.service.ts's removeStorageObjects exactly:
// single batched delete call, log-only on error (never throw).
export async function removeStorageObjects(storagePaths: string[]): Promise<void> {
  if (storagePaths.length === 0) {
    return;
  }

  const { error } = await supabaseStorageClient.storage.from(env.SUPABASE_STORAGE_BUCKET).remove(storagePaths);
  if (error) {
    logger.error({ storagePaths, error: error.message }, "Failed to remove storage objects");
  }
}
