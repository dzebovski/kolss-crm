import { redirect } from "next/navigation";
import { requireSuperAdmin } from "@/lib/auth";
import { resolveEffectiveContext } from "@/lib/queries/effective-context";

export default async function DesignLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await requireSuperAdmin();
  const effective = await resolveEffectiveContext(ctx);
  if (!effective.showAdminNav) redirect("/app/dashboard");
  return <>{children}</>;
}
