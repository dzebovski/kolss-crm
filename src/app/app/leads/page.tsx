import Link from "next/link";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { requireAuth } from "@/lib/auth";
import { LeadsFilter } from "@/components/leads-filter";
import { getCachedLeadsList } from "@/lib/db/cached-leads";
import { listLeads } from "@/lib/db/leads";
import { createClient } from "@/lib/supabase/server";
import { formatLeadDateTime } from "@/lib/datetime";
import { formatPhoneDisplay } from "@/lib/phone";
import { resolveEffectiveContext } from "@/lib/queries/effective-context";
import { getOfficeFlagEmoji } from "@/lib/office-label";
import {
  isLeadListFilterGroupActive,
  type LeadListFilterGroupKey,
  workflowGroupTone,
  workflowStatusTone,
} from "@/lib/workflow";
import type { Lead } from "@/lib/types/database";
import { DSBadge, dsToneChipClasses } from "@/components/ui/design-system";
import { DSSkeleton } from "@/components/ui/skeleton";

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

  const effective = await resolveEffectiveContext(ctx);
  const {
    canFilter: canFilterLeads,
    filterOffices,
    canUseOfficeFilter,
    userOffices,
    offices,
  } = effective.officeCtx;
  const { forcedOfficeId } = effective;

  const selectedOfficeId = forcedOfficeId
    ? forcedOfficeId
    : canUseOfficeFilter
      ? officeFilter ?? ""
      : (userOffices[0]?.id ?? "");

  const listFilters = {
    officeId: forcedOfficeId ?? (canFilterLeads && officeFilter ? officeFilter : undefined),
    status: statusFilter,
    callbackOnly: callbackFilter === "1",
    offset,
    limit: PAGE_SIZE,
  };

  const supabase = await createClient();
  const leadsResult = await getCachedLeadsList(ctx.user.id, listFilters, () =>
    listLeads(listFilters, supabase)
  );

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

    if (overrides && "callback" in overrides) {
      if (overrides.callback === "1") params.set("callback", "1");
    } else if (overrides && "status" in overrides) {
      if (overrides.status) params.set("status", overrides.status);
    } else {
      if (statusFilter) params.set("status", statusFilter);
      if (callbackFilter === "1") params.set("callback", "1");
    }

    const q = params.toString();
    return q ? `/app/leads?${q}` : "/app/leads";
  }

  function groupLabel(key: LeadListFilterGroupKey) {
    if (key === "showroom") return t("filterShowroom");
    if (key === "deal") return t("filterDeal");
    return tw(`status.${key}`);
  }

  const filterOrder: LeadListFilterGroupKey[] = [
    "new",
    "in_work",
    "showroom",
    "deal",
    "bad_lead",
  ];

  const filtersBeforeCallback = filterOrder.slice(0, 2);
  const filtersAfterCallback = filterOrder.slice(2);

  function filterChipClass(key: LeadListFilterGroupKey) {
    const active =
      isLeadListFilterGroupActive(key, statusFilter) && callbackFilter !== "1";
    return `rounded-lg px-3 py-1 ${dsToneChipClasses(workflowGroupTone(key), active)}`;
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
          <Suspense fallback={<DSSkeleton className="h-10 w-56 rounded-lg" />}>
            <LeadsFilter
              offices={filterOffices}
              currentOfficeId={selectedOfficeId}
              disabled={!canUseOfficeFilter || Boolean(forcedOfficeId)}
              showAllOption={canUseOfficeFilter && !forcedOfficeId}
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
          href={filterHref({ status: "" })}
          className={`rounded-lg px-3 py-1 ${dsToneChipClasses("neutral", !statusFilter && callbackFilter !== "1")}`}
        >
          {t("allStatuses")}
        </Link>
        {filtersBeforeCallback.map((key) => (
          <Link key={key} href={filterHref({ status: key })} className={filterChipClass(key)}>
            {groupLabel(key)}
          </Link>
        ))}
        <Link
          href={filterHref({ callback: "1" })}
          className={`rounded-lg px-3 py-1 ${callbackFilter === "1" ? "bg-amber-100 text-amber-900 font-medium" : "border border-[var(--border)]"}`}
        >
          {t("filterCallback")}
        </Link>
        {filtersAfterCallback.map((key) => (
          <Link key={key} href={filterHref({ status: key })} className={filterChipClass(key)}>
            {groupLabel(key)}
          </Link>
        ))}
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
              <th className="px-4 py-3 font-medium">{t("lastComment")}</th>
            </tr>
          </thead>
          <tbody>
            {(leads as (Lead & {
              offices: { name_uk: string; code?: string } | { name_uk: string; code?: string }[];
              profiles?: { display_name: string | null };
            })[] | null)?.map((lead) => {
              const code = officeCodeForLead(lead);
              const officeFlag = getOfficeFlagEmoji(code);
              return (
                <tr
                  key={lead.id}
                  className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--background)]"
                >
                  {canFilterLeads && (
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 rounded-md bg-[var(--background)] px-2 py-0.5 text-xs font-medium">
                        {officeFlag && <span aria-hidden="true">{officeFlag}</span>}
                        {officeLabel(lead)}
                      </span>
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <DSBadge tone={workflowStatusTone(lead.workflow_status)}>
                      {tw(`status.${lead.workflow_status}`)}
                    </DSBadge>
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
                  <td className="px-4 py-3 max-w-xs">
                    {lead.last_comment ? (
                      <div>
                        <div className="line-clamp-2">{lead.last_comment}</div>
                        {lead.last_comment_at && (
                          <div className="text-xs text-[var(--muted)]">
                            {formatLeadDateTime(lead.last_comment_at, code)}
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
