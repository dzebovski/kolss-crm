"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { uploadLeadAttachmentsAction } from "@/actions/leads";
import {
  DSButton,
  DSIcon,
  DSSurface,
} from "@/components/ui/design-system";
import { useLeadCard } from "@/components/customer/lead-card-state";
import { formatLeadDateTime } from "@/lib/datetime";
import type { SignedLeadAttachment } from "@/lib/types/database";

export function LeadFilesPanel({
  leadId,
  attachments,
  officeCode,
}: {
  leadId: string;
  attachments: SignedLeadAttachment[];
  officeCode?: string;
}) {
  const t = useTranslations("customerCard.filesPanel");
  const tc = useTranslations("common");
  const tf = useTranslations("feedback");
  const { isPending, pendingKey, runMutation } = useLeadCard();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append("attachments", file));
    setError(null);
    try {
      await runMutation(() => uploadLeadAttachmentsAction(leadId, formData), {
        key: "upload-files",
        successMessage: tf("filesUploaded"),
      });
      if (inputRef.current) inputRef.current.value = "";
    } catch (value) {
      setError(value instanceof Error ? value.message : tc("error"));
    }
  }

  return (
    <DSSurface className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-[var(--ds-border)] px-4 py-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold">{t("title")}</h2>
          <span className="font-mono text-[10px] text-[var(--ds-foreground-lighter)]">
            {attachments.length}
          </span>
        </div>
        <DSButton
          size="sm"
          variant="ghost"
          leadingIcon="plus"
          disabled={isPending}
          loading={pendingKey === "upload-files"}
          loadingLabel={tf("uploadingFiles")}
          onClick={() => inputRef.current?.click()}
        >
          {t("add")}
        </DSButton>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.docx,.xlsx,application/pdf,image/jpeg,image/png"
          className="sr-only"
          onChange={(event) => void upload(event.target.files)}
        />
      </div>

      {error && (
        <p className="border-b border-[var(--ds-danger-border-soft)] bg-[var(--ds-danger-soft)] px-4 py-2 text-xs text-[var(--ds-danger-strong)]">
          {error}
        </p>
      )}

      {attachments.length ? (
        <ul className="divide-y divide-[var(--ds-border)]">
          {attachments.map((attachment) => (
            <li key={attachment.id}>
              <a
                href={attachment.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-[var(--ds-surface-2)]"
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-md border border-[var(--ds-border)] bg-[var(--ds-surface-0)] text-[var(--ds-foreground-light)]">
                  <DSIcon name="file" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {attachment.file_name}
                  </span>
                  <span className="mt-0.5 block text-[10px] text-[var(--ds-foreground-lighter)]">
                    {formatBytes(attachment.size_bytes)} ·{" "}
                    {formatLeadDateTime(attachment.created_at, officeCode)}
                  </span>
                </span>
                <DSIcon
                  name="arrow-right"
                  className="text-[var(--ds-foreground-lighter)]"
                />
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <div className="px-4 py-8 text-center">
          <DSIcon
            name="file"
            className="mx-auto size-5 text-[var(--ds-foreground-lighter)]"
          />
          <p className="mt-2 text-sm text-[var(--ds-foreground-light)]">
            {t("empty")}
          </p>
        </div>
      )}
      <p className="border-t border-[var(--ds-border)] px-4 py-2 text-[10px] leading-4 text-[var(--ds-foreground-lighter)]">
        {t("hint")}
      </p>
    </DSSurface>
  );
}

function formatBytes(value: number) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}
