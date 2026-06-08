import { createClient } from "@supabase/supabase-js";
import {
  getSupabaseAnonKey,
  getSupabaseServiceRoleKey,
  getSupabaseUrl,
} from "./env";

export function createAdminClient() {
  const key = getSupabaseServiceRoleKey() ?? getSupabaseAnonKey();
  return createClient(getSupabaseUrl(), key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
