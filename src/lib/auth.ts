import { cache } from "react";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { resolveVerifiedUser } from "@/lib/supabase/session-user";
import { perfAsync } from "@/lib/perf";
import { canManageUsers } from "@/lib/roles";
import { RETURN_TO_HEADER, safeAppReturnTo } from "@/lib/navigation";
import type { Profile, UserRole } from "@/lib/types/database";

export type SessionContext = {
  user: { id: string; email?: string };
  profile: Profile;
};

export const getSessionContext = cache(async (): Promise<SessionContext | null> => {
  return perfAsync("auth.getSessionContext", async () => {
    const supabase = await createClient();
    const user = await resolveVerifiedUser(supabase);
    if (!user) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, role, display_name, is_active, deactivated_at, created_at, updated_at")
      .eq("id", user.id)
      .single();

    if (!profile) return null;

    return {
      user: { id: user.id, email: user.email },
      profile: profile as Profile,
    };
  });
});

export async function requireAuth(): Promise<SessionContext> {
  const ctx = await getSessionContext();
  if (!ctx) {
    const headerStore = await headers();
    const returnTo = safeAppReturnTo(headerStore.get(RETURN_TO_HEADER));
    redirect(`/login?next=${encodeURIComponent(returnTo)}`);
  }
  if (!ctx.profile.is_active) {
    const headerStore = await headers();
    const returnTo = safeAppReturnTo(headerStore.get(RETURN_TO_HEADER));
    redirect(
      `/login?error=deactivated&next=${encodeURIComponent(returnTo)}`
    );
  }
  return ctx;
}

export async function requireSuperAdmin(): Promise<SessionContext> {
  const ctx = await requireAuth();
  if (!canManageUsers(ctx.profile.role)) redirect("/app/dashboard");
  return ctx;
}

export async function assertSuperAdminAction(): Promise<SessionContext> {
  const ctx = await getSessionContext();
  if (!ctx) throw new Error("Unauthorized");
  if (!ctx.profile.is_active) throw new Error("Обліковий запис деактивовано");
  if (!canManageUsers(ctx.profile.role)) throw new Error("Forbidden");
  return ctx;
}

export function isSuperAdminRole(role: UserRole | string | null | undefined): boolean {
  return role === "super_admin";
}

export async function getAuthenticatedActionContext() {
  const ctx = await getSessionContext();
  if (!ctx) throw new Error("Unauthorized");
  if (!ctx.profile.is_active) throw new Error("Обліковий запис деактивовано");
  const supabase = await createClient();
  return { supabase, user: ctx.user, profile: ctx.profile };
}
