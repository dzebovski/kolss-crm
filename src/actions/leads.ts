"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { enqueueLeadNotifications } from "@/services/notifications/enqueue";

export async function updateLeadStatus(leadId: string, crmStatus: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: lead } = await supabase
    .from("leads")
    .select("crm_status")
    .eq("id", leadId)
    .single();

  if (!lead) throw new Error("Lead not found");

  const { error: updateErr } = await supabase
    .from("leads")
    .update({ crm_status: crmStatus })
    .eq("id", leadId);

  if (updateErr) throw updateErr;

  await supabase.from("lead_events").insert({
    lead_id: leadId,
    actor_id: user.id,
    event_type: "status_change",
    old_value: { crm_status: lead.crm_status },
    new_value: { crm_status: crmStatus },
  });

  revalidatePath(`/app/leads/${leadId}`);
  revalidatePath("/app/leads");
}

export async function addLeadComment(
  leadId: string,
  pipelineStage: string,
  body: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  if (!body.trim()) throw new Error("Коментар порожній");

  const { error } = await supabase.from("lead_comments").insert({
    lead_id: leadId,
    author_id: user.id,
    pipeline_stage: pipelineStage,
    body: body.trim(),
  });

  if (error) throw error;
  revalidatePath(`/app/leads/${leadId}`);
}

export type CreateLeadInput = {
  office_id: string;
  name: string;
  phone: string;
  email?: string;
  product_interest?: string;
  project_stage_source?: string;
};

export async function createManualLead(input: CreateLeadInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const externalId = `manual:${crypto.randomUUID()}`;

  const { data: lead, error } = await supabase
    .from("leads")
    .insert({
      office_id: input.office_id,
      source_system: "manual",
      external_lead_id: externalId,
      crm_status: "new",
      name: input.name,
      phone: input.phone,
      email: input.email || null,
      product_interest: input.product_interest || null,
      project_stage_source: input.project_stage_source || null,
      raw_payload: { source: "manual" },
    })
    .select("id, name, phone, email, product_interest, office_id")
    .single();

  if (error) throw error;

  await supabase.from("lead_events").insert({
    lead_id: lead.id,
    actor_id: user.id,
    event_type: "created",
    new_value: { source: "manual" },
  });

  const admin = createAdminClient();
  const { data: office } = await admin
    .from("offices")
    .select("code")
    .eq("id", lead.office_id)
    .single();
  await enqueueLeadNotifications(admin, lead, office);

  revalidatePath("/app/leads");
  return lead.id;
}
