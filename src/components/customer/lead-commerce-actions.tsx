"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  markInstalled,
  planContract,
  recordPayment,
  signContract,
  startWarranty,
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
import type { LeadContract } from "@/lib/types/database";

export function LeadCommerceActions({
  leadId,
  workflowStatus,
  plannedContract,
}: {
  leadId: string;
  workflowStatus: string;
  plannedContract?: LeadContract | null;
}) {
  const t = useTranslations("workflow");
  const tc = useTranslations("common");
  const tp = useTranslations("customerCard.commerceActions");
  const tf = useTranslations("feedback");
  const { isPending, pendingKey, runMutation } = useLeadCard();
  const [comment, setComment] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<PaymentCurrency>("UAH");
  const [error, setError] = useState<string | null>(null);

  const commerceStatuses = [
    "showroom_visited",
    "contract_planned",
    "contract_signed",
    "prepayment_received",
    "in_production",
    "postpayment_received",
    "installed",
  ];

  if (!commerceStatuses.includes(workflowStatus)) return null;
  if (workflowStatus === "contract_planned" && !plannedContract) return null;

  async function run(
    key: string,
    action: () => Promise<LeadPageData | null>,
    successMessage = tf("actionCompleted")
  ) {
    setError(null);
    try {
      await runMutation(action, { key, successMessage });
      setComment("");
      setScheduledAt("");
      setAmount("");
    } catch (value) {
      setError(value instanceof Error ? value.message : tc("error"));
    }
  }

  return (
    <details className="group">
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

          {workflowStatus === "showroom_visited" && (
            <DatedCommentAction
              label={t("actions.planContract")}
              disabled={isPending}
              loading={pendingKey === "plan-contract"}
              date={scheduledAt}
              comment={comment}
              setDate={setScheduledAt}
              setComment={setComment}
              onSubmit={() =>
                void run("plan-contract", () =>
                  planContract(leadId, new Date(scheduledAt).toISOString(), comment)
                )
              }
            />
          )}

          {workflowStatus === "contract_planned" && plannedContract && (
            <DatedCommentAction
              label={t("actions.signContract")}
              disabled={isPending}
              loading={pendingKey === "sign-contract"}
              date={scheduledAt}
              comment={comment}
              setDate={setScheduledAt}
              setComment={setComment}
              onSubmit={() =>
                void run("sign-contract", () =>
                  signContract(
                    plannedContract.id,
                    new Date(scheduledAt).toISOString(),
                    comment
                  )
                )
              }
            />
          )}

          {workflowStatus === "contract_signed" && (
            <PaymentAction
              label={t("actions.recordPrepayment")}
              disabled={isPending}
              loading={pendingKey === "record-prepayment"}
              amount={amount}
              currency={currency}
              date={scheduledAt}
              comment={comment}
              setAmount={setAmount}
              setCurrency={setCurrency}
              setDate={setScheduledAt}
              setComment={setComment}
              onSubmit={() =>
                void run("record-prepayment", () =>
                  recordPayment(
                    leadId,
                    "prepayment",
                    amount,
                    currency,
                    new Date(scheduledAt).toISOString(),
                    comment
                  )
                )
              }
            />
          )}

          {["prepayment_received", "in_production"].includes(workflowStatus) && (
            <>
              <PaymentAction
                label={t("actions.recordPostpayment")}
                disabled={isPending}
                loading={pendingKey === "record-postpayment"}
                amount={amount}
                currency={currency}
                date={scheduledAt}
                comment={comment}
                setAmount={setAmount}
                setCurrency={setCurrency}
                setDate={setScheduledAt}
                setComment={setComment}
                onSubmit={() =>
                  void run("record-postpayment", () =>
                    recordPayment(
                      leadId,
                      "postpayment",
                      amount,
                      currency,
                      new Date(scheduledAt).toISOString(),
                      comment
                    )
                  )
                }
              />
              <div className="border-t border-[var(--ds-border)] pt-4">
                <DSButton
                  variant="ghost"
                  disabled={isPending || !comment.trim()}
                  loading={pendingKey === "mark-installed"}
                  loadingLabel={tf("updatingStatus")}
                  onClick={() =>
                    void run("mark-installed", () => markInstalled(leadId, comment))
                  }
                >
                  {t("actions.markInstalled")}
                </DSButton>
              </div>
            </>
          )}

          {workflowStatus === "postpayment_received" && (
            <CommentAction
              label={t("actions.markInstalled")}
              disabled={isPending}
              loading={pendingKey === "mark-installed"}
              comment={comment}
              setComment={setComment}
              onSubmit={() =>
                void run("mark-installed", () => markInstalled(leadId, comment))
              }
            />
          )}

          {workflowStatus === "installed" && (
            <CommentAction
              label={t("actions.startWarranty")}
              disabled={isPending}
              loading={pendingKey === "start-warranty"}
              comment={comment}
              setComment={setComment}
              onSubmit={() =>
                void run("start-warranty", () => startWarranty(leadId, comment))
              }
            />
          )}
        </div>
      </DSSurface>
    </details>
  );
}

