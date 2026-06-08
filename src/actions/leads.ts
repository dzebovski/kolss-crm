"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { enqueueLeadNotifications } from "@/services/notifications/enqueue";
import { normalizePhoneForOffice } from "@/lib/phone";
import { formatSupabaseError } from "@/lib/errors";
import { uploadLeadAttachments } from "@/services/storage/lead-attachments";

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
    .update({
      crm_status: crmStatus,
      crm_status_changed_at: new Date().toISOString(),
    })
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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

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
      crm_status: "new",
      created_at: recordedAt,
      crm_status_changed_at: recordedAt,
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
    .select("id, name, phone, email, product_interest, office_id")
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
  const { data: office } = await admin
    .from("offices")
    .select("code")
    .eq("id", lead.office_id)
    .single();
  await enqueueLeadNotifications(admin, lead, office);

  revalidatePath("/app/leads");
  return lead.id;
}
