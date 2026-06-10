import Link from "next/link";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { LeadsFilter } from "@/components/leads-filter";
import { labelForCrmCode, PRODUCT_TYPE_OPTIONS } from "@/lib/crm-options";
import { formatLeadDateTime } from "@/lib/datetime";
import { isApprovalStale } from "@/lib/project-reminder";
import { hasOfficeLeadFilter } from "@/lib/roles";
import type { Office, Project, ProjectStage } from "@/lib/types/database";

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ office?: string; status?: string }>;
}) {
  const { office: officeFilter, status: statusFilter } = await searchParams;
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
  const canFilter = hasOfficeLeadFilter(profile?.role);

  const [{ data: allOffices }, { data: stages }, { data: memberships }] =
    await Promise.all([
      supabase.from("offices").select("*").eq("is_active", true).order("code"),
      supabase.from("project_stages").select("*").order("sort_order"),
      user && !isSuperAdmin
        ? supabase
            .from("user_office_memberships")
            .select("office_id, offices(*)")
            .eq("user_id", user.id)
        : Promise.resolve({ data: null }),
    ]);

  const offices = (allOffices as Office[]) ?? [];
  const userOffices: Office[] =
    isSuperAdmin || !memberships
      ? offices
      : memberships
          .map((m) => m.offices as unknown as Office)
          .filter(Boolean);

  const filterOffices = isSuperAdmin ? offices : userOffices;
  const canUseOfficeFilter = canFilter && filterOffices.length > 1;

  let query = supabase
    .from("projects")
    .select("*, leads!lead_id(name, phone), offices(code, name_uk)")
    .order("updated_at", { ascending: false })
    .limit(100);

  if (canFilter && officeFilter) {
    query = query.eq("office_id", officeFilter);
  }
  if (statusFilter) {
    query = query.eq("status", statusFilter);
  }

  const { data: projects, error } = await query;

  const stageMap = new Map(
    (stages as ProjectStage[] | null)?.map((s) => [s.code, s.label_uk]) ?? []
  );

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Проєкти</h1>
        {canUseOfficeFilter && (
          <Suspense>
            <LeadsFilter
              offices={filterOffices}
              currentOfficeId={officeFilter ?? ""}
              disabled={false}
              showAllOption
            />
          </Suspense>
        )}
      </div>

      <div className="mb-4 flex flex-wrap gap-2 text-sm">
        <Link
          href="/app/projects"
          className={`rounded-lg px-3 py-1 ${!statusFilter ? "bg-[var(--accent)] text-white" : "border border-[var(--border)]"}`}
        >
          Усі
        </Link>
        {(stages as ProjectStage[] | null)
          ?.filter((s) => !s.is_terminal || s.code === "completed")
          .map((s) => (
            <Link
              key={s.code}
              href={`/app/projects?status=${s.code}${officeFilter ? `&office=${officeFilter}` : ""}`}
              className={`rounded-lg px-3 py-1 ${statusFilter === s.code ? "bg-[var(--accent)] text-white" : "border border-[var(--border)]"}`}
            >
              {s.label_uk}
            </Link>
          ))}
      </div>

      {error && (
        <p className="text-red-600">Помилка: {error.message}</p>
      )}

      <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)]">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[var(--border)] bg-[var(--background)]">
            <tr>
              <th className="px-4 py-3 font-medium">Етап</th>
              <th className="px-4 py-3 font-medium">Клієнт</th>
              <th className="px-4 py-3 font-medium">Продукт</th>
              <th className="px-4 py-3 font-medium">Оновлено</th>
            </tr>
          </thead>
          <tbody>
            {(projects as (Project & {
              leads: { name: string | null; phone: string | null };
              offices: { code: string; name_uk: string } | { code: string; name_uk: string }[];
            })[] | null)?.map((p) => {
              const office = Array.isArray(p.offices) ? p.offices[0] : p.offices;
              return (
                <tr
                  key={p.id}
                  className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--background)]"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium">
                      {stageMap.get(p.status) ?? p.status}
                    </div>
                    {isApprovalStale(p) && (
                      <span className="mt-1 inline-flex rounded-md bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">
                        Думає &gt;3 дні
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/app/projects/${p.id}`}
                      className="text-[var(--accent)] hover:underline"
                    >
                      {p.leads?.name ?? "—"}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    {labelForCrmCode(
                      PRODUCT_TYPE_OPTIONS,
                      p.product_type,
                      office?.code
                    )}
                  </td>
                  <td className="px-4 py-3 text-[var(--muted)]">
                    {formatLeadDateTime(p.updated_at, office?.code)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!projects?.length && !error && (
          <p className="px-4 py-8 text-center text-[var(--muted)]">
            Проєктів ще немає. Конвертуйте якісний лід у проєкт.
          </p>
        )}
      </div>
    </div>
  );
}
