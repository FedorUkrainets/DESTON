import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

let serverClient: SupabaseClient | null = null;
let publicClient: SupabaseClient | null = null;

/**
 * Server-side Supabase client (service role). Used for admin operations such as
 * uploading product images. NEVER expose to the browser.
 */
export function getSupabaseServer(): SupabaseClient | null {
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return null;
  if (serverClient) return serverClient;
  serverClient = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
  return serverClient;
}

/**
 * Anonymous, read-only client. Safe for the browser.
 */
export function getSupabasePublic(): SupabaseClient | null {
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return null;
  if (publicClient) return publicClient;
  publicClient = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  });
  return publicClient;
}

export const supabaseBucket = env.SUPABASE_BUCKET;
