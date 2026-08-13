import { createClient } from "@supabase/supabase-js";
import { env } from "./env.js";

export const supabaseAuthClient = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});

// Service-role client for server-side Storage writes — the app enforces file
// ownership itself (storage paths are prefixed with userId), the same way it
// enforces row ownership on direct Postgres queries rather than relying on RLS.
export const supabaseStorageClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});
