"use server";

import { revalidateLeads, revalidateProjects } from "@/lib/cache-tags";
import { getAuthenticatedActionContext } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { enqueueLeadNotifications } from "@/services/notifications/enqueue";
import { processPendingNotifications } from "@/services/notifications/process";
import { normalizePhoneForOffice } from "@/lib/phone";
import { formatSupabaseError } from "@/lib/errors";
import { uploadLeadAttachments } from "@/services/storage/lead-attachments";
import { computeNoAnswerDueAt } from "@/lib/task-scheduling";
import { parseOptionalDecimal, validatePriceLossFields } from "@/lib/validation";

async function insertLeadEvent(
  supabase: Awaited<ReturnType<typeof createClient>>,
  leadId: string,
  actorId: string,
  eventType: string,
  oldValue?: Record<string, unknown> | null,
  newValue?: Record<string, unknown> | null
) {
  await supabase.from("lead_events").insert({
    lead_id: leadId,
    actor_id: actorId,
    event_type: eventType,
    old_value: oldValue ?? null,
    new_value: newValue ?? null,
  });
}

export async function takeLeadInProgress(leadId: string) {
  const { supabase, user } = await getAuthenticatedActionContext();

  const { error } = await supabase.rpc("take_lead_in_progress", {
    p_lead_id: leadId,
    p_actor_id: user.id,
  });

  if (error) throw new Error(error.message);

  revalidateLeads(leadId);
}

export async function recordNoAnswer(leadId: string) {
  const { supabase, user } = await getAuthenticatedActionContext();

  const { data: lead } = await supabase
    .from("leads")
    .select("lead_status, assigned_to, office_id, offices(code)")
    .eq("id", leadId)
    .single();

  if (!lead) throw new Error("Lead not found");
  if (lead.lead_status !== "in_progress") {
    throw new Error('Доступно лише для лідів у статусі «В роботі»');
  }

  const officeJoined = lead.offices as { code: string } | { code: string }[] | null;
  const officeCode = Array.isArray(officeJoined)
    ? officeJoined[0]?.code
    : officeJoined?.code;

  const dueAt = computeNoAnswerDueAt(new Date(), officeCode ?? "kyiv");

  const { error: updateErr } = await supabase
    .from("leads")
    .update({ callback_due_at: dueAt.toISOString() })
    .eq("id", leadId);

  if (updateErr) throw updateErr;

  await insertLeadEvent(supabase, leadId, user.id, "no_answer", null, {
    callback_due_at: dueAt.toISOString(),
  });

  revalidateLeads(leadId);
}

export async function clearCallbackDue(leadId: string) {
  const { supabase, user } = await getAuthenticatedActionContext();

  const { data: lead } = await supabase
    .from("leads")
    .select("callback_due_at, lead_status")
    .eq("id", leadId)
    .single();

  if (!lead) throw new Error("Lead not found");
  if (!lead.callback_due_at) return;

  const { error } = await supabase
    .from("leads")
    .update({ callback_due_at: null })
    .eq("id", leadId);

  if (error) throw error;

  await insertLeadEvent(supabase, leadId, user.id, "callback_cleared", null, {
    lead_status: lead.lead_status,
  });

  revalidateLeads(leadId);
}

export async function markLeadFailed(
  leadId: string,
  lossReason: string,
  estimatedBudget?: string,
  ourQuote?: string
) {
  const { supabase, user } = await getAuthenticatedActionContext();
  if (!lossReason) throw new Error("Оберіть причину відмови");

  const budget = parseOptionalDecimal(estimatedBudget);
  const quote = parseOptionalDecimal(ourQuote);
  const priceErr = validatePriceLossFields(lossReason, budget, quote);
  if (priceErr) throw new Error(priceErr);

  const { error } = await supabase.rpc("mark_lead_failed", {
    p_lead_id: leadId,
    p_actor_id: user.id,
    p_loss_reason: lossReason,
    p_estimated_budget: budget,
    p_our_quote: quote,
  });

  if (error) throw new Error(error.message);

  revalidateLeads(leadId);
}

export async function convertLeadToProject(leadId: string) {
  const { supabase, user } = await getAuthenticatedActionContext();

  const { data: lead } = await supabase
    .from("leads")
    .select("*")
    .eq("id", leadId)
    .single();

  if (!lead) throw new Error("Lead not found");
  if (lead.lead_status === "converted") {
    throw new Error("Проєкт уже створено");
  }
  if (lead.lead_status === "failed") {
    throw new Error("Невдалий лід не можна конвертувати");
  }

  const now = new Date().toISOString();
  const productType = lead.product_interest || null;

  const { data: project, error: projectErr } = await supabase
    .from("projects")
    .insert({
      lead_id: leadId,
      office_id: lead.office_id,
      status: "needs_discovery",
      status_changed_at: now,
      last_activity_at: now,
      product_type: productType,
      product_details:
        productType === "home_furniture" || productType === "other"
          ? lead.order_comment
          : null,
      assigned_to: lead.assigned_to ?? user.id,
    })
    .select("id")
    .single();

  if (projectErr || !project) {
    throw new Error(
      formatSupabaseError(projectErr, "Не вдалося створити проєкт")
    );
  }

  const { error: leadErr } = await supabase
    .from("leads")
    .update({
      lead_status: "converted",
      lead_status_changed_at: now,
      converted_project_id: project.id,
      assigned_to: lead.assigned_to ?? user.id,
    })
    .eq("id", leadId);

  if (leadErr) throw leadErr;

  await insertLeadEvent(
    supabase,
    leadId,
    user.id,
    "converted_to_project",
    { lead_status: lead.lead_status },
    { lead_status: "converted", project_id: project.id }
  );

  revalidateLeads(leadId);
  revalidateProjects(project.id);

  return project.id;
}

