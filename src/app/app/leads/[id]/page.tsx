import { CustomerCard } from "@/components/customer/customer-card";
import { notFound } from "next/navigation";
import { getLeadPageData } from "@/lib/db/lead-detail";

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getLeadPageData(id);
  if (!data) notFound();

  return <CustomerCard data={data} />;
}
