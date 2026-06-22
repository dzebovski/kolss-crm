import { createClient } from "@/lib/supabase/server";

export async function getLeadContactAttempts(leadId: string) {
  const supabase = await createClient();
  return supabase
    .from("lead_contact_attempts")
    .select("*, profiles(display_name)")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false });
}

export async function getLeadTasks(leadId: string) {
  const supabase = await createClient();
  return supabase
    .from("tasks")
    .select("*, profiles:created_by(display_name)")
    .eq("entity_type", "lead")
    .eq("entity_id", leadId)
    .order("due_at", { ascending: true });
}

export async function getLeadShowroomVisits(leadId: string) {
  const supabase = await createClient();
  return supabase
    .from("lead_showroom_visits")
    .select("*, profiles:created_by(display_name)")
    .eq("lead_id", leadId)
    .order("scheduled_at", { ascending: false });
}

export async function getLeadContracts(leadId: string) {
  const supabase = await createClient();
  return supabase
    .from("lead_contracts")
    .select("*, profiles:created_by(display_name)")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false });
}

export async function getLeadPayments(leadId: string) {
  const supabase = await createClient();
  return supabase
    .from("lead_payments")
    .select("*, profiles:created_by(display_name)")
    .eq("lead_id", leadId)
    .order("paid_at", { ascending: false });
}

export async function findDuplicateLeads(
  officeId: string,
  phone: string | null,
  email: string | null
) {
  const supabase = await createClient();
  if (!phone && !email) return { data: [], error: null };

  let query = supabase
    .from("leads")
    .select("id, name, phone, email, workflow_status, created_at")
    .eq("office_id", officeId)
    .limit(5);

  const filters: string[] = [];
  if (phone) filters.push(`phone.eq.${phone}`);
  if (email) filters.push(`email.eq.${email}`);
  if (filters.length) {
    query = query.or(filters.join(","));
  }

  return query;
}
