"use client";

import { useEffect, useId, useState } from "react";
import { useTranslations } from "next-intl";
import { closeLeadAsBad } from "@/actions/workflow";
import { useLeadCard } from "@/components/customer/lead-card-state";
import {
  DSButton,
  DSField,
  DSIcon,
  DSSelect,
  DSTextarea,
} from "@/components/ui/design-system";

const LOSS_REASONS = [
  { code: "spam", labelKey: "spam" },
  { code: "not_target", labelKey: "notTarget" },
  { code: "price", labelKey: "price" },
] as const;

export function LeadCloseDialog({
  leadId,
  open,
  onClose,
}: {
  leadId: string;
  open: boolean;
  onClose: () => void;
}) {
  const tc = useTranslations("common");
  const t = useTranslations("customerCard.closeLead");
  const tf = useTranslations("feedback");
  const titleId = useId();
  const { isPending, pendingKey, runMutation } = useLeadCard();
  const [lossReason, setLossReason] = useState("not_target");
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setLossReason("not_target");
      setComment("");
      setError(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isPending) onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, isPending, onClose]);

  if (!open) return null;

  async function confirmClose() {
    setError(null);
    try {
      await runMutation(
        () => closeLeadAsBad(leadId, lossReason, comment),
        {
          key: "close-lead",
          successMessage: tf("actionCompleted"),
        }
      );
      onClose();
    } catch (value) {
      setError(value instanceof Error ? value.message : tc("error"));
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label={tc("cancel")}
        className="absolute inset-0 cursor-pointer bg-black/40"
        disabled={isPending}
        onClick={() => {
          if (!isPending) onClose();
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 w-full max-w-md rounded-xl border border-[var(--ds-border)] bg-[var(--ds-surface-1)] shadow-xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-[var(--ds-border)] px-5 py-4">
          <div>
            <h2 id={titleId} className="text-base font-semibold text-[var(--ds-foreground)]">
              {t("title")}
            </h2>
            <p className="mt-1 text-sm text-[var(--ds-foreground-light)]">{t("description")}</p>
          </div>
          <button
            type="button"
            className="cursor-pointer rounded-md p-1 text-[var(--ds-foreground-lighter)] transition-colors hover:bg-[var(--ds-surface-2)] hover:text-[var(--ds-foreground)] disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isPending}
            onClick={onClose}
          >
            <DSIcon name="x" className="size-4" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          {error && (
            <p className="rounded-md border border-[var(--ds-danger-border-soft)] bg-[var(--ds-danger-soft)] px-3 py-2 text-sm text-[var(--ds-danger-strong)]">
              {error}
            </p>
          )}
          <DSField label={t("reason")} required>
            <DSSelect
              value={lossReason}
              onChange={(event) => setLossReason(event.target.value)}
              disabled={isPending}
            >
              {LOSS_REASONS.map((reason) => (
                <option key={reason.code} value={reason.code}>
                  {t(`lossReasons.${reason.labelKey}`)}
                </option>
              ))}
            </DSSelect>
          </DSField>
          <DSField label={tc("comment")} required>
            <DSTextarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              rows={3}
              placeholder={t("commentPlaceholder")}
              disabled={isPending}
            />
          </DSField>
        </div>

        <div className="flex justify-end gap-2 border-t border-[var(--ds-border)] px-5 py-4">
          <DSButton
            type="button"
            variant="ghost"
            className="cursor-pointer"
            disabled={isPending}
            onClick={onClose}
          >
            {tc("cancel")}
          </DSButton>
          <DSButton
            variant="destructive"
            disabled={isPending || !comment.trim()}
            loading={pendingKey === "close-lead"}
            loadingLabel={tf("updatingStatus")}
            onClick={() => void confirmClose()}
          >
            {t("confirm")}
          </DSButton>
        </div>
      </div>
    </div>
  );
}
