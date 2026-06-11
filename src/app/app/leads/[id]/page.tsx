import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { LeadActionsPanel } from "@/components/lead-actions-panel";
import { LeadCommentForm } from "@/components/lead-comment-form";
import { LeadDetailAttachmentLinks } from "@/components/lead-detail-attachments";
import { LeadDetailComments } from "@/components/lead-detail-comments";
import { LeadDetailEvents } from "@/components/lead-detail-events";
import { getLeadById } from "@/lib/db/leads";
import { getLeadStatuses } from "@/lib/queries/reference-data";
import {
  labelForCode,
  PRODUCT_INTEREST_OPTIONS,
  PROJECT_STAGE_OPTIONS,
} from "@/lib/lead-form-options";
import { sourceSystemLabel } from "@/lib/source-labels";
import type { Lead } from "@/lib/types/database";
import { formatPhoneDisplay } from "@/lib/phone";

function SectionSkeleton() {
  return (
    <div className="animate-pulse space-y-2 rounded-xl border border-[var(--border)] p-4">
      <div className="h-4 w-32 rounded bg-[var(--border)]" />
      <div className="h-16 rounded bg-[var(--border)]" />
    </div>
  );
}

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [{ data: lead, error }, statuses] = await Promise.all([
    getLeadById(id),
    getLeadStatuses(),
  ]);

  if (error || !lead) notFound();

  const l = lead as Lead & {
    offices: { name_uk: string; code: string } | { name_uk: string; code: string }[];
  };
  const officeJoined = Array.isArray(l.offices) ? l.offices[0] : l.offices;
  const officeCode = officeJoined?.code;

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/app/leads"
          className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
        >
          ← Назад до списку
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">{l.name ?? "Лід"}</h1>
        <p className="text-sm text-[var(--muted)]">
          {officeJoined?.name_uk} · {sourceSystemLabel(l.source_system)} ·{" "}
          {l.external_lead_id}
        </p>
      </div>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 text-sm">
          <h2 className="font-medium">Контакти</h2>
          <p>
            <span className="text-[var(--muted)]">Телефон:</span>{" "}
            {formatPhoneDisplay(l.phone, officeCode)}
          </p>
          <p>
            <span className="text-[var(--muted)]">Email:</span> {l.email ?? "—"}
          </p>
          <p>
            <span className="text-[var(--muted)]">Місто / Регіон:</span>{" "}
            {l.city_region ?? "—"}
          </p>
          <p>
            <span className="text-[var(--muted)]">Що замовляє:</span>{" "}
            {labelForCode(
              PRODUCT_INTEREST_OPTIONS,
              l.product_interest,
              officeCode
            )}
          </p>
          {l.order_comment && (
            <p>
              <span className="text-[var(--muted)]">Коментар до замовлення:</span>{" "}
              {l.order_comment}
            </p>
          )}
          <p>
            <span className="text-[var(--muted)]">Етап проєкту (intake):</span>{" "}
            {labelForCode(
              PROJECT_STAGE_OPTIONS,
              l.project_stage_source,
              officeCode
            )}
          </p>
          <Suspense fallback={<SectionSkeleton />}>
            <LeadDetailAttachmentLinks leadId={l.id} />
          </Suspense>
        </div>

        <LeadActionsPanel
          leadId={l.id}
          leadStatus={l.lead_status}
          statuses={statuses}
          convertedProjectId={l.converted_project_id}
          callbackDueAt={l.callback_due_at}
          officeCode={officeCode}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <LeadCommentForm leadId={l.id} currentStatus={l.lead_status} />

        <Suspense fallback={<SectionSkeleton />}>
          <LeadDetailComments leadId={l.id} officeCode={officeCode} />
        </Suspense>
      </section>

      <Suspense fallback={<SectionSkeleton />}>
        <LeadDetailEvents leadId={l.id} officeCode={officeCode} />
      </Suspense>
    </div>
  );
}