export async function addLeadComment(
  leadId: string,
  leadStatus: string,
  body: string
) {
  const { supabase, user } = await getAuthenticatedActionContext();
  if (!body.trim()) throw new Error("Коментар порожній");

  const { error } = await supabase.from("lead_comments").insert({
    lead_id: leadId,
    author_id: user.id,
    lead_status: leadStatus,
    body: body.trim(),
  });

  if (error) throw error;
  revalidateLeads(leadId);
}

async function resolveOfficeIdForCreate(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  requestedOfficeId: string
): Promise<string> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (profile?.role === "super_admin") return requestedOfficeId;

  const { data: memberships } = await supabase
    .from("user_office_memberships")
    .select("office_id")
    .eq("user_id", userId);

  const allowed = memberships?.map((m) => m.office_id) ?? [];
  if (allowed.includes(requestedOfficeId)) return requestedOfficeId;
  if (allowed.length === 1) return allowed[0];
  throw new Error("Немає доступу до цього офісу");
}

function str(fd: FormData, key: string): string | undefined {
  const v = fd.get(key);
  if (typeof v !== "string" || !v.trim()) return undefined;
  return v.trim();
}

function filesFromFormData(fd: FormData): File[] {
  return fd
    .getAll("attachments")
    .filter((f): f is File => f instanceof File && f.size > 0);
}

function parseRecordedAt(formData: FormData): string {
  const iso = str(formData, "recorded_at");
  if (iso) {
    const d = new Date(iso);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  return new Date().toISOString();
}

export async function createManualLead(formData: FormData) {
  const { supabase, user } = await getAuthenticatedActionContext();

  const requestedOfficeId = str(formData, "office_id");
  if (!requestedOfficeId) throw new Error("Оберіть офіс");

  const officeId = await resolveOfficeIdForCreate(
    supabase,
    user.id,
    requestedOfficeId
  );

  const { data: officeRow } = await supabase
    .from("offices")
    .select("code")
    .eq("id", officeId)
    .single();

  const officeCode = officeRow?.code ?? "kyiv";
  const rawPhone = str(formData, "phone") ?? "";
  const phone =
    normalizePhoneForOffice(rawPhone, officeCode) ?? rawPhone.trim();

  const externalId = `manual:${crypto.randomUUID()}`;
  const recordedAt = parseRecordedAt(formData);

  const { data: lead, error } = await supabase
    .from("leads")
    .insert({
      office_id: officeId,
      source_system: "manual",
      external_lead_id: externalId,
      lead_status: "new",
      created_at: recordedAt,
      lead_status_changed_at: recordedAt,
      name: str(formData, "name") ?? "",
      phone: phone || null,
      email: str(formData, "email") || null,
      city_region: str(formData, "city_region") || null,
      product_interest: str(formData, "product_interest") || null,
      order_comment: str(formData, "order_comment") || null,
      project_stage_source: str(formData, "project_stage_source") || null,
      stage_comment: str(formData, "stage_comment") || null,
      raw_payload: { source: "manual", recorded_at: recordedAt },
    })
    .select("id, name, phone, email, product_interest, office_id, source_system")
    .single();

  if (error) {
    throw new Error(formatSupabaseError(error, "Не вдалося створити лід"));
  }

  const attachmentFiles = filesFromFormData(formData);
  if (attachmentFiles.length) {
    try {
      await uploadLeadAttachments(
        supabase,
        lead.id,
        officeId,
        user.id,
        attachmentFiles
      );
    } catch (uploadErr) {
      await supabase.from("leads").delete().eq("id", lead.id);
      throw uploadErr;
    }
  }

  const { error: eventError } = await supabase.from("lead_events").insert({
    lead_id: lead.id,
    actor_id: user.id,
    event_type: "created",
    new_value: {
      source: "manual",
      attachments_count: attachmentFiles.length,
    },
  });

  if (eventError) {
    throw new Error(formatSupabaseError(eventError, "Не вдалося записати подію"));
  }

  const admin = createAdminClient();
  await enqueueLeadNotifications(admin, lead, officeRow ?? null);
  await processPendingNotifications(admin);

  revalidateLeads();
  return lead.id;
}
