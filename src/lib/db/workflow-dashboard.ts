import { createClient } from "@/lib/supabase/server";

export type WorkflowQueueItem = {
  id: string;
  name: string | null;
  phone: string | null;
  workflow_status: string;
  source_channel: string | null;
  next_task_due_at: string | null;
  next_task_title?: string | null;
  created_at?: string;
  is_overdue?: boolean;
};

export type WorkflowDashboard = {
  period_days: number;
  totals: Record<string, number>;
  prepayments_by_currency: Record<string, number>;
  funnel: Record<string, number>;
  queues: {
    new_leads: WorkflowQueueItem[];
    callbacks: WorkflowQueueItem[];
    no_show: WorkflowQueueItem[];
    scheduled_showroom: WorkflowQueueItem[];
    contract_prepay: WorkflowQueueItem[];
  };
};

export async function getWorkflowDashboard({
  officeId,
  managerId,
  periodDays = 30,
}: {
  officeId?: string;
  managerId?: string;
  periodDays?: number;
} = {}): Promise<WorkflowDashboard> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_workflow_dashboard", {
    p_office_id: officeId,
    p_manager_id: managerId,
    p_period_days: periodDays,
  });

  if (error) throw new Error(error.message);
  return data as unknown as WorkflowDashboard;
}
