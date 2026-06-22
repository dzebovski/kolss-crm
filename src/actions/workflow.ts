"use server";

import { getAuthenticatedActionContext } from "@/lib/auth";
import { LEAD_CACHE_SCOPES } from "@/lib/cache-tags";
import { createClient } from "@/lib/supabase/server";
import { finishLeadMutation } from "@/lib/lead-mutations";
import {
  computeCallbackDueAt,
  computeNextDayCallbackAt,
} from "@/lib/task-scheduling";
import type { ContactResult, LeadActivityType, LeadQuality, PaymentCurrency, TaskType } from "@/lib/workflow";
import { CONTACT_RESULTS, LEAD_ACTIVITY_TYPES, LEAD_QUALITIES, PAYMENT_CURRENCIES } from "@/lib/workflow";
import type { Json } from "@/lib/types/supabase";
import type { TaskSource } from "@/lib/types/database";
import { parseOptionalDecimal } from "@/lib/validation";
import { normalizePhoneForOffice } from "@/lib/phone";
import { z } from "zod";
import { perfAsync } from "@/lib/perf";

type Supabase = Awaited<ReturnType<typeof createClient>>;

const MUTATION_SNAPSHOT = { includeAttachments: false } as const;
const FINISH_FULL = {
  invalidate: LEAD_CACHE_SCOPES.full,
  snapshot: MUTATION_SNAPSHOT,
} as const;
const FINISH_LIST = {
  invalidate: LEAD_CACHE_SCOPES.listOnly,
  snapshot: MUTATION_SNAPSHOT,
} as const;
const FINISH_NONE = {
  invalidate: LEAD_CACHE_SCOPES.none,
  snapshot: MUTATION_SNAPSHOT,
} as const;

async function getLeadWithOffice(supabase: Supabase, leadId: string) {
  const { data, error } = await supabase
    .from("leads")
    .select("*, offices(code)")
    .eq("id", leadId)
    .single();
  if (error || !data) throw new Error("Lead not found");
  const officeJoined = data.offices as { code: string } | { code: string }[] | null;
  const officeCode = Array.isArray(officeJoined)
    ? officeJoined[0]?.code
    : officeJoined?.code;
  return { lead: data, officeCode: officeCode ?? "kyiv" };
}

function requireComment(comment: string | undefined | null) {
  if (!comment?.trim()) throw new Error("Comment is required");
  return comment.trim();
}

async function logActivity(
  supabase: Supabase,
  leadId: string,
  actorId: string,
  eventType: string,
  comment?: string | null,
  oldValue?: Json | null,
  newValue?: Json | null
) {
  await supabase.from("lead_events").insert({
    lead_id: leadId,
    actor_id: actorId,
    event_type: eventType,
    comment: comment?.trim() || null,
    old_value: oldValue ?? null,
    new_value: newValue ?? null,
  });
}

async function updateWorkflowStatus(
  supabase: Supabase,
  leadId: string,
  status: string,
  extra: Record<string, unknown> = {}
) {
  const { error } = await supabase
    .from("leads")
    .update({
      workflow_status: status,
      workflow_status_changed_at: new Date().toISOString(),
      ...extra,
    })
    .eq("id", leadId);
  if (error) throw error;
}

