import { createClient } from "@/lib/supabase/server";

export type WorkflowQueueItem = {
  id: string;
  event_id?: string;
  name: string | null;
  phone: string | null;
  workflow_status: string;
  source_channel: string | null;
  next_task_due_at: string | null;
  next_task_title?: string | null;
  task_type?: string | null;
  office_code?: string | null;
  created_at?: string;
  is_overdue?: boolean;
};

export type WorkflowDashboard = {
  period_from: string;
  period_to: string;
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
  from,
  to,
  supabase: client,
}: {
  officeId?: string;
  managerId?: string;
  from: string;
  to: string;
  supabase?: Awaited<ReturnType<typeof import("@/lib/supabase/server").createClient>>;
}): Promise<WorkflowDashboard> {
  const supabase = client ?? (await createClient());
  const { data, error } = await supabase.rpc("get_workflow_dashboard", {
    p_office_id: officeId,
    p_manager_id: managerId,
    p_from: from,
    p_to: to,
  });

  if (error) throw new Error(error.message);
  return data as unknown as WorkflowDashboard;
}
