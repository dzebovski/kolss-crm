"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { planContract } from "@/actions/workflow";
import { useLeadCard } from "@/components/customer/lead-card-state";
import {
  DSBadge,
  DSButton,
  DSField,
  DSInput,
  DSKeyValue,
  DSTextarea,
  DSSurface,
} from "@/components/ui/design-system";
import { formatLeadDateTime } from "@/lib/datetime";
import type {
  Lead,
  LeadContract,
  LeadPayment,
} from "@/lib/types/database";

function hasCommerceData(
  lead: Lead,
  contracts: LeadContract[],
  payments: LeadPayment[]
) {
  return (
    contracts.length > 0 ||
    payments.length > 0 ||
    lead.production_started_at != null ||
    lead.installed_at != null ||
    lead.warranty_started_at != null
  );
}

export function LeadCommercePanel({
  leadId,
  lead,
  contracts,
  payments,
  officeCode,
}: {
  leadId: string;
  lead: Lead;
  contracts: LeadContract[];
  payments: LeadPayment[];
  officeCode?: string;
}) {
  const t = useTranslations("customerCard.commerce");
  const tw = useTranslations("workflow");
  const tc = useTranslations("common");
  const tf = useTranslations("feedback");
  const { isPending, pendingKey, runMutation } = useLeadCard();
  const [showAddForm, setShowAddForm] = useState(false);
  const [plannedAt, setPlannedAt] = useState("");
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);

  const visible = hasCommerceData(lead, contracts, payments);
  const latestContract = contracts[0];
  const totals = Array.from(
    payments.reduce((result, payment) => {
      result.set(payment.currency, (result.get(payment.currency) ?? 0) + payment.amount);
      return result;
    }, new Map<string, number>())
  );

  if (!visible && !showAddForm) {
    return (
      <DSSurface className="overflow-hidden p-4">
        <DSButton
          type="button"
          variant="ghost"
          className="w-full cursor-pointer justify-center"
          disabled={isPending}
          onClick={() => setShowAddForm(true)}
        >
          {t("addContract")}
        </DSButton>
      </DSSurface>
    );
  }

  if (!visible && showAddForm) {
    return (
      <DSSurface className="overflow-hidden">
        <div className="border-b border-[var(--ds-border)] px-4 py-3">
          <h2 className="text-sm font-semibold">{t("addContractTitle")}</h2>
        </div>
        <div className="space-y-3 p-4">
          {error && (
            <p className="rounded-md border border-[var(--ds-danger-border-soft)] bg-[var(--ds-danger-soft)] px-3 py-2 text-sm text-[var(--ds-danger-strong)]">
              {error}
            </p>
          )}
          <DSField label={tc("date")} required>
            <DSInput
              type="datetime-local"
              value={plannedAt}
              onChange={(event) => setPlannedAt(event.target.value)}
            />
          </DSField>
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
              disabled={isPending || !plannedAt || !comment.trim()}
              loading={pendingKey === "plan-contract-sidebar"}
              loadingLabel={tf("updatingStatus")}
              onClick={() => {
                setError(null);
                void runMutation(
                  () =>
                    planContract(leadId, new Date(plannedAt).toISOString(), comment),
                  {
                    key: "plan-contract-sidebar",
                    successMessage: tf("actionCompleted"),
                  }
                ).catch((value) => {
                  setError(value instanceof Error ? value.message : tc("error"));
                });
              }}
            >
              {tw("actions.planContract")}
            </DSButton>
            <DSButton
              type="button"
              variant="ghost"
              className="cursor-pointer"
              disabled={isPending}
              onClick={() => {
                setShowAddForm(false);
                setPlannedAt("");
                setComment("");
                setError(null);
              }}
            >
              {tc("cancel")}
            </DSButton>
          </div>
        </div>
      </DSSurface>
    );
  }

  return (
    <DSSurface className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-[var(--ds-border)] px-4 py-3">
        <h2 className="text-sm font-semibold">{t("title")}</h2>
        {latestContract && (
          <DSBadge tone={latestContract.status === "signed" ? "success" : "accent"}>
            {tw(`contractStatus.${latestContract.status}`)}
          </DSBadge>
        )}
      </div>
      <dl className="divide-y divide-[var(--ds-border)] px-4">
        <DSKeyValue label={t("contract")}>
          {latestContract ? (
            <span>
              {latestContract.signed_at
                ? formatLeadDateTime(latestContract.signed_at, officeCode)
                : latestContract.planned_at
                  ? formatLeadDateTime(latestContract.planned_at, officeCode)
                  : "—"}
            </span>
          ) : (
            t("noContract")
          )}
        </DSKeyValue>
        <DSKeyValue label={t("totals")}>
          {totals.length ? (
            <span className="space-y-1">
              {totals.map(([currency, amount]) => (
                <span key={currency} className="block tabular-nums">
                  {new Intl.NumberFormat("en-GB", {
                    maximumFractionDigits: 2,
                  }).format(amount)}{" "}
                  {currency}
                </span>
              ))}
            </span>
          ) : (
            "—"
          )}
        </DSKeyValue>
        <DSKeyValue label={t("production")}>
          {lead.production_started_at
            ? formatLeadDateTime(lead.production_started_at, officeCode)
            : "—"}
        </DSKeyValue>
        <DSKeyValue label={t("installed")}>
          {lead.installed_at
            ? formatLeadDateTime(lead.installed_at, officeCode)
            : "—"}
        </DSKeyValue>
        <DSKeyValue label={t("warranty")}>
          {lead.warranty_started_at
            ? formatLeadDateTime(lead.warranty_started_at, officeCode)
            : "—"}
        </DSKeyValue>
      </dl>
    </DSSurface>
  );
}
