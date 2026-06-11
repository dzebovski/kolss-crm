import { unstable_cache } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type DashboardStats = {
  leads_by_status: Record<string, number>;
  projects_by_status: Record<string, number>;
  callback_overdue: number;
  total_leads: number;
  total_projects: number;
};

async function fetchDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_dashboard_stats");

  if (error || !data) {
    return {
      leads_by_status: {},
      projects_by_status: {},
      callback_overdue: 0,
      total_leads: 0,
      total_projects: 0,
    };
  }

  return data as DashboardStats;
}

export const getDashboardStats = unstable_cache(
  fetchDashboardStats,
  ["dashboard-stats"],
  { revalidate: 300, tags: ["dashboard"] }
);
