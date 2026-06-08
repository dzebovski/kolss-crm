import Link from "next/link";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { LeadsFilter } from "@/components/leads-filter";
import type { Lead, Office, PipelineStage } from "@/lib/types/database";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ office?: string }>;
}) {
  const { office: officeFilter } = await searchParams;
  const supabase = await createClient();

  const [{ data: offices }, { data: stages }] = await Promise.all([
    supabase.from("offices").select("*").eq("is_active", true).order("code"),
    supabase.from("pipeline_stages").select("*").order("sort_order"),
  ]);

  let query = supabase
    .from("leads")
    .select("*, offices(code, name_uk)")
    .order("created_at", { ascending: false })
    .limit(100);

  if (officeFilter) {
    query = query.eq("office_id", officeFilter);
  }

  const { data: leads, error } = await query;

  const stageMap = new Map(
    (stages as PipelineStage[] | null)?.map((s) => [s.code, s.label_uk]) ?? []
  );

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Ліди</h1>
        <div className="flex items-center gap-3">
          <Suspense>
            <LeadsFilter
              offices={(offices as Office[]) ?? []}
              currentOfficeId={officeFilter}
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
              <th className="px-4 py-3 font-medium">Імʼя</th>
              <th className="px-4 py-3 font-medium">Телефон</th>
              <th className="px-4 py-3 font-medium">Офіс</th>
              <th className="px-4 py-3 font-medium">Етап</th>
              <th className="px-4 py-3 font-medium">Створено</th>
            </tr>
          </thead>
          <tbody>
            {(leads as (Lead & { offices: { name_uk: string } })[] | null)?.map(
              (lead) => (
                <tr
                  key={lead.id}
                  className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--background)]"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/app/leads/${lead.id}`}
                      className="font-medium text-[var(--accent)] hover:underline"
                    >
                      {lead.name ?? "—"}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{lead.phone ?? "—"}</td>
                  <td className="px-4 py-3">
                    {lead.offices?.name_uk ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    {stageMap.get(lead.crm_status) ?? lead.crm_status}
                  </td>
                  <td className="px-4 py-3 text-[var(--muted)]">
                    {new Date(lead.created_at).toLocaleString("uk-UA")}
                  </td>
                </tr>
              )
            )}
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
