"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  markShowroomNoShow,
  markShowroomVisited,
  rescheduleShowroomVisit,
} from "@/actions/workflow";
import {
  DSButton,
  DSField,
  DSInput,
  DSSelect,
  DSTextarea,
  DSSurface,
} from "@/components/ui/design-system";
import { useLeadCard } from "@/components/customer/lead-card-state";
import { PAYMENT_CURRENCIES, type PaymentCurrency } from "@/lib/workflow";
import type { LeadPageData } from "@/lib/db/lead-detail";
import type { LeadShowroomVisit } from "@/lib/types/database";

export function LeadShowroomActions({
  workflowStatus,
  openVisit,
}: {
  workflowStatus: string;
  openVisit?: LeadShowroomVisit | null;
}) {
  const t = useTranslations("workflow");
  const tc = useTranslations("common");
  const tp = useTranslations("customerCard.showroomActions");
  const tf = useTranslations("feedback");
  const { isPending, pendingKey, runMutation } = useLeadCard();
  const [comment, setComment] = useState("");
  const [materials, setMaterials] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<PaymentCurrency>("UAH");
  const [scheduledAt, setScheduledAt] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (workflowStatus !== "showroom_scheduled" || !openVisit) return null;

  async function run(
    key: string,
    action: () => Promise<LeadPageData | null>,
    successMessage = tf("actionCompleted")
  ) {
    setError(null);
    try {
      await runMutation(action, { key, successMessage });
      setComment("");
      setMaterials("");
      setAmount("");
      setScheduledAt("");
    } catch (value) {
      setError(value instanceof Error ? value.message : tc("error"));
    }
  }

  return (
    <details className="group" open>
      <summary className="cursor-pointer list-none rounded-lg border border-[var(--ds-border)] bg-[var(--ds-surface-2)] px-4 py-3 text-sm font-medium text-[var(--ds-foreground)] marker:content-none [&::-webkit-details-marker]:hidden">
        <span className="inline-flex items-center gap-2">
          <span className="text-[var(--ds-foreground-lighter)] transition-transform group-open:rotate-90">
            ▸
          </span>
          {tp("title")}
        </span>
      </summary>
      <DSSurface className="mt-2 overflow-hidden">
        <div className="space-y-4 p-4 sm:p-5">
          {error && (
            <p className="rounded-md border border-[var(--ds-danger-border-soft)] bg-[var(--ds-danger-soft)] px-3 py-2 text-sm text-[var(--ds-danger-strong)]">
              {error}
            </p>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <DSField label={tp("materials")} required>
              <DSInput
                value={materials}
                onChange={(event) => setMaterials(event.target.value)}
              />
            </DSField>
            <div className="grid grid-cols-[1fr_92px] gap-2">
              <DSField label={tc("amount")} required>
                <DSInput
                  inputMode="decimal"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                />
              </DSField>
              <DSField label={tc("currency")}>
                <DSSelect
                  value={currency}
                  onChange={(event) =>
                    setCurrency(event.target.value as PaymentCurrency)
                  }
                >
                  {PAYMENT_CURRENCIES.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </DSSelect>
              </DSField>
            </div>
          </div>
          <DSField label={tc("comment")} required>
            <DSTextarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              rows={2}
            />
          </DSField>
          <div className="flex flex-wrap gap-2">
            <DSButton
              variant="primary"
              disabled={
                isPending || !materials.trim() || !amount.trim() || !comment.trim()
              }
              loading={pendingKey === "showroom-visited"}
              loadingLabel={tf("updatingStatus")}
              onClick={() =>
                void run("showroom-visited", () =>
                  markShowroomVisited(
                    openVisit!.id,
                    materials,
                    amount,
                    currency,
                    comment
                  )
                )
              }
            >
              {t("actions.markVisited")}
            </DSButton>
            <DSButton
              variant="destructive"
              disabled={isPending || !comment.trim()}
              loading={pendingKey === "showroom-no-show"}
              loadingLabel={tf("updatingStatus")}
              onClick={() =>
                void run("showroom-no-show", () =>
                  markShowroomNoShow(openVisit!.id, comment)
                )
              }
            >
              {t("actions.markNoShow")}
            </DSButton>
          </div>
          <div className="grid gap-3 border-t border-[var(--ds-border)] pt-4 sm:grid-cols-[1fr_auto] sm:items-end">
            <DSField label={t("actions.rescheduleShowroom")}>
              <DSInput
                type="datetime-local"
                value={scheduledAt}
                onChange={(event) => setScheduledAt(event.target.value)}
              />
            </DSField>
            <DSButton
              disabled={isPending || !scheduledAt}
              loading={pendingKey === "reschedule-showroom"}
              loadingLabel={tf("updatingStatus")}
              onClick={() =>
                void run("reschedule-showroom", () =>
                  rescheduleShowroomVisit(
                    openVisit!.id,
                    new Date(scheduledAt).toISOString(),
                    comment
                  )
                )
              }
            >
              {t("actions.rescheduleShowroom")}
            </DSButton>
          </div>
        </div>
      </DSSurface>
    </details>
  );
}
