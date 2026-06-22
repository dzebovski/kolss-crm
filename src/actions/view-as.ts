"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { assertSuperAdminAction } from "@/lib/auth";
import {
  VIEW_AS_COOKIE,
  isViewAsMode,
  localeForViewAs,
  type ViewAsMode,
} from "@/lib/view-as";
import { isAppLocale } from "@/i18n/config";

export async function setViewAsMode(mode: ViewAsMode) {
  await assertSuperAdminAction();
  if (!isViewAsMode(mode)) throw new Error("Invalid view mode");

  const cookieStore = await cookies();
  const cookieOptions = {
    path: "/",
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24 * 365,
  };

  cookieStore.set(VIEW_AS_COOKIE, mode, cookieOptions);

  const locale = localeForViewAs(mode);
  if (isAppLocale(locale)) {
    cookieStore.set("kolss_locale", locale, cookieOptions);
  }

  revalidatePath("/app", "layout");
}
