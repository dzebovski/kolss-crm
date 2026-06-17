import { createClient } from "@/lib/supabase/server";
import type { Lead } from "@/lib/types/database";

export const LEAD_LIST_COLUMNS =
  "id, name, phone, email, workflow_status, office_id, next_task_due_at, next_task_title, created_at, workflow_status_changed_at, assigned_to, source_channel, source_system, offices(code, name_uk), profiles:assigned_to(display_name)";

export type LeadListFilters = {
  officeId?: string;
  status?: string;
  callbackOnly?: boolean;
  offset: number;
  limit: number;
};

export async function listLeads(filters: LeadListFilters) {
  const supabase = await createClient();

  let query = supabase
    .from("leads")
    .select(LEAD_LIST_COLUMNS, { count: "exact" })
    .order("created_at", { ascending: false })
    .range(filters.offset, filters.offset + filters.limit - 1);

  if (filters.officeId) {
    query = query.eq("office_id", filters.officeId);
  }
  if (filters.status) {
    query = query.eq("workflow_status", filters.status);
  }
  if (filters.callbackOnly) {
    query = query.in("workflow_status", ["callback_required", "in_work"]).not(
      "next_task_due_at",
      "is",
      null
    );
  }

  return query;
}

export async function getLeadById(id: string) {
  const supabase = await createClient();
  return supabase
    .from("leads")
    .select("*, offices(code, name_uk), profiles:assigned_to(display_name)")
    .eq("id", id)
    .single();
}

export async function getLeadComments(leadId: string) {
  const supabase = await createClient();
  return supabase
    .from("lead_comments")
    .select("*, profiles(display_name)")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false });
}

export async function getLeadEvents(leadId: string) {
  const supabase = await createClient();
  return supabase
    .from("lead_events")
    .select("*, profiles(display_name)")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false });
}

export async function getLeadAttachments(leadId: string) {
  const supabase = await createClient();
  return supabase
    .from("lead_attachments")
    .select("*")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false });
}

export type LeadWithOffice = Lead & {
  offices: { name_uk: string; code: string } | { name_uk: string; code: string }[];
};
