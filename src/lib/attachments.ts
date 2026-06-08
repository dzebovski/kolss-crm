export const LEAD_ATTACHMENTS_BUCKET = "lead-attachments";
export const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

const ALLOWED_EXTENSIONS = new Set(["pdf", "jpg", "jpeg", "png", "docx", "xlsx"]);

export function validateLeadAttachment(file: File): string | null {
  if (file.size === 0) return "Порожній файл";
  if (file.size > MAX_ATTACHMENT_BYTES) {
    return `Файл «${file.name}» перевищує 5 МБ`;
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return `Файл «${file.name}»: дозволені лише PDF, JPG, PNG, DOCX, XLSX`;
  }

  if (file.type && !ALLOWED_MIME_TYPES.has(file.type)) {
    // Some browsers send empty or generic MIME — allow if extension ok
    if (file.type !== "application/octet-stream") {
      return `Файл «${file.name}»: недозволений тип`;
    }
  }

  return null;
}

export function sanitizeFileName(name: string): string {
  return name.replace(/[^\w.\-() ]+/g, "_").slice(0, 200);
}

const MIME_BY_EXTENSION: Record<string, string> = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

/** Bucket allows only specific MIME types — infer from extension when browser sends octet-stream. */
export function resolveAttachmentMimeType(file: File): string {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (file.type && file.type !== "application/octet-stream") {
    return file.type;
  }
  return MIME_BY_EXTENSION[ext] ?? file.type ?? "application/octet-stream";
}
