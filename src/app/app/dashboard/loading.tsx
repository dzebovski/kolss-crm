import { getTranslations } from "next-intl/server";
import { DashboardSkeleton } from "@/components/skeletons/page-skeletons";

export default async function DashboardLoading() {
  const t = await getTranslations("common");
  return <DashboardSkeleton ariaLabel={t("loading")} />;
}