async function syncNextTaskFromOpen(supabase: Supabase, leadId: string) {
  const { data: openTask } = await supabase
    .from("tasks")
    .select("id, title, due_at")
    .eq("entity_type", "lead")
    .eq("entity_id", leadId)
    .eq("status", "open")
    .order("due_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  await supabase
    .from("leads")
    .update({
      next_task_due_at: openTask?.due_at ?? null,
      next_task_title: openTask?.title ?? null,
    })
    .eq("id", leadId);
}

async function createLeadTask(
  supabase: Supabase,
  leadId: string,
  assigneeId: string | null,
  createdBy: string,
  title: string,
  dueAt: Date,
  taskType: TaskType,
  source: TaskSource
) {
  const { error } = await supabase.from("tasks").insert({
    entity_type: "lead",
    entity_id: leadId,
    assignee_id: assigneeId,
    title,
    due_at: dueAt.toISOString(),
    task_type: taskType,
    source,
    created_by: createdBy,
    status: "open",
  });
  if (error) throw error;
  await syncNextTaskFromOpen(supabase, leadId);
}

export async function takeLeadInWork(leadId: string) {
  const { supabase } = await getAuthenticatedActionContext();
  const { error } = await supabase.rpc("take_lead_in_work", { p_lead_id: leadId });
  if (error) throw new Error(error.message);
  return finishLeadMutation(leadId, FINISH_FULL);
}

export async function recordContactAttempt(
  leadId: string,
  result: ContactResult,
  comment: string
) {
  if (!CONTACT_RESULTS.includes(result)) throw new Error("Invalid call result");
  const body = requireComment(comment);

  const { supabase, user } = await getAuthenticatedActionContext();
  const { lead, officeCode } = await getLeadWithOffice(supabase, leadId);

  const { error: insertErr } = await supabase.from("lead_contact_attempts").insert({
    lead_id: leadId,
    manager_id: user.id,
    result,
    comment: body,
  });
  if (insertErr) throw insertErr;

  const oldStatus = lead.workflow_status;
  let newStatus = oldStatus;

  if (result === "reached") {
    newStatus = "contacted";
    await updateWorkflowStatus(supabase, leadId, newStatus, {
      callback_due_at: null,
    });
  } else if (result === "bad_lead") {
    newStatus = "bad_lead";
    await updateWorkflowStatus(supabase, leadId, newStatus, {
      lead_status: "failed",
      lead_status_changed_at: new Date().toISOString(),
      callback_due_at: null,
    });
  } else {
    newStatus = "callback_required";
    const dueAt = computeCallbackDueAt(new Date(), officeCode);
    await updateWorkflowStatus(supabase, leadId, newStatus, {
      callback_due_at: dueAt.toISOString(),
    });
    await createLeadTask(
      supabase,
      leadId,
      lead.assigned_to ?? user.id,
      user.id,
      "Callback",
      dueAt,
      "callback",
      "auto_callback"
    );
  }

  await logActivity(
    supabase,
    leadId,
    user.id,
    "contact_attempt",
    body,
    { workflow_status: oldStatus, result: null },
    { workflow_status: newStatus, result }
  );

  return finishLeadMutation(leadId, FINISH_FULL);
}

export async function scheduleShowroomVisit(
  leadId: string,
  scheduledAt: string,
  comment?: string
) {
  const { supabase, user } = await getAuthenticatedActionContext();
  const { lead } = await getLeadWithOffice(supabase, leadId);
  const when = new Date(scheduledAt);
  if (Number.isNaN(when.getTime())) throw new Error("Invalid date");

  const { error } = await supabase.from("lead_showroom_visits").insert({
    lead_id: leadId,
    scheduled_at: when.toISOString(),
    status: "scheduled",
    comment: comment?.trim() || null,
    created_by: user.id,
  });
  if (error) throw error;

  const oldStatus = lead.workflow_status;
  await updateWorkflowStatus(supabase, leadId, "showroom_scheduled");
  await createLeadTask(
    supabase,
    leadId,
    lead.assigned_to ?? user.id,
    user.id,
    "Showroom visit",
    when,
    "showroom_visit",
    "auto_showroom_visit"
  );

  await logActivity(
    supabase,
    leadId,
    user.id,
    "showroom_visit_scheduled",
    comment ?? null,
    { workflow_status: oldStatus },
    { workflow_status: "showroom_scheduled", scheduled_at: when.toISOString() }
  );

  return finishLeadMutation(leadId, FINISH_FULL);
}

export async function rescheduleShowroomVisit(
  visitId: string,
  scheduledAt: string,
  comment?: string
) {
  const { supabase, user } = await getAuthenticatedActionContext();
  const when = new Date(scheduledAt);
  if (Number.isNaN(when.getTime())) throw new Error("Invalid date");

  const { data: visit } = await supabase
    .from("lead_showroom_visits")
    .select("lead_id")
    .eq("id", visitId)
    .single();
  if (!visit) throw new Error("Visit not found");

  const { lead } = await getLeadWithOffice(supabase, visit.lead_id);
  const leadId = visit.lead_id;

  await supabase
    .from("lead_showroom_visits")
    .update({ status: "rescheduled" })
    .eq("id", visitId);

  const { error } = await supabase.from("lead_showroom_visits").insert({
    lead_id: leadId,
    scheduled_at: when.toISOString(),
    status: "scheduled",
    comment: comment?.trim() || null,
    created_by: user.id,
  });
  if (error) throw error;

  await updateWorkflowStatus(supabase, leadId, "showroom_scheduled");
  await createLeadTask(
    supabase,
    leadId,
    lead.assigned_to ?? user.id,
    user.id,
    "Showroom visit",
    when,
    "showroom_visit",
    "auto_showroom_visit"
  );

  await logActivity(
    supabase,
    leadId,
    user.id,
    "showroom_visit_rescheduled",
    comment ?? null,
    { visit_id: visitId },
    { scheduled_at: when.toISOString() }
  );

  return finishLeadMutation(leadId, FINISH_FULL);
}

export async function markShowroomNoShow(visitId: string, comment: string) {
  const body = requireComment(comment);
  const { supabase, user } = await getAuthenticatedActionContext();
  const { data: visit } = await supabase
    .from("lead_showroom_visits")
    .select("lead_id")
    .eq("id", visitId)
    .single();
  if (!visit) throw new Error("Visit not found");

  const { lead, officeCode } = await getLeadWithOffice(supabase, visit.lead_id);

  await supabase
    .from("lead_showroom_visits")
    .update({ status: "no_show", comment: body })
    .eq("id", visitId);

  const dueAt = computeNextDayCallbackAt(new Date(), officeCode);
  await updateWorkflowStatus(supabase, visit.lead_id, "showroom_no_show", {
    callback_due_at: dueAt.toISOString(),
  });

  await createLeadTask(
    supabase,
    visit.lead_id,
    lead.assigned_to ?? user.id,
    user.id,
    "Showroom no-show follow-up",
    dueAt,
    "showroom_no_show_followup",
    "auto_showroom_no_show"
  );

  await logActivity(
    supabase,
    visit.lead_id,
    user.id,
    "showroom_no_show",
    body,
    null,
    { workflow_status: "showroom_no_show" }
  );

  return finishLeadMutation(visit.lead_id, FINISH_FULL);
}

export async function markShowroomVisited(
  visitId: string,
  materials: string,
  amount: string,
  currency: PaymentCurrency,
  comment: string
) {
  const body = requireComment(comment);
  if (!PAYMENT_CURRENCIES.includes(currency)) throw new Error("Invalid currency");
  const price = parseOptionalDecimal(amount);
  if (price === null) throw new Error("Invalid price");

  const { supabase, user } = await getAuthenticatedActionContext();
  const { data: visit } = await supabase
    .from("lead_showroom_visits")
    .select("lead_id")
    .eq("id", visitId)
    .single();
  if (!visit) throw new Error("Visit not found");

  await supabase
    .from("lead_showroom_visits")
    .update({
      status: "visited",
      materials: materials.trim(),
      quoted_price_amount: price,
      quoted_price_currency: currency,
      comment: body,
    })
    .eq("id", visitId);

  await updateWorkflowStatus(supabase, visit.lead_id, "showroom_visited");

  await logActivity(
    supabase,
    visit.lead_id,
    user.id,
    "showroom_visit_completed",
    body,
    null,
    { materials, quoted_price_amount: price, currency }
  );

  return finishLeadMutation(visit.lead_id, FINISH_FULL);
}

export async function planContract(
  leadId: string,
  plannedAt: string,
  comment: string
) {
  const body = requireComment(comment);
  const when = new Date(plannedAt);
  if (Number.isNaN(when.getTime())) throw new Error("Invalid date");

  const { supabase, user } = await getAuthenticatedActionContext();
  const { lead } = await getLeadWithOffice(supabase, leadId);

  const { error } = await supabase.from("lead_contracts").insert({
    lead_id: leadId,
    planned_at: when.toISOString(),
    status: "planned",
    comment: body,
    created_by: user.id,
  });
  if (error) throw error;

  await updateWorkflowStatus(supabase, leadId, "contract_planned");
  await createLeadTask(
    supabase,
    leadId,
    lead.assigned_to ?? user.id,
    user.id,
    "Contract follow-up",
    when,
    "contract_followup",
    "auto_contract"
  );

  await logActivity(
    supabase,
    leadId,
    user.id,
    "contract_planned",
    body,
    null,
    { planned_at: when.toISOString() }
  );

  return finishLeadMutation(leadId, FINISH_FULL);
}

export async function signContract(contractId: string, signedAt: string, comment: string) {
  const body = requireComment(comment);
  const when = new Date(signedAt);
  if (Number.isNaN(when.getTime())) throw new Error("Invalid date");

  const { supabase, user } = await getAuthenticatedActionContext();
  const { data: contract } = await supabase
    .from("lead_contracts")
    .select("lead_id")
    .eq("id", contractId)
    .single();
  if (!contract) throw new Error("Contract not found");

  await supabase
    .from("lead_contracts")
    .update({ status: "signed", signed_at: when.toISOString(), comment: body })
    .eq("id", contractId);

  await updateWorkflowStatus(supabase, contract.lead_id, "contract_signed");

  await logActivity(
    supabase,
    contract.lead_id,
    user.id,
    "contract_signed",
    body,
    null,
    { signed_at: when.toISOString() }
  );

  return finishLeadMutation(contract.lead_id, FINISH_FULL);
}

export async function recordPayment(
  leadId: string,
  paymentType: "prepayment" | "postpayment",
  amount: string,
  currency: PaymentCurrency,
  paidAt: string,
  comment: string
) {
  const body = requireComment(comment);
  if (!PAYMENT_CURRENCIES.includes(currency)) throw new Error("Invalid currency");
  const value = parseOptionalDecimal(amount);
  if (value === null || value <= 0) throw new Error("Invalid amount");
  const when = new Date(paidAt);
  if (Number.isNaN(when.getTime())) throw new Error("Invalid date");

  const { supabase, user } = await getAuthenticatedActionContext();

  const { error } = await supabase.from("lead_payments").insert({
    lead_id: leadId,
    payment_type: paymentType,
    amount: value,
    currency,
    paid_at: when.toISOString(),
    comment: body,
    created_by: user.id,
  });
  if (error) throw error;

  if (paymentType === "prepayment") {
    await updateWorkflowStatus(supabase, leadId, "in_production", {
      production_started_at: when.toISOString(),
    });
    await logActivity(
      supabase,
      leadId,
      user.id,
      "production_started",
      body,
      null,
      { amount: value, currency }
    );
  } else {
    await updateWorkflowStatus(supabase, leadId, "postpayment_received", {
      postpayment_received_at: when.toISOString(),
    });
  }

  await logActivity(
    supabase,
    leadId,
    user.id,
    "payment_recorded",
    body,
    null,
    { payment_type: paymentType, amount: value, currency }
  );

  return finishLeadMutation(leadId, FINISH_FULL);
}

export async function markInstalled(leadId: string, comment: string) {
  const body = requireComment(comment);
  const { supabase, user } = await getAuthenticatedActionContext();
  const now = new Date().toISOString();

  await updateWorkflowStatus(supabase, leadId, "installed", { installed_at: now });
  await logActivity(supabase, leadId, user.id, "installed", body, null, { installed_at: now });
  return finishLeadMutation(leadId, FINISH_FULL);
}

export async function startWarranty(leadId: string, comment: string) {
  const body = requireComment(comment);
  const { supabase, user } = await getAuthenticatedActionContext();
  const now = new Date().toISOString();

  await updateWorkflowStatus(supabase, leadId, "warranty", { warranty_started_at: now });
  await logActivity(supabase, leadId, user.id, "warranty_started", body, null, {
    warranty_started_at: now,
  });
  return finishLeadMutation(leadId, FINISH_FULL);
}

export async function completeTask(taskId: string) {
  const { supabase, user } = await getAuthenticatedActionContext();
  const { data: task } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", taskId)
    .single();
  if (!task) throw new Error("Task not found");

  await supabase
    .from("tasks")
    .update({ status: "done", completed_at: new Date().toISOString() })
    .eq("id", taskId);

  if (task.entity_type === "lead") {
    await syncNextTaskFromOpen(supabase, task.entity_id);
    await logActivity(supabase, task.entity_id, user.id, "task_completed", null, null, {
      task_id: taskId,
    });
    return finishLeadMutation(task.entity_id, FINISH_LIST);
  }
  return null;
}

export async function cancelTask(taskId: string, comment: string) {
  const body = requireComment(comment);
  const { supabase, user } = await getAuthenticatedActionContext();
  const { data: task } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", taskId)
    .single();
  if (!task) throw new Error("Task not found");

  await supabase
    .from("tasks")
    .update({ status: "canceled", completed_at: new Date().toISOString() })
    .eq("id", taskId);

  if (task.entity_type === "lead") {
    await syncNextTaskFromOpen(supabase, task.entity_id);
    await logActivity(supabase, task.entity_id, user.id, "task_canceled", body, null, {
      task_id: taskId,
    });
    return finishLeadMutation(task.entity_id, FINISH_LIST);
  }
  return null;
}

export async function createManualTask(
  leadId: string,
  title: string,
  dueAt: string,
  comment: string
) {
  const body = requireComment(comment);
  if (!title.trim()) throw new Error("Title required");
  const when = new Date(dueAt);
  if (Number.isNaN(when.getTime())) throw new Error("Invalid date");

  const { supabase, user } = await getAuthenticatedActionContext();
  const { lead } = await getLeadWithOffice(supabase, leadId);

  await createLeadTask(
    supabase,
    leadId,
    lead.assigned_to ?? user.id,
    user.id,
    title.trim(),
    when,
    "manual",
    "manual"
  );

  await logActivity(supabase, leadId, user.id, "task_created", body, null, {
    title: title.trim(),
    due_at: when.toISOString(),
  });

  return finishLeadMutation(leadId, FINISH_LIST);
}

export async function updateCustomerFields(
  leadId: string,
  fields: {
    name?: string;
    phone?: string;
    email?: string;
    city_region?: string;
    product_interest?: string;
    order_comment?: string;
  }
) {
  const { supabase, user } = await getAuthenticatedActionContext();
  const { data: before } = await supabase.from("leads").select("*").eq("id", leadId).single();
  if (!before) throw new Error("Lead not found");

  const { error } = await supabase.from("leads").update(fields).eq("id", leadId);
  if (error) throw error;

  await logActivity(
    supabase,
    leadId,
    user.id,
    "customer_data_updated",
    null,
    fields as Json,
    null
  );
  return finishLeadMutation(leadId, FINISH_LIST);
}

export async function updateSourceFields(
  leadId: string,
  sourceChannel: string,
  sourceNote?: string
) {
  const { supabase, user } = await getAuthenticatedActionContext();
  const { error } = await supabase
    .from("leads")
    .update({
      source_channel: sourceChannel,
      source_note: sourceNote?.trim() || null,
    })
    .eq("id", leadId);
  if (error) throw error;

  await logActivity(supabase, leadId, user.id, "customer_data_updated", sourceNote ?? null, null, {
    source_channel: sourceChannel,
  });
  return finishLeadMutation(leadId, FINISH_NONE);
}

const leadDetailsSchema = z.object({
  name: z.string().trim().min(1).max(160),
  phone: z.string().trim().max(80),
  email: z.union([z.literal(""), z.string().trim().email().max(200)]),
  cityRegion: z.string().trim().max(200),
  productInterest: z.enum(["", "kitchen", "home_furniture", "wardrobe", "other"]),
  orderComment: z.string().trim().max(2000),
  sourceChannel: z.enum(["", "facebook", "instagram", "website", "other"]),
  sourceNote: z.string().trim().max(1000),
});

export type LeadDetailsInput = z.infer<typeof leadDetailsSchema>;

export async function updateLeadDetails(
  leadId: string,
  input: LeadDetailsInput
) {
  const parsed = leadDetailsSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid customer data");
  }

  const { supabase, user } = await getAuthenticatedActionContext();
  const { data: before } = await supabase
    .from("leads")
    .select("*, offices(code)")
    .eq("id", leadId)
    .single();
  if (!before) throw new Error("Lead not found");

  const joinedOffice = before.offices as
    | { code: string }
    | { code: string }[]
    | null;
  const office = Array.isArray(joinedOffice) ? joinedOffice[0] : joinedOffice;
  const phone = normalizePhoneForOffice(parsed.data.phone, office?.code ?? "kyiv");
  const fields = {
    name: parsed.data.name,
    phone,
    email: parsed.data.email || null,
    city_region: parsed.data.cityRegion || null,
    product_interest: parsed.data.productInterest || null,
    order_comment: parsed.data.orderComment || null,
    source_channel: parsed.data.sourceChannel || null,
    source_note: parsed.data.sourceNote || null,
  };

  const { error } = await supabase.from("leads").update(fields).eq("id", leadId);
  if (error) throw error;

  await logActivity(
    supabase,
    leadId,
    user.id,
    "customer_data_updated",
    null,
    {
      name: before.name,
      phone: before.phone,
      email: before.email,
      city_region: before.city_region,
      product_interest: before.product_interest,
      order_comment: before.order_comment,
      source_channel: before.source_channel,
      source_note: before.source_note,
    },
    fields
  );
  return finishLeadMutation(leadId, FINISH_LIST);
}