function DatedCommentAction({
  label,
  disabled,
  loading,
  date,
  comment,
  setDate,
  setComment,
  onSubmit,
}: {
  label: string;
  disabled: boolean;
  loading: boolean;
  date: string;
  comment: string;
  setDate: (value: string) => void;
  setComment: (value: string) => void;
  onSubmit: () => void;
}) {
  const tc = useTranslations("common");
  const tf = useTranslations("feedback");
  return (
    <>
      <DSField label={tc("date")} required>
        <DSInput
          type="datetime-local"
          value={date}
          onChange={(event) => setDate(event.target.value)}
        />
      </DSField>
      <DSField label={tc("comment")} required>
        <DSTextarea
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          rows={3}
        />
      </DSField>
      <DSButton
        variant="primary"
        disabled={disabled || !date || !comment.trim()}
        loading={loading}
        loadingLabel={tf("updatingStatus")}
        onClick={onSubmit}
      >
        {label}
      </DSButton>
    </>
  );
}

function CommentAction({
  label,
  disabled,
  loading,
  comment,
  setComment,
  onSubmit,
}: {
  label: string;
  disabled: boolean;
  loading: boolean;
  comment: string;
  setComment: (value: string) => void;
  onSubmit: () => void;
}) {
  const tc = useTranslations("common");
  const tf = useTranslations("feedback");
  return (
    <>
      <DSField label={tc("comment")} required>
        <DSTextarea
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          rows={3}
        />
      </DSField>
      <DSButton
        variant="primary"
        disabled={disabled || !comment.trim()}
        loading={loading}
        loadingLabel={tf("updatingStatus")}
        onClick={onSubmit}
      >
        {label}
      </DSButton>
    </>
  );
}

function PaymentAction({
  label,
  disabled,
  loading,
  amount,
  currency,
  date,
  comment,
  setAmount,
  setCurrency,
  setDate,
  setComment,
  onSubmit,
}: {
  label: string;
  disabled: boolean;
  loading: boolean;
  amount: string;
  currency: PaymentCurrency;
  date: string;
  comment: string;
  setAmount: (value: string) => void;
  setCurrency: (value: PaymentCurrency) => void;
  setDate: (value: string) => void;
  setComment: (value: string) => void;
  onSubmit: () => void;
}) {
  const tc = useTranslations("common");
  const tf = useTranslations("feedback");
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-[1fr_110px_1fr]">
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
            onChange={(event) => setCurrency(event.target.value as PaymentCurrency)}
          >
            {PAYMENT_CURRENCIES.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </DSSelect>
        </DSField>
        <DSField label={tc("date")} required>
          <DSInput
            type="datetime-local"
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
        </DSField>
      </div>
      <DSField label={tc("comment")} required>
        <DSTextarea
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          rows={2}
        />
      </DSField>
      <DSButton
        variant="primary"
        disabled={disabled || !amount.trim() || !date || !comment.trim()}
        loading={loading}
        loadingLabel={tf("updatingStatus")}
        onClick={onSubmit}
      >
        {label}
      </DSButton>
    </>
  );
}
