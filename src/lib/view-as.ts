import { cookies } from "next/headers";
import type { AppLocale } from "@/i18n/config";
import { isSuperAdminRole } from "@/lib/auth";
import type { SessionContext } from "@/lib/auth";

export const VIEW_AS_COOKIE = "kolss_view_as";

export type ViewAsMode = "super_admin" | "kyiv" | "warsaw";

export function isViewAsMode(value: string | undefined): value is ViewAsMode {
  return value === "super_admin" || value === "kyiv" || value === "warsaw";
}

export function localeForViewAs(mode: ViewAsMode): AppLocale {
  if (mode === "warsaw") return "pl";
  if (mode === "kyiv") return "uk";
  return "en";
}

export async function getViewAsModeForUser(
  ctx: SessionContext
): Promise<ViewAsMode | null> {
  if (!isSuperAdminRole(ctx.profile.role)) return null;

  const cookieStore = await cookies();
  const raw = cookieStore.get(VIEW_AS_COOKIE)?.value;
  return isViewAsMode(raw) ? raw : "super_admin";
}

export function viewAsModeFromCookie(
  role: string | undefined,
  cookieValue: string | undefined
): ViewAsMode | null {
  if (role !== "super_admin") return null;
  return isViewAsMode(cookieValue) ? cookieValue : "super_admin";
}