function taskTitleFromComment(comment: string, leadName: string | null) {
  const trimmed = comment.trim();
  if (trimmed.length <= 60) return trimmed;
  return `${trimmed.slice(0, 57)}...`;
}

async function insertLeadComment(
  supabase: Supabase,
  leadId: string,
  authorId: string,
  leadStatus: string,
  body: string
) {
  const { error } = await supabase.from("lead_comments").insert({
    lead_id: leadId,
    author_id: authorId,
    lead_status: leadStatus,
    body,
  });
  if (error) throw error;
}

async function applyContactAttempt(
  supabase: Supabase,
  leadId: string,
  userId: string,
  lead: Awaited<ReturnType<typeof getLeadWithOffice>>["lead"],
  officeCode: string,
  result: ContactResult,
  body: string
) {
  const { error: insertErr } = await supabase.from("lead_contact_attempts").insert({
    lead_id: leadId,
    manager_id: userId,
    result,
    comment: body,
  });
  if (insertErr) throw insertErr;

  const oldStatus = lead.workflow_status;
  let newStatus = oldStatus;

  if (result === "reached") {
    newStatus = "contacted";
    await updateWorkflowStatus(supabase, leadId, newStatus, {
      callback_due_at: null,
    });
  } else if (result === "bad_lead") {
    newStatus = "bad_lead";
    await updateWorkflowStatus(supabase, leadId, newStatus, {
      lead_status: "failed",
      lead_status_changed_at: new Date().toISOString(),
      callback_due_at: null,
    });
  } else {
    newStatus = "callback_required";
    const dueAt = computeCallbackDueAt(new Date(), officeCode);
    await updateWorkflowStatus(supabase, leadId, newStatus, {
      callback_due_at: dueAt.toISOString(),
    });
    await createLeadTask(
      supabase,
      leadId,
      lead.assigned_to ?? userId,
      userId,
      "Callback",
      dueAt,
      "callback",
      "auto_callback"
    );
  }

  await logActivity(
    supabase,
    leadId,
    userId,
    "contact_attempt",
    body,
    { workflow_status: oldStatus, result: null },
    { workflow_status: newStatus, result }
  );
}

