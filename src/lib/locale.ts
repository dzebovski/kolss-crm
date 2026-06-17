import type { AppLocale } from "@/i18n/config";
import type { UserRole } from "@/lib/types/database";

export function resolveLocaleFromUser(
  role: UserRole | string,
  officeCodes: string[]
): AppLocale {
  if (role === "super_admin") return "en";
  if (officeCodes.includes("warsaw")) return "pl";
  return "uk";
}
