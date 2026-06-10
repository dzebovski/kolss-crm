import Link from "next/link";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { LeadsFilter } from "@/components/leads-filter";
import { formatLeadDateTime } from "@/lib/datetime";
import { formatPhoneDisplay } from "@/lib/phone";
import { hasOfficeLeadFilter } from "@/lib/roles";
import type { Lead, Office, PipelineStage } from "@/lib/types/database";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ office?: string }>;
}) {
  const { office: officeFilter } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single()
    : { data: null };

  const isSuperAdmin = profile?.role === "super_admin";
  const canFilterLeads = hasOfficeLeadFilter(profile?.role);

  const [{ data: allOffices }, { data: stages }, { data: memberships }] =
    await Promise.all([
      supabase.from("offices").select("*").eq("is_active", true).order("code"),
      supabase.from("pipeline_stages").select("*").order("sort_order"),
      user && !isSuperAdmin
        ? supabase
            .from("user_office_memberships")
            .select("office_id, offices(*)")
            .eq("user_id", user.id)
        : Promise.resolve({ data: null }),
    ]);

  const offices = (allOffices as Office[]) ?? [];
  const officeCodeById = new Map(offices.map((o) => [o.id, o.code]));
  const userOffices: Office[] =
    isSuperAdmin || !memberships
      ? offices
      : memberships
          .map((m) => m.offices as unknown as Office)
          .filter(Boolean);

  const filterOffices = isSuperAdmin ? offices : userOffices;
  const canUseOfficeFilter = canFilterLeads && filterOffices.length > 1;
  const selectedOfficeId = canUseOfficeFilter
    ? officeFilter ?? ""
    : (userOffices[0]?.id ?? "");

  let query = supabase
    .from("leads")
    .select("*, offices(code, name_uk)")
    .order("created_at", { ascending: false })
    .limit(100);

  if (canFilterLeads && officeFilter) {
    query = query.eq("office_id", officeFilter);
  }

  const { data: leads, error } = await query;

  const stageMap = new Map(
    (stages as PipelineStage[] | null)?.map((s) => [s.code, s.label_uk]) ?? []
  );

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
    const isNew = !lead.crm_status || lead.crm_status === "new";
    const ts = isNew
      ? lead.created_at
      : lead.crm_status_changed_at ?? lead.created_at;
    return formatLeadDateTime(ts, officeCodeForLead(lead));
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Ліди</h1>
        <div className="flex items-center gap-3">
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
                      {stageMap.get(lead.crm_status) ?? lead.crm_status ?? "—"}
                    </div>
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
            Лідів ще немає. Увімкніть імпорт з Google Sheets або створіть лід
            вручну.
          </p>
        )}
      </div>
    </div>
  );
}
