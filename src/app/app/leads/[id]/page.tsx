import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LeadActionsPanel } from "@/components/lead-actions-panel";
import { LeadCommentForm } from "@/components/lead-comment-form";
import {
  labelForCode,
  PRODUCT_INTEREST_OPTIONS,
  PROJECT_STAGE_OPTIONS,
} from "@/lib/lead-form-options";
import { sourceSystemLabel } from "@/lib/source-labels";
import type {
  Lead,
  LeadAttachment,
  LeadComment,
  LeadEvent,
  LeadStatus,
} from "@/lib/types/database";
import { formatLeadDateTime } from "@/lib/datetime";
import { formatPhoneDisplay } from "@/lib/phone";
import { getLeadAttachmentSignedUrls } from "@/services/storage/lead-attachments";

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [
    { data: lead, error },
    { data: statuses },
    { data: comments },
    { data: events },
    { data: attachments },
  ] = await Promise.all([
    supabase
      .from("leads")
      .select("*, offices(code, name_uk)")
      .eq("id", id)
      .single(),
    supabase.from("lead_statuses").select("*").order("sort_order"),
    supabase
      .from("lead_comments")
      .select("*, profiles(display_name)")
      .eq("lead_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("lead_events")
      .select("*, profiles(display_name)")
      .eq("lead_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("lead_attachments")
      .select("*")
      .eq("lead_id", id)
      .order("created_at", { ascending: false }),
  ]);

  if (error || !lead) notFound();

  const l = lead as Lead & {
    offices: { name_uk: string; code: string } | { name_uk: string; code: string }[];
  };
  const officeJoined = Array.isArray(l.offices) ? l.offices[0] : l.offices;
  const officeCode = officeJoined?.code;
  const statusList = (statuses as LeadStatus[]) ?? [];
  const statusMap = new Map(statusList.map((s) => [s.code, s.label_uk]));

  const attachmentRows = (attachments as LeadAttachment[]) ?? [];
  const signedAttachments = attachmentRows.length
    ? await getLeadAttachmentSignedUrls(supabase, attachmentRows)
    : [];

  const commentsByStatus = new Map<string, LeadComment[]>();
  for (const c of (comments as LeadComment[]) ?? []) {
    const list = commentsByStatus.get(c.lead_status) ?? [];
    list.push(c);
    commentsByStatus.set(c.lead_status, list);
  }

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
          {signedAttachments.length > 0 && (
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
          )}
        </div>

        <LeadActionsPanel
          leadId={l.id}
          leadStatus={l.lead_status}
          statuses={statusList}
          convertedProjectId={l.converted_project_id}
          callbackDueAt={l.callback_due_at}
          officeCode={officeCode}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <LeadCommentForm
          leadId={l.id}
          currentStatus={l.lead_status}
          statuses={statusList}
        />

        <div className="space-y-4">
          <h2 className="font-medium">Коментарі</h2>
          {statusList.map((status) => {
            const items = commentsByStatus.get(status.code);
            if (!items?.length) return null;
            return (
              <div
                key={status.code}
                className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4"
              >
                <h3 className="mb-2 text-sm font-medium text-[var(--accent)]">
                  {status.label_uk}
                </h3>
                <ul className="space-y-2 text-sm">
                  {items.map((c) => (
                    <li
                      key={c.id}
                      className="border-t border-[var(--border)] pt-2 first:border-0 first:pt-0"
                    >
                      <p>{c.body}</p>
                      <p className="mt-1 text-xs text-[var(--muted)]">
                        {c.profiles?.display_name ?? "Користувач"} ·{" "}
                        {formatLeadDateTime(c.created_at, officeCode)}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
          {![...commentsByStatus.values()].some((a) => a.length) && (
            <p className="text-sm text-[var(--muted)]">Коментарів ще немає.</p>
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-medium">Історія змін</h2>
        <ul className="space-y-2 text-sm">
          {(events as LeadEvent[])?.map((ev) => (
            <li
              key={ev.id}
              className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-2"
            >
              <span className="font-medium">{ev.event_type}</span>
              {ev.event_type === "status_change" && ev.new_value && (
                <span>
                  {" "}
                  →{" "}
                  {String(
                    (ev.new_value as { lead_status?: string }).lead_status ??
                      (ev.new_value as { crm_status?: string }).crm_status
                  )}
                  {statusMap.get(
                    String(
                      (ev.new_value as { lead_status?: string }).lead_status ??
                        (ev.new_value as { crm_status?: string }).crm_status
                    )
                  )
                    ? ` (${statusMap.get(String((ev.new_value as { lead_status?: string }).lead_status))})`
                    : ""}
                </span>
              )}
              <span className="ml-2 text-[var(--muted)]">
                {ev.profiles?.display_name ?? "Система"} ·{" "}
                {formatLeadDateTime(ev.created_at, officeCode)}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
