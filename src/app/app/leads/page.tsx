import Link from "next/link";
import { Suspense } from "react";
import { requireAuth } from "@/lib/auth";
import { LeadsFilter } from "@/components/leads-filter";
import { listLeads } from "@/lib/db/leads";
import { hasActiveCallbackReminder } from "@/lib/callback-reminder";
import { formatLeadDateTime } from "@/lib/datetime";
import { formatPhoneDisplay } from "@/lib/phone";
import { getLeadStatuses } from "@/lib/queries/reference-data";
import { resolveUserOfficeContext } from "@/lib/queries/user-offices";
import type { Lead } from "@/lib/types/database";

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

  const [statuses, leadsResult] = await Promise.all([
    getLeadStatuses(),
    listLeads({
      officeId: canFilterLeads && officeFilter ? officeFilter : undefined,
      status: statusFilter,
      callbackOnly: callbackFilter === "1",
      offset,
      limit: PAGE_SIZE,
    }),
  ]);

  const { data: leads, error, count } = leadsResult;
  const totalPages = count ? Math.ceil(count / PAGE_SIZE) : 1;

  const statusMap = new Map(statuses.map((s) => [s.code, s.label_uk]));
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

  function statusTimeLabel(
    lead: Lead & {
      offices?: { code?: string } | { code?: string }[] | null;
    }
  ) {
    const isNew = lead.lead_status === "new";
    const ts = isNew
      ? lead.created_at
      : lead.lead_status_changed_at ?? lead.created_at;
    return formatLeadDateTime(ts, officeCodeForLead(lead));
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
        <h1 className="text-2xl font-semibold">Ліди</h1>
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
            + Новий лід
          </Link>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2 text-sm">
        <Link
          href="/app/leads"
          className={`rounded-lg px-3 py-1 ${!statusFilter ? "bg-[var(--accent)] text-white" : "border border-[var(--border)]"}`}
        >
          Усі
        </Link>
        {statuses.map((s) => (
          <Link
            key={s.code}
            href={`/app/leads?status=${s.code}${officeFilter ? `&office=${officeFilter}` : ""}`}
            className={`rounded-lg px-3 py-1 ${statusFilter === s.code ? "bg-[var(--accent)] text-white" : "border border-[var(--border)]"}`}
          >
            {s.label_uk}
          </Link>
        ))}
        <Link
          href={`/app/leads?callback=1${officeFilter ? `&office=${officeFilter}` : ""}`}
          className={`rounded-lg px-3 py-1 ${callbackFilter === "1" ? "bg-amber-100 text-amber-900 font-medium" : "border border-[var(--border)]"}`}
        >
          Передзвонити
        </Link>
      </div>

      {error && (
        <p className="text-red-600">Помилка завантаження: {error.message}</p>
      )}

      <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)]">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[var(--border)] bg-[var(--background)]">
            <tr>
              {canFilterLeads && (
                <th className="px-4 py-3 font-medium">Офіс</th>
              )}
              <th className="px-4 py-3 font-medium">Статус</th>
              <th className="px-4 py-3 font-medium">Імʼя</th>
              <th className="px-4 py-3 font-medium">Телефон</th>
            </tr>
          </thead>
          <tbody>
            {(leads as (Lead & {
              offices: { name_uk: string; code?: string } | { name_uk: string; code?: string }[];
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
                    <div className="font-medium">
                      {statusMap.get(lead.lead_status) ?? lead.lead_status ?? "—"}
                    </div>
                    {lead.lead_status === "in_progress" &&
                      hasActiveCallbackReminder(lead.callback_due_at) && (
                        <div className="mt-1">
                          <span className="inline-flex rounded-md bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">
                            Передзвонити до{" "}
                            {formatLeadDateTime(lead.callback_due_at!, code)}
                          </span>
                        </div>
                      )}
                    <div className="mt-0.5 text-xs text-[var(--muted)]">
                      {statusTimeLabel(lead)}
                    </div>
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
                </tr>
              );
            })}
          </tbody>
        </table>
        {!leads?.length && !error && (
          <p className="px-4 py-8 text-center text-[var(--muted)]">
            Лідів ще немає.
          </p>
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-[var(--muted)]">
            Сторінка {page} з {totalPages}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={pageHref(page - 1)}
                className="rounded-lg border border-[var(--border)] px-3 py-1 hover:bg-[var(--background)]"
              >
                Попередня
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={pageHref(page + 1)}
                className="rounded-lg border border-[var(--border)] px-3 py-1 hover:bg-[var(--background)]"
              >
                Наступна
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
