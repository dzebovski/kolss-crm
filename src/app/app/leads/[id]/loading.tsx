import { getTranslations } from "next-intl/server";
import { LeadDetailSkeleton } from "@/components/skeletons/page-skeletons";

export default async function LeadDetailLoading() {
  const t = await getTranslations("common");
  return <LeadDetailSkeleton ariaLabel={t("loading")} />;
}
