import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { canManageUsers } from "@/lib/roles";
import type { Profile, UserRole } from "@/lib/types/database";

export type SessionContext = {
  user: { id: string; email?: string };
  profile: Profile;
};

export const getSessionContext = cache(async (): Promise<SessionContext | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
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

export async function requireAuth(): Promise<SessionContext> {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/login");
  if (!ctx.profile.is_active) redirect("/login?error=deactivated");
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
