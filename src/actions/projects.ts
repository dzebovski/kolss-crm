"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { productDetailsRequired } from "@/lib/crm-options";
import { parseOptionalDecimal, validatePriceLossFields } from "@/lib/validation";
import { uploadProjectAttachments } from "@/services/storage/project-attachments";
import type { ProjectDocumentType } from "@/lib/crm-options";

async function getAuthenticatedUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return { supabase, user };
}

function str(fd: FormData, key: string): string | undefined {
  const v = fd.get(key);
  if (typeof v !== "string") return undefined;
  return v.trim() || undefined;
}

function checkbox(fd: FormData, key: string): boolean {
  const v = fd.get(key);
  return v === "on" || v === "true" || v === "1";
}

function filesFromFormData(fd: FormData, key: string): File[] {
  return fd
    .getAll(key)
    .filter((f): f is File => f instanceof File && f.size > 0);
}

export async function updateProject(projectId: string, formData: FormData) {
  const { supabase, user } = await getAuthenticatedUser();

  const { data: project } = await supabase
    .from("projects")
    .select("status, office_id")
    .eq("id", projectId)
    .single();

  if (!project) throw new Error("Project not found");

  const { data: stage } = await supabase
    .from("project_stages")
    .select("is_terminal")
    .eq("code", project.status)
    .single();

  if (stage?.is_terminal) {
    throw new Error("Закритий проєкт не можна редагувати");
  }

  const productType = str(formData, "product_type") ?? null;
  const productDetails = str(formData, "product_details") ?? null;

  if (productDetailsRequired(productType) && !productDetails) {
    throw new Error("Заповніть деталі продукту");
  }

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("projects")
    .update({
      product_type: productType,
      product_details: productDetails,
      estimated_budget: parseOptionalDecimal(str(formData, "estimated_budget")),
      our_quote: parseOptionalDecimal(str(formData, "our_quote")),
      is_only_measurement: checkbox(formData, "is_only_measurement"),
      advance_paid: parseOptionalDecimal(str(formData, "advance_paid")),
      final_paid: parseOptionalDecimal(str(formData, "final_paid")),
      last_activity_at: now,
    })
    .eq("id", projectId);

  if (error) throw error;

  const contractFiles = filesFromFormData(formData, "contract_files");
  const actFiles = filesFromFormData(formData, "act_files");

  if (contractFiles.length) {
    await uploadProjectAttachments(
      supabase,
      projectId,
      project.office_id,
      user.id,
      contractFiles,
      "contract"
    );
  }
  if (actFiles.length) {
    await uploadProjectAttachments(
      supabase,
      projectId,
      project.office_id,
      user.id,
      actFiles,
      "act"
    );
  }

  revalidatePath(`/app/projects/${projectId}`);
  revalidatePath("/app/projects");
}

export async function updateProjectStatus(projectId: string, newStatus: string) {
  const { supabase, user } = await getAuthenticatedUser();

  const { data: project } = await supabase
    .from("projects")
    .select("status, is_only_measurement")
    .eq("id", projectId)
    .single();

  if (!project) throw new Error("Project not found");

  if (newStatus === "completed" && project.is_only_measurement) {
    // allowed from measurement
  } else if (newStatus === "archived") {
    throw new Error("Використовуйте форму архівації з причиною відмови");
  }

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("projects")
    .update({
      status: newStatus,
      status_changed_at: now,
      last_activity_at: now,
    })
    .eq("id", projectId);

  if (error) throw error;

  await supabase.from("project_comments").insert({
    project_id: projectId,
    author_id: user.id,
    body: `Статус змінено: ${project.status} → ${newStatus}`,
  });

  revalidatePath(`/app/projects/${projectId}`);
  revalidatePath("/app/projects");
}

export async function completeMeasurementOnly(projectId: string) {
  const { supabase, user } = await getAuthenticatedUser();

  const { data: project } = await supabase
    .from("projects")
    .select("status, is_only_measurement")
    .eq("id", projectId)
    .single();

  if (!project) throw new Error("Project not found");
  if (!project.is_only_measurement) {
    throw new Error('Увімкніть прапорець «Тільки замір»');
  }
  if (project.status !== "measurement") {
    throw new Error('Доступно лише на етапі «Заміри»');
  }

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("projects")
    .update({
      status: "completed",
      status_changed_at: now,
      last_activity_at: now,
    })
    .eq("id", projectId);

  if (error) throw error;

  await supabase.from("project_comments").insert({
    project_id: projectId,
    author_id: user.id,
    body: "Проєкт закрито: тільки замір",
  });

  revalidatePath(`/app/projects/${projectId}`);
  revalidatePath("/app/projects");
}

export async function archiveProject(
  projectId: string,
  lossReason: string,
  estimatedBudget?: string,
  ourQuote?: string
) {
  const { supabase, user } = await getAuthenticatedUser();
  if (!lossReason) throw new Error("Оберіть причину відмови");

  const { data: project } = await supabase
    .from("projects")
    .select("status, estimated_budget, our_quote")
    .eq("id", projectId)
    .single();

  if (!project) throw new Error("Project not found");

  const budget =
    parseOptionalDecimal(estimatedBudget) ?? project.estimated_budget;
  const quote = parseOptionalDecimal(ourQuote) ?? project.our_quote;
  const priceErr = validatePriceLossFields(lossReason, budget, quote);
  if (priceErr) throw new Error(priceErr);

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("projects")
    .update({
      status: "archived",
      status_changed_at: now,
      last_activity_at: now,
      loss_reason: lossReason,
      estimated_budget: budget,
      our_quote: quote,
    })
    .eq("id", projectId);

  if (error) throw error;

  await supabase.from("project_comments").insert({
    project_id: projectId,
    author_id: user.id,
    body: `Проєкт архівовано. Причина: ${lossReason}`,
  });

  revalidatePath(`/app/projects/${projectId}`);
  revalidatePath("/app/projects");
}

export async function addProjectComment(projectId: string, body: string) {
  const { supabase, user } = await getAuthenticatedUser();
  if (!body.trim()) throw new Error("Коментар порожній");

  const now = new Date().toISOString();
  const { error } = await supabase.from("project_comments").insert({
    project_id: projectId,
    author_id: user.id,
    body: body.trim(),
  });

  if (error) throw error;

  await supabase
    .from("projects")
    .update({ last_activity_at: now })
    .eq("id", projectId);

  revalidatePath(`/app/projects/${projectId}`);
}

export async function uploadProjectDocument(
  projectId: string,
  formData: FormData,
  documentType: ProjectDocumentType
) {
  const { supabase, user } = await getAuthenticatedUser();
  const { data: project } = await supabase
    .from("projects")
    .select("office_id")
    .eq("id", projectId)
    .single();

  if (!project) throw new Error("Project not found");

  const files = filesFromFormData(formData, "files");
  if (!files.length) throw new Error("Оберіть файл");

  await uploadProjectAttachments(
    supabase,
    projectId,
    project.office_id,
    user.id,
    files,
    documentType
  );

  await supabase
    .from("projects")
    .update({ last_activity_at: new Date().toISOString() })
    .eq("id", projectId);

  revalidatePath(`/app/projects/${projectId}`);
}