export async function saveLeadActivity(
  leadId: string,
  comment: string,
  activityType: LeadActivityType,
  scheduledAt?: string | null
) {
  return perfAsync("saveLeadActivity", async () => {
    if (!LEAD_ACTIVITY_TYPES.includes(activityType)) {
      throw new Error("Invalid activity type");
    }
    const body = requireComment(comment);

    if (activityType === "showroom" && !scheduledAt?.trim()) {
      throw new Error("Showroom visit requires a date");
    }

    const { supabase, user } = await getAuthenticatedActionContext();
    const { lead, officeCode } = await getLeadWithOffice(supabase, leadId);

    await insertLeadComment(supabase, leadId, user.id, lead.lead_status, body);

    if (activityType === "note") {
    if (scheduledAt?.trim()) {
      const when = new Date(scheduledAt);
      if (Number.isNaN(when.getTime())) throw new Error("Invalid date");
      const title = taskTitleFromComment(body, lead.name);
      await createLeadTask(
        supabase,
        leadId,
        lead.assigned_to ?? user.id,
        user.id,
        title,
        when,
        "manual",
        "manual"
      );
      await logActivity(supabase, leadId, user.id, "task_created", body, null, {
        title,
        due_at: when.toISOString(),
      });
    } else {
      await logActivity(supabase, leadId, user.id, "note_added", body);
    }
  } else if (activityType === "showroom") {
    const when = new Date(scheduledAt!);
    if (Number.isNaN(when.getTime())) throw new Error("Invalid date");

    const { error } = await supabase.from("lead_showroom_visits").insert({
      lead_id: leadId,
      scheduled_at: when.toISOString(),
      status: "scheduled",
      comment: body,
      created_by: user.id,
    });
    if (error) throw error;

    const oldStatus = lead.workflow_status;
    await updateWorkflowStatus(supabase, leadId, "showroom_scheduled");
    await createLeadTask(
      supabase,
      leadId,
      lead.assigned_to ?? user.id,
      user.id,
      "Showroom visit",
      when,
      "showroom_visit",
      "auto_showroom_visit"
    );
    await logActivity(
      supabase,
      leadId,
      user.id,
      "showroom_visit_scheduled",
      body,
      { workflow_status: oldStatus },
      { workflow_status: "showroom_scheduled", scheduled_at: when.toISOString() }
    );
  } else {
    await applyContactAttempt(
      supabase,
      leadId,
      user.id,
      lead,
      officeCode,
      activityType as ContactResult,
      body
    );
  }

  const finishOptions = activityType === "note" ? FINISH_LIST : FINISH_FULL;

  return finishLeadMutation(leadId, finishOptions);
  });
}

