import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/supabase";
import { getSupabaseServiceRoleKey, getSupabaseUrl } from "./env";

export function createAdminClient() {
  const key = getSupabaseServiceRoleKey();
  if (!key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY не знайдено. Додайте ключ у .env.local і перезапустіть npm run dev"
    );
  }
  return createClient<Database>(getSupabaseUrl(), key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Service role client for storage ops (bypasses storage RLS). */
export function createStorageAdminClient() {
  const key = getSupabaseServiceRoleKey();
  if (!key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY не знайдено. Додайте ключ у .env.local і перезапустіть npm run dev"
    );
  }
  return createClient<Database>(getSupabaseUrl(), key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
