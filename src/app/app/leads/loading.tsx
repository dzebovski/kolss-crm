import { getTranslations } from "next-intl/server";
import { LeadsListSkeleton } from "@/components/skeletons/page-skeletons";

export default async function LeadsLoading() {
  const t = await getTranslations("common");
  return <LeadsListSkeleton ariaLabel={t("loading")} />;
}
