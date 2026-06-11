import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import type { LeadStatus, Office, ProjectStage } from "@/lib/types/database";

// Reference lookups are identical for all authenticated users (RLS: select using true).
// Admin client avoids cookies() inside unstable_cache, which Next.js forbids.
async function fetchActiveOffices(): Promise<Office[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("offices")
    .select("*")
    .eq("is_active", true)
    .order("code");
  return (data as Office[]) ?? [];
}

async function fetchLeadStatuses(): Promise<LeadStatus[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("lead_statuses")
    .select("*")
    .order("sort_order");
  return (data as LeadStatus[]) ?? [];
}

async function fetchProjectStages(): Promise<ProjectStage[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("project_stages")
    .select("*")
    .order("sort_order");
  return (data as ProjectStage[]) ?? [];
}

export const getActiveOffices = unstable_cache(
  fetchActiveOffices,
  ["ref-offices"],
  { revalidate: 3600, tags: ["ref-offices"] }
);

export const getLeadStatuses = unstable_cache(
  fetchLeadStatuses,
  ["ref-lead-statuses"],
  { revalidate: 3600, tags: ["ref-lead-statuses"] }
);

export const getProjectStages = unstable_cache(
  fetchProjectStages,
  ["ref-project-stages"],
  { revalidate: 3600, tags: ["ref-project-stages"] }
);

export async function getLeadStatusMap(): Promise<Map<string, string>> {
  const statuses = await getLeadStatuses();
  return new Map(statuses.map((s) => [s.code, s.label_uk]));
}

export async function getProjectStageMap(): Promise<Map<string, string>> {
  const stages = await getProjectStages();
  return new Map(stages.map((s) => [s.code, s.label_uk]));
}
