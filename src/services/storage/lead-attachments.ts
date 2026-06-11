import type { SupabaseClient } from "@supabase/supabase-js";
import { createStorageAdminClient } from "@/lib/supabase/admin";
import {
  LEAD_ATTACHMENTS_BUCKET,
  resolveAttachmentMimeType,
  sanitizeFileName,
  validateLeadAttachment,
} from "@/lib/attachments";
import { formatSupabaseError } from "@/lib/errors";

export async function uploadLeadAttachments(
  supabase: SupabaseClient,
  leadId: string,
  officeId: string,
  uploadedBy: string,
  files: File[]
) {
  if (!files.length) return [];

  const storage = createStorageAdminClient();
  const inserted: { id: string; file_name: string }[] = [];

  for (const file of files) {
    const validationError = validateLeadAttachment(file);
    if (validationError) throw new Error(validationError);

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
    const safeName = sanitizeFileName(file.name);
    const storagePath = `${officeId}/${leadId}/${crypto.randomUUID()}.${ext}`;
    const mimeType = resolveAttachmentMimeType(file);

    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await storage.storage
      .from(LEAD_ATTACHMENTS_BUCKET)
      .upload(storagePath, buffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Не вдалося завантажити «${file.name}»: ${uploadError.message}`);
    }

    const { data: row, error: insertError } = await supabase
      .from("lead_attachments")
      .insert({
        lead_id: leadId,
        uploaded_by: uploadedBy,
        file_name: safeName,
        storage_path: storagePath,
        mime_type: mimeType,
        size_bytes: file.size,
      })
      .select("id, file_name")
      .single();

    if (insertError) {
      await storage.storage.from(LEAD_ATTACHMENTS_BUCKET).remove([storagePath]);
      throw new Error(formatSupabaseError(insertError, "Не вдалося зберегти файл"));
    }

    if (row) inserted.push(row);
  }

  return inserted;
}

export async function getLeadAttachmentSignedUrls(
  _supabase: SupabaseClient,
  attachments: { storage_path: string; file_name: string }[]
) {
  const storage = createStorageAdminClient();

  const signed = await Promise.all(
    attachments.map(async (att) => {
      const { data, error } = await storage.storage
        .from(LEAD_ATTACHMENTS_BUCKET)
        .createSignedUrl(att.storage_path, 3600);
      if (error || !data?.signedUrl) return null;
      return { file_name: att.file_name, url: data.signedUrl };
    })
  );

  return signed.filter((r): r is { file_name: string; url: string } => r !== null);
}