export async function setLeadQuality(leadId: string, quality: LeadQuality | null) {
  if (quality !== null && !LEAD_QUALITIES.includes(quality)) {
    throw new Error("Invalid lead quality");
  }

  const { supabase, user } = await getAuthenticatedActionContext();
  const { data: before } = await supabase
    .from("leads")
    .select("lead_quality")
    .eq("id", leadId)
    .single();
  if (!before) throw new Error("Lead not found");

  const { error } = await supabase
    .from("leads")
    .update({ lead_quality: quality })
    .eq("id", leadId);
  if (error) throw error;

  await logActivity(
    supabase,
    leadId,
    user.id,
    "lead_quality_changed",
    null,
    { lead_quality: before.lead_quality },
    { lead_quality: quality }
  );

  return finishLeadMutation(leadId, FINISH_NONE);
}

const LOSS_REASON_CODES = ["spam", "not_target", "price"] as const;

export async function closeLeadAsBad(
  leadId: string,
  lossReason: string,
  comment: string
) {
  const body = requireComment(comment);
  if (!LOSS_REASON_CODES.includes(lossReason as (typeof LOSS_REASON_CODES)[number])) {
    throw new Error("Invalid loss reason");
  }

  const { supabase, user } = await getAuthenticatedActionContext();
  const { lead, officeCode } = await getLeadWithOffice(supabase, leadId);

  await insertLeadComment(supabase, leadId, user.id, lead.lead_status, body);
  await applyContactAttempt(
    supabase,
    leadId,
    user.id,
    lead,
    officeCode,
    "bad_lead",
    body
  );

  const { error } = await supabase
    .from("leads")
    .update({ loss_reason: lossReason })
    .eq("id", leadId);
  if (error) throw error;

  return finishLeadMutation(leadId, FINISH_FULL);
}
