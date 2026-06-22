"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  updateLeadDetails,
  type LeadDetailsInput,
} from "@/actions/workflow";
import {
  DSButton,
  DSField,
  DSInput,
  DSKeyValue,
  DSSelect,
  DSTextarea,
  DSSurface,
} from "@/components/ui/design-system";
import { useLeadCard } from "@/components/customer/lead-card-state";
import { formatPhoneDisplay } from "@/lib/phone";
import { SOURCE_CHANNELS } from "@/lib/workflow";
import type { Lead } from "@/lib/types/database";

const PRODUCT_CODES = ["kitchen", "home_furniture", "wardrobe", "other"] as const;

export function LeadDetailsPanel({
  lead,
  officeCode,
}: {
  lead: Lead;
  officeCode?: string;
}) {
  const t = useTranslations("customerCard");
  const tc = useTranslations("common");
  const tp = useTranslations("product");
  const tw = useTranslations("workflow");
  const ts = useTranslations("sourceSystem");
  const tf = useTranslations("feedback");
  const { isPending, pendingKey, runMutation } = useLeadCard();
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<LeadDetailsInput>(() => valuesFromLead(lead));

  function update<K extends keyof LeadDetailsInput>(
    key: K,
    value: LeadDetailsInput[K]
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function cancel() {
    setForm(valuesFromLead(lead));
    setError(null);
    setEditing(false);
  }

  async function save() {
    setError(null);
    try {
      const snapshot = await runMutation(() => updateLeadDetails(lead.id, form), {
        key: "save-details",
        successMessage: tf("dataSaved"),
      });
      if (snapshot) setForm(valuesFromLead(snapshot.lead));
      setEditing(false);
    } catch (value) {
      setError(value instanceof Error ? value.message : tc("error"));
    }
  }

  const sourceSystem =
    lead.source_system === "meta_lead_ads" ||
    lead.source_system === "google_ads" ||
    lead.source_system === "site_form" ||
    lead.source_system === "manual"
      ? ts(lead.source_system)
      : lead.source_system;

  return (
    <DSSurface className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-[var(--ds-border)] px-4 py-3">
        <h2 className="text-sm font-semibold">{t("contacts")}</h2>
        {!editing && (
          <DSButton
            size="sm"
            variant="ghost"
            onClick={() => {
              setForm(valuesFromLead(lead));
              setEditing(true);
            }}
          >
            {t("edit")}
          </DSButton>
        )}
      </div>

      {editing ? (
        <div className="space-y-3 p-4">
          <DSField label={tc("name")} required>
            <DSInput
              value={form.name}
              onChange={(event) => update("name", event.target.value)}
            />
          </DSField>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <DSField label={tc("phone")}>
              <DSInput
                value={form.phone}
                onChange={(event) => update("phone", event.target.value)}
              />
            </DSField>
            <DSField label={tc("email")}>
              <DSInput
                type="email"
                value={form.email}
                onChange={(event) => update("email", event.target.value)}
              />
            </DSField>
          </div>
          <DSField label={t("cityRegion")}>
            <DSInput
              value={form.cityRegion}
              onChange={(event) => update("cityRegion", event.target.value)}
            />
          </DSField>
          <DSField label={t("productInterest")}>
            <DSSelect
              value={form.productInterest}
              onChange={(event) =>
                update(
                  "productInterest",
                  event.target.value as LeadDetailsInput["productInterest"]
                )
              }
            >
              <option value="">—</option>
              {PRODUCT_CODES.map((code) => (
                <option key={code} value={code}>
                  {tp(code)}
                </option>
              ))}
            </DSSelect>
          </DSField>
          <DSField label={t("orderComment")}>
            <DSTextarea
              rows={3}
              value={form.orderComment}
              onChange={(event) => update("orderComment", event.target.value)}
            />
          </DSField>
          <DSField label={t("sourceChannel")}>
            <DSSelect
              value={form.sourceChannel}
              onChange={(event) =>
                update(
                  "sourceChannel",
                  event.target.value as LeadDetailsInput["sourceChannel"]
                )
              }
            >
              <option value="">—</option>
              {SOURCE_CHANNELS.map((code) => (
                <option key={code} value={code}>
                  {tw(`sourceChannel.${code}`)}
                </option>
              ))}
            </DSSelect>
          </DSField>
          <DSField label={t("sourceNote")}>
            <DSTextarea
              rows={2}
              value={form.sourceNote}
              onChange={(event) => update("sourceNote", event.target.value)}
            />
          </DSField>
          {error && (
            <p className="text-xs text-[var(--ds-danger-strong)]">{error}</p>
          )}
          <div className="flex justify-end gap-2 border-t border-[var(--ds-border)] pt-3">
            <DSButton disabled={isPending} variant="ghost" onClick={cancel}>
              {tc("cancel")}
            </DSButton>
            <DSButton
              disabled={isPending || !form.name.trim()}
              loading={pendingKey === "save-details"}
              loadingLabel={tf("savingData")}
              variant="primary"
              onClick={() => void save()}
            >
              {tc("save")}
            </DSButton>
          </div>
        </div>
      ) : (
        <dl className="divide-y divide-[var(--ds-border)] px-4">
          <DSKeyValue label={tc("phone")}>
            {lead.phone ? (
              <a
                href={`tel:${lead.phone}`}
                className="hover:text-[var(--ds-accent-strong)] hover:underline"
              >
                {formatPhoneDisplay(lead.phone, officeCode)}
              </a>
            ) : (
              "—"
            )}
          </DSKeyValue>
          <DSKeyValue label={tc("email")}>
            {lead.email ? (
              <a
                href={`mailto:${lead.email}`}
                className="break-all hover:text-[var(--ds-accent-strong)] hover:underline"
              >
                {lead.email}
              </a>
            ) : (
              "—"
            )}
          </DSKeyValue>
          <DSKeyValue label={t("cityRegion")}>{lead.city_region ?? "—"}</DSKeyValue>
          <DSKeyValue label={t("productInterest")}>
            {productLabel(lead.product_interest, tp)}
          </DSKeyValue>
          <DSKeyValue label={t("orderComment")}>
            <span className="whitespace-pre-wrap">{lead.order_comment ?? "—"}</span>
          </DSKeyValue>
          <DSKeyValue label={tc("source")}>{sourceSystem}</DSKeyValue>
          <DSKeyValue label={t("sourceChannel")}>
            {sourceChannelLabel(lead.source_channel, tw)}
          </DSKeyValue>
          <DSKeyValue label={t("sourceNote")}>{lead.source_note ?? "—"}</DSKeyValue>
        </dl>
      )}
    </DSSurface>
  );
}

function valuesFromLead(lead: Lead): LeadDetailsInput {
  return {
    name: lead.name ?? "",
    phone: lead.phone ?? "",
    email: lead.email ?? "",
    cityRegion: lead.city_region ?? "",
    productInterest: PRODUCT_CODES.includes(
      lead.product_interest as (typeof PRODUCT_CODES)[number]
    )
      ? (lead.product_interest as LeadDetailsInput["productInterest"])
      : "",
    orderComment: lead.order_comment ?? "",
    sourceChannel: SOURCE_CHANNELS.includes(
      lead.source_channel as (typeof SOURCE_CHANNELS)[number]
    )
      ? (lead.source_channel as LeadDetailsInput["sourceChannel"])
      : "",
    sourceNote: lead.source_note ?? "",
  };
}

function productLabel(
  value: string | null,
  translate: (key: "kitchen" | "home_furniture" | "wardrobe" | "other") => string
) {
  return PRODUCT_CODES.includes(value as (typeof PRODUCT_CODES)[number])
    ? translate(value as (typeof PRODUCT_CODES)[number])
    : value ?? "—";
}

function sourceChannelLabel(
  value: string | null,
  translate: (key: string) => string
) {
  return SOURCE_CHANNELS.includes(value as (typeof SOURCE_CHANNELS)[number])
    ? translate(`sourceChannel.${value}`)
    : value ?? "—";
}
