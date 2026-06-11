import Link from "next/link";
import { Suspense } from "react";
import { requireAuth } from "@/lib/auth";
import { LeadsFilter } from "@/components/leads-filter";
import { listProjects } from "@/lib/db/projects";
import { labelForCrmCode, PRODUCT_TYPE_OPTIONS } from "@/lib/crm-options";
import { formatLeadDateTime } from "@/lib/datetime";
import { isApprovalStale } from "@/lib/project-reminder";
import { getProjectStages } from "@/lib/queries/reference-data";
import { resolveUserOfficeContext } from "@/lib/queries/user-offices";
import type { Project } from "@/lib/types/database";

const PAGE_SIZE = 50;

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ office?: string; status?: string; page?: string }>;
}) {
  const { office: officeFilter, status: statusFilter, page: pageParam } =
    await searchParams;

  const ctx = await requireAuth();
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const { canFilter, filterOffices, canUseOfficeFilter } =
    await resolveUserOfficeContext(ctx);

  const [stages, projectsResult] = await Promise.all([
    getProjectStages(),
    listProjects({
      officeId: canFilter && officeFilter ? officeFilter : undefined,
      status: statusFilter,
      offset,
      limit: PAGE_SIZE,
    }),
  ]);

  const { data: projects, error, count } = projectsResult;
  const totalPages = count ? Math.ceil(count / PAGE_SIZE) : 1;
  const stageMap = new Map(stages.map((s) => [s.code, s.label_uk]));

  function filterHref(overrides?: { status?: string }) {
    const params = new URLSearchParams();
    if (officeFilter) params.set("office", officeFilter);
    const status = overrides?.status ?? statusFilter;
    if (status) params.set("status", status);
    const q = params.toString();
    return q ? `/app/projects?${q}` : "/app/projects";
  }

  function pageHref(nextPage: number) {
    const params = new URLSearchParams();
    if (officeFilter) params.set("office", officeFilter);
    if (statusFilter) params.set("status", statusFilter);
    if (nextPage > 1) params.set("page", String(nextPage));
    const q = params.toString();
    return q ? `/app/projects?${q}` : "/app/projects";
  }

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
              basePath="/app/projects"
            />
          </Suspense>
        )}
      </div>

      <div className="mb-4 flex flex-wrap gap-2 text-sm">
        <Link
          href={filterHref()}
          className={`rounded-lg px-3 py-1 ${!statusFilter ? "bg-[var(--accent)] text-white" : "border border-[var(--border)]"}`}
        >
          Усі
        </Link>
        {stages
          .filter((s) => !s.is_terminal || s.code === "completed")
          .map((s) => (
            <Link
              key={s.code}
              href={filterHref({ status: s.code })}
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
