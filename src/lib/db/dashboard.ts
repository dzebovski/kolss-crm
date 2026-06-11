import { createClient } from "@/lib/supabase/server";

export type DashboardStats = {
  leads_by_status: Record<string, number>;
  projects_by_status: Record<string, number>;
  callback_overdue: number;
  total_leads: number;
  total_projects: number;
};

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_dashboard_stats");

  if (error) {
    throw new Error(error.message);
  }

  if (typeof data !== "object" || data === null) {
    throw new Error("Dashboard stats unavailable");
  }

  return data as DashboardStats;
}
