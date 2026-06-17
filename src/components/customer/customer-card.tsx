import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { CustomerWorkflowPanel } from "@/components/customer/customer-workflow-panel";
import { LeadDetailAttachmentLinks } from "@/components/lead-detail-attachments";
import { DSBadge, DSKeyValue, DSSurface } from "@/components/ui/design-system";
import {
  getLeadById,
  getLeadEvents,
} from "@/lib/db/leads";
import {
  getLeadContactAttempts,
  getLeadContracts,
  getLeadPayments,
  getLeadShowroomVisits,
  getLeadTasks,
} from "@/lib/db/workflow";
import { formatLeadDateTime } from "@/lib/datetime";
import { formatPhoneDisplay } from "@/lib/phone";
import type { Lead } from "@/lib/types/database";

export async function CustomerCard({ leadId }: { leadId: string }) {
  const t = await getTranslations("customerCard");
  const tw = await getTranslations("workflow");
  const tc = await getTranslations("common");
  const ts = await getTranslations("sourceSystem");

  const [
    { data: lead },
    { data: calls },
    { data: tasks },
    { data: visits },
    { data: contracts },
    { data: payments },
    { data: events },
  ] = await Promise.all([
    getLeadById(leadId),
    getLeadContactAttempts(leadId),
    getLeadTasks(leadId),
    getLeadShowroomVisits(leadId),
    getLeadContracts(leadId),
    getLeadPayments(leadId),
    getLeadEvents(leadId),
  ]);

  if (!lead) return null;

  const l = lead as Lead & {
    offices: { name_uk: string; code: string } | { name_uk: string; code: string }[];
    profiles?: { display_name: string | null };
  };
  const office = Array.isArray(l.offices) ? l.offices[0] : l.offices;
  const openTasks = (tasks ?? []).filter((task) => task.status === "open");
  const openVisit = (visits ?? []).find((v) => v.status === "scheduled") ?? null;
  const plannedContract = (contracts ?? []).find((c) => c.status === "planned") ?? null;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/app/leads" className="text-sm text-[var(--ds-muted)] hover:underline">
          ← {tc("back")}
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold">{l.name ?? tc("name")}</h1>
          <DSBadge tone="accent">{tw(`status.${l.workflow_status}`)}</DSBadge>
        </div>
        <p className="text-sm text-[var(--ds-muted)]">
          {office?.name_uk} · {l.profiles?.display_name ?? t("unassigned")} ·{" "}
          {l.next_task_title && l.next_task_due_at
            ? `${l.next_task_title} · ${formatLeadDateTime(l.next_task_due_at, office?.code)}`
            : "—"}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <DSSurface className="space-y-3 p-4">
          <h2 className="font-medium">{t("contacts")}</h2>
          <DSKeyValue label={tc("phone")}>{formatPhoneDisplay(l.phone, office?.code)}</DSKeyValue>
          <DSKeyValue label={tc("email")}>{l.email ?? "—"}</DSKeyValue>
          <DSKeyValue label={t("cityRegion")}>{l.city_region ?? "—"}</DSKeyValue>
          <DSKeyValue label={tc("source")}>{ts(l.source_system as "manual")}</DSKeyValue>
          <DSKeyValue label={t("sourceChannel")}>{l.source_channel ?? "—"}</DSKeyValue>
          <LeadDetailAttachmentLinks leadId={l.id} />
        </DSSurface>

        <CustomerWorkflowPanel
          leadId={l.id}
          workflowStatus={l.workflow_status}
          openVisit={openVisit}
          plannedContract={plannedContract}
          openTasks={openTasks}
        />
      </div>

      <DSSurface className="space-y-3 p-4">
        <h2 className="font-medium">{t("callHistory")}</h2>
        {(calls ?? []).length === 0 ? (
          <p className="text-sm text-[var(--ds-muted)]">{t("noCalls")}</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {(calls ?? []).map((call) => (
              <li key={call.id} className="rounded-lg border border-[var(--ds-border)] p-3">
                <div className="flex justify-between gap-2">
                  <span>{tw(`callResult.${call.result}`)}</span>
                  <span className="text-[var(--ds-muted)]">
                    {formatLeadDateTime(call.created_at, office?.code)}
                  </span>
                </div>
                <p className="mt-1">{call.comment}</p>
              </li>
            ))}
          </ul>
        )}
      </DSSurface>

      <DSSurface className="space-y-3 p-4">
        <h2 className="font-medium">{t("showroom")}</h2>
        {(visits ?? []).length === 0 ? (
          <p className="text-sm text-[var(--ds-muted)]">{t("noVisits")}</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {(visits ?? []).map((visit) => (
              <li key={visit.id} className="rounded-lg border border-[var(--ds-border)] p-3">
                <div className="flex justify-between">
                  <span>{tw(`showroomStatus.${visit.status}`)}</span>
                  <span>{formatLeadDateTime(visit.scheduled_at, office?.code)}</span>
                </div>
                {visit.materials && <p>{t("materials")}: {visit.materials}</p>}
                {visit.quoted_price_amount != null && (
                  <p>{t("quotedPrice")}: {visit.quoted_price_amount} {visit.quoted_price_currency}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </DSSurface>

      <DSSurface className="space-y-3 p-4">
        <h2 className="font-medium">{t("contractPayments")}</h2>
        {(contracts ?? []).length === 0 && (payments ?? []).length === 0 ? (
          <p className="text-sm text-[var(--ds-muted)]">{t("noContracts")}</p>
        ) : (
          <div className="space-y-3 text-sm">
            {(contracts ?? []).map((contract) => (
              <div key={contract.id} className="rounded-lg border border-[var(--ds-border)] p-3">
                <p>{tw(`contractStatus.${contract.status}`)}</p>
                {contract.planned_at && <p>{t("plannedAt")}: {formatLeadDateTime(contract.planned_at, office?.code)}</p>}
                {contract.signed_at && <p>{t("signedAt")}: {formatLeadDateTime(contract.signed_at, office?.code)}</p>}
              </div>
            ))}
            {(payments ?? []).map((payment) => (
              <div key={payment.id} className="rounded-lg border border-[var(--ds-border)] p-3">
                <p>{tw(`paymentType.${payment.payment_type}`)}: {payment.amount} {payment.currency}</p>
                <p>{t("paidAt")}: {formatLeadDateTime(payment.paid_at, office?.code)}</p>
              </div>
            ))}
          </div>
        )}
      </DSSurface>

      <DSSurface className="space-y-3 p-4">
        <h2 className="font-medium">{t("production")}</h2>
        <DSKeyValue label="Production">
          {l.production_started_at ? formatLeadDateTime(l.production_started_at, office?.code) : "—"}
        </DSKeyValue>
        <DSKeyValue label="Installed">
          {l.installed_at ? formatLeadDateTime(l.installed_at, office?.code) : "—"}
        </DSKeyValue>
        <DSKeyValue label="Warranty">
          {l.warranty_started_at ? formatLeadDateTime(l.warranty_started_at, office?.code) : "—"}
        </DSKeyValue>
      </DSSurface>

      <DSSurface className="space-y-3 p-4">
        <h2 className="font-medium">{t("activity")}</h2>
        <ul className="space-y-2 text-sm">
          {(events ?? []).map((event) => (
            <li key={event.id} className="rounded-lg border border-[var(--ds-border)] p-3">
              <div className="flex justify-between gap-2">
                <span>{event.event_type}</span>
                <span className="text-[var(--ds-muted)]">
                  {formatLeadDateTime(event.created_at, office?.code)}
                </span>
              </div>
              {event.comment && <p className="mt-1">{event.comment}</p>}
              <p className="text-xs text-[var(--ds-muted)]">{event.profiles?.display_name ?? "—"}</p>
            </li>
          ))}
        </ul>
      </DSSurface>
    </div>
  );
}
