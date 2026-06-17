import { CustomerCard } from "@/components/customer/customer-card";
import { notFound } from "next/navigation";
import { getLeadById } from "@/lib/db/leads";

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { data: lead, error } = await getLeadById(id);
  if (error || !lead) notFound();

  return <CustomerCard leadId={id} />;
}
