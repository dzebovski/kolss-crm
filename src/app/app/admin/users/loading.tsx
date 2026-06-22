import { getTranslations } from "next-intl/server";
import { AdminUsersSkeleton } from "@/components/skeletons/page-skeletons";

export default async function AdminUsersLoading() {
  const t = await getTranslations("common");
  return <AdminUsersSkeleton ariaLabel={t("loading")} />;
}
