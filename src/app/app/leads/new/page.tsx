import { createClient } from "@/lib/supabase/server";
import { CreateLeadForm } from "@/components/create-lead-form";
import type { Office } from "@/lib/types/database";

export default async function NewLeadPage() {
  const supabase = await createClient();
  const { data: offices } = await supabase
    .from("offices")
    .select("*")
    .eq("is_active", true)
    .order("code");

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Новий лід</h1>
      <CreateLeadForm offices={(offices as Office[]) ?? []} />
    </div>
  );
}
