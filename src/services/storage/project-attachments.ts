import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/supabase";
import { createStorageAdminClient } from "@/lib/supabase/admin";
import type { ProjectDocumentType } from "@/lib/crm-options";
import {
  resolveAttachmentMimeType,
  sanitizeFileName,
  validateLeadAttachment,
} from "@/lib/attachments";
import { formatSupabaseError } from "@/lib/errors";

type Client = SupabaseClient<Database>;

export const PROJECT_ATTACHMENTS_BUCKET = "project-attachments";

async function assertProjectAccess(supabase: Client, projectId: string) {
  const { data: project, error } = await supabase
    .from("projects")
    .select("id, office_id")
    .eq("id", projectId)
    .single();

  if (error || !project) {
    throw new Error("Project not found or access denied");
  }

  return project;
}

export async function uploadProjectAttachments(
  supabase: Client,
  projectId: string,
  officeId: string,
  uploadedBy: string,
  files: File[],
  documentType: ProjectDocumentType = "other"
) {
  if (!files.length) return [];

  const project = await assertProjectAccess(supabase, projectId);
  if (project.office_id !== officeId) {
    throw new Error("Office mismatch for project attachment upload");
  }

  const storage = createStorageAdminClient();
  const inserted: { id: string; file_name: string; document_type: string }[] =
    [];

  for (const file of files) {
    const validationError = validateLeadAttachment(file);
    if (validationError) throw new Error(validationError);

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
    const safeName = sanitizeFileName(file.name);
    const storagePath = `${officeId}/${projectId}/${crypto.randomUUID()}.${ext}`;
    const mimeType = resolveAttachmentMimeType(file);

    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await storage.storage
      .from(PROJECT_ATTACHMENTS_BUCKET)
      .upload(storagePath, buffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Не вдалося завантажити «${file.name}»: ${uploadError.message}`);
    }

    const { data: row, error: insertError } = await supabase
      .from("project_attachments")
      .insert({
        project_id: projectId,
        uploaded_by: uploadedBy,
        document_type: documentType,
        file_name: safeName,
        storage_path: storagePath,
        mime_type: mimeType,
        size_bytes: file.size,
      })
      .select("id, file_name, document_type")
      .single();

    if (insertError) {
      await storage.storage
        .from(PROJECT_ATTACHMENTS_BUCKET)
        .remove([storagePath]);
      throw new Error(formatSupabaseError(insertError, "Не вдалося зберегти файл"));
    }

    if (row) inserted.push(row);
  }

  return inserted;
}

export async function getProjectAttachmentSignedUrls(
  _supabase: Client,
  attachments: {
    storage_path: string;
    file_name: string;
    document_type: string;
  }[]
) {
  const storage = createStorageAdminClient();

  const signed = await Promise.all(
    attachments.map(async (att) => {
      const { data, error } = await storage.storage
        .from(PROJECT_ATTACHMENTS_BUCKET)
        .createSignedUrl(att.storage_path, 3600);
      if (error || !data?.signedUrl) return null;
      return {
        file_name: att.file_name,
        url: data.signedUrl,
        document_type: att.document_type,
      };
    })
  );

  return signed.filter(
    (r): r is { file_name: string; url: string; document_type: string } =>
      r !== null
  );
}
