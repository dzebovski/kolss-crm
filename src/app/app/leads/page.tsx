import Link from "next/link";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { requireAuth } from "@/lib/auth";
import { LeadsFilter } from "@/components/leads-filter";
import { listLeads } from "@/lib/db/leads";
import { formatLeadDateTime } from "@/lib/datetime";
import { formatPhoneDisplay } from "@/lib/phone";
import { resolveUserOfficeContext } from "@/lib/queries/user-offices";
import { WORKFLOW_STATUSES } from "@/lib/workflow";
import type { Lead } from "@/lib/types/database";
import { DSBadge } from "@/components/ui/design-system";

const PAGE_SIZE = 50;

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{
    office?: string;
    status?: string;
    callback?: string;
    page?: string;
  }>;
}) {
  const {
    office: officeFilter,
    status: statusFilter,
    callback: callbackFilter,
    page: pageParam,
  } = await searchParams;

  const t = await getTranslations("leads");
  const tw = await getTranslations("workflow");
  const tc = await getTranslations("common");

  const ctx = await requireAuth();
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const officeCtx = await resolveUserOfficeContext(ctx);
  const {
    canFilter: canFilterLeads,
    filterOffices,
    canUseOfficeFilter,
    userOffices,
    offices,
  } = officeCtx;

  const selectedOfficeId = canUseOfficeFilter
    ? officeFilter ?? ""
    : (userOffices[0]?.id ?? "");

  const leadsResult = await listLeads({
    officeId: canFilterLeads && officeFilter ? officeFilter : undefined,
    status: statusFilter,
    callbackOnly: callbackFilter === "1",
    offset,
    limit: PAGE_SIZE,
  });

  const { data: leads, error, count } = leadsResult;
  const totalPages = count ? Math.ceil(count / PAGE_SIZE) : 1;

  const officeCodeById = new Map(offices.map((o) => [o.id, o.code]));
  const officeNameById = new Map(offices.map((o) => [o.id, o.name_uk]));

  function officeLabel(
    lead: Lead & {
      offices?: { name_uk: string; code?: string } | { name_uk: string; code?: string }[] | null;
    }
  ) {
    const joined = lead.offices;
    const office = Array.isArray(joined) ? joined[0] : joined;
    if (office?.name_uk) return office.name_uk;
    return officeNameById.get(lead.office_id) ?? "—";
  }

  function officeCodeForLead(
    lead: Lead & {
      offices?: { code?: string } | { code?: string }[] | null;
    }
  ) {
    const joined = lead.offices;
    const office = Array.isArray(joined) ? joined[0] : joined;
    return office?.code ?? officeCodeById.get(lead.office_id) ?? "kyiv";
  }

  function filterHref(overrides?: { status?: string; callback?: string }) {
    const params = new URLSearchParams();
    if (officeFilter) params.set("office", officeFilter);
    const status = overrides?.status ?? statusFilter;
    const callback = overrides?.callback ?? callbackFilter;
    if (status) params.set("status", status);
    if (callback === "1") params.set("callback", "1");
    const q = params.toString();
    return q ? `/app/leads?${q}` : "/app/leads";
  }

  function pageHref(nextPage: number) {
    const params = new URLSearchParams();
    if (officeFilter) params.set("office", officeFilter);
    if (statusFilter) params.set("status", statusFilter);
    if (callbackFilter === "1") params.set("callback", "1");
    if (nextPage > 1) params.set("page", String(nextPage));
    const q = params.toString();
    return q ? `/app/leads?${q}` : "/app/leads";
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <div className="flex flex-wrap items-center gap-3">
          <Suspense>
            <LeadsFilter
              offices={filterOffices}
              currentOfficeId={selectedOfficeId}
              disabled={!canUseOfficeFilter}
              showAllOption={canUseOfficeFilter}
            />
          </Suspense>
          <Link
            href="/app/leads/new"
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)]"
          >
            + {t("new")}
          </Link>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2 text-sm">
        <Link
          href={filterHref()}
          className={`rounded-lg px-3 py-1 ${!statusFilter ? "bg-[var(--accent)] text-white" : "border border-[var(--border)]"}`}
        >
          {t("allStatuses")}
        </Link>
        {WORKFLOW_STATUSES.map((code) => (
          <Link
            key={code}
            href={filterHref({ status: code })}
            className={`rounded-lg px-3 py-1 ${statusFilter === code ? "bg-[var(--accent)] text-white" : "border border-[var(--border)]"}`}
          >
            {tw(`status.${code}`)}
          </Link>
        ))}
        <Link
          href={filterHref({ callback: "1" })}
          className={`rounded-lg px-3 py-1 ${callbackFilter === "1" ? "bg-amber-100 text-amber-900 font-medium" : "border border-[var(--border)]"}`}
        >
          {t("filterCallback")}
        </Link>
      </div>

      {error && (
        <p className="text-red-600">{tc("error")}: {error.message}</p>
      )}

      <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)]">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[var(--border)] bg-[var(--background)]">
            <tr>
              {canFilterLeads && <th className="px-4 py-3 font-medium">{tc("office")}</th>}
              <th className="px-4 py-3 font-medium">{tc("status")}</th>
              <th className="px-4 py-3 font-medium">{tc("name")}</th>
              <th className="px-4 py-3 font-medium">{tc("phone")}</th>
              <th className="px-4 py-3 font-medium">{t("assignedTo")}</th>
              <th className="px-4 py-3 font-medium">{t("nextTask")}</th>
            </tr>
          </thead>
          <tbody>
            {(leads as (Lead & {
              offices: { name_uk: string; code?: string } | { name_uk: string; code?: string }[];
              profiles?: { display_name: string | null };
            })[] | null)?.map((lead) => {
              const code = officeCodeForLead(lead);
              return (
                <tr
                  key={lead.id}
                  className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--background)]"
                >
                  {canFilterLeads && (
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-md bg-[var(--background)] px-2 py-0.5 text-xs font-medium">
                        {officeLabel(lead)}
                      </span>
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <DSBadge>{tw(`status.${lead.workflow_status}`)}</DSBadge>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/app/leads/${lead.id}`}
                      className="font-medium text-[var(--accent)] hover:underline"
                    >
                      {lead.name ?? "—"}
                    </Link>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {formatPhoneDisplay(lead.phone, code)}
                  </td>
                  <td className="px-4 py-3">
                    {lead.profiles?.display_name ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    {lead.next_task_title ? (
                      <div>
                        <div>{lead.next_task_title}</div>
                        {lead.next_task_due_at && (
                          <div className="text-xs text-[var(--muted)]">
                            {formatLeadDateTime(lead.next_task_due_at, code)}
                          </div>
                        )}
                      </div>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!leads?.length && !error && (
          <p className="px-4 py-8 text-center text-[var(--muted)]">{tc("noData")}</p>
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-[var(--muted)]">
            {page} / {totalPages}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={pageHref(page - 1)} className="rounded-lg border border-[var(--border)] px-3 py-1">
                ←
              </Link>
            )}
            {page < totalPages && (
              <Link href={pageHref(page + 1)} className="rounded-lg border border-[var(--border)] px-3 py-1">
                →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
