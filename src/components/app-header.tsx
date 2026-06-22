import { getTranslations } from "next-intl/server";
import { getSessionContext } from "@/lib/auth";
import { resolveEffectiveContext } from "@/lib/queries/effective-context";
import { AppShell } from "@/components/app-shell";

export async function AppHeader({ children }: { children: React.ReactNode }) {
  const ctx = await getSessionContext();
  const effective = ctx ? await resolveEffectiveContext(ctx) : null;
  const t = await getTranslations("nav");
  const tr = await getTranslations("roles");
  const tv = await getTranslations("viewAs");
  const ts = await getTranslations("search");

  const showAdminNav = effective?.showAdminNav ?? false;
  const viewAs = effective?.viewAs;
  const officeCode =
    effective?.forcedOfficeCode ??
    (effective?.officeCtx.userOffices.length === 1
      ? effective.officeCtx.userOffices[0]?.code
      : undefined);

  return (
    <AppShell
      userName={ctx?.profile.display_name ?? ctx?.user.email ?? "—"}
      roleLabel={effective?.effectiveRole ? tr(effective.effectiveRole) : "—"}
      officeCode={officeCode}
      viewAs={viewAs}
      previewLabel={viewAs && viewAs !== "super_admin" ? tv("preview") : undefined}
      showAdminNav={showAdminNav}
      labels={{
        dashboard: t("dashboard"),
        leads: t("leads"),
        newLead: t("newLead"),
        users: t("users"),
        design: t("design"),
        navigation: t("navigation"),
        account: t("account"),
        close: t("close"),
        searchPlaceholder: ts("placeholder"),
        searchEmpty: ts("empty"),
        searchHint: ts("hint"),
        searchLoading: ts("loading"),
      }}
    >
      {children}
    </AppShell>
  );
}
