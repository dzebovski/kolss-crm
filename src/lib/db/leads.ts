import { createClient } from "@/lib/supabase/server";
import type { Lead } from "@/lib/types/database";

export const LEAD_LIST_COLUMNS =
  "id, name, phone, email, lead_status, office_id, callback_due_at, created_at, lead_status_changed_at, assigned_to, offices(code, name_uk)";

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
    query = query.eq("lead_status", filters.status);
  }
  if (filters.callbackOnly) {
    query = query.not("callback_due_at", "is", null);
  }

  return query;
}

export async function getLeadById(id: string) {
  const supabase = await createClient();
  return supabase
    .from("leads")
    .select("*, offices(code, name_uk)")
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
