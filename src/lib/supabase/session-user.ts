import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/supabase";

export type VerifiedAuthUser = {
  id: string;
  email?: string;
};

type ClaimsPayload = {
  sub?: string;
  email?: string;
};

/**
 * Resolves the authenticated user from the session JWT locally when possible
 * (asymmetric signing keys), falling back to a network getUser() call.
 */
export async function resolveVerifiedUser(
  supabase: SupabaseClient<Database>
): Promise<VerifiedAuthUser | null> {
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();

  if (!claimsError && claimsData?.claims) {
    const claims = claimsData.claims as ClaimsPayload;
    if (claims.sub) {
      return { id: claims.sub, email: claims.email };
    }
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;
  return { id: user.id, email: user.email };
}
