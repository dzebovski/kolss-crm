import { createClient } from "@/lib/supabase/server";

export type DashboardWorkItemKind =
  | "callback_overdue"
  | "callback_today"
  | "new_unassigned"
  | "stale_approval";

export type DashboardWorkItem = {
  kind: DashboardWorkItemKind;
  entity_type: "lead" | "project";
  id: string;
  title: string;
  detail: string;
  due_at: string | null;
  created_at: string;
  office_id: string;
  office_code: string;
  office_name: string;
};

export type DashboardRecentLead = {
  id: string;
  name: string;
  phone: string | null;
  product_interest: string | null;
  lead_status: string;
  created_at: string;
  office_id: string;
  office_code: string;
  office_name: string;
};

export type DashboardTeamMember = {
  id: string;
  display_name: string;
  offices: string[];
  active_leads: number;
  active_projects: number;
  overdue_callbacks: number;
};

export type DashboardOverview = {
  period_days: number;
  totals: {
    leads_created: number;
    leads_new: number;
    leads_in_progress: number;
    leads_converted: number;
    leads_failed: number;
    active_projects: number;
    completed_projects: number;
    callback_overdue: number;
    callback_today: number;
    new_unassigned: number;
    stale_approvals: number;
  };
  leads_by_status: Record<string, number>;
  projects_by_status: Record<string, number>;
  work_items: DashboardWorkItem[];
  recent_leads: DashboardRecentLead[];
  team: DashboardTeamMember[];
};

export async function getDashboardOverview({
  officeId,
  periodDays = 30,
}: {
  officeId?: string;
  periodDays?: number;
} = {}): Promise<DashboardOverview> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_dashboard_overview", {
    p_office_id: officeId,
    p_period_days: periodDays,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (typeof data !== "object" || data === null) {
    throw new Error("Dashboard overview unavailable");
  }

  return data as unknown as DashboardOverview;
}
