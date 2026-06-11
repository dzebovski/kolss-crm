import { createClient } from "@/lib/supabase/server";
import { getLeadAttachments } from "@/lib/db/leads";
import type { LeadAttachment } from "@/lib/types/database";
import { getLeadAttachmentSignedUrls } from "@/services/storage/lead-attachments";

type Props = {
  leadId: string;
};

export async function LeadDetailAttachmentLinks({ leadId }: Props) {
  const supabase = await createClient();
  const { data: attachments } = await getLeadAttachments(leadId);
  const attachmentRows = (attachments as LeadAttachment[]) ?? [];

  if (!attachmentRows.length) return null;

  const signedAttachments = await getLeadAttachmentSignedUrls(
    supabase,
    attachmentRows
  );

  if (!signedAttachments.length) return null;

  return (
    <div className="border-t border-[var(--border)] pt-3">
      <p className="mb-2 font-medium">Файли</p>
      <ul className="space-y-1">
        {signedAttachments.map((f) => (
          <li key={f.url}>
            <a
              href={f.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--accent)] hover:underline"
            >
              {f.file_name}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
