import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { getDashboardStats } from "@/lib/db/dashboard";
import { getLeadStatuses, getProjectStages } from "@/lib/queries/reference-data";

export default async function DashboardPage() {
  await requireAuth();

  const [stats, leadStatuses, projectStages] = await Promise.all([
    getDashboardStats(),
    getLeadStatuses(),
    getProjectStages(),
  ]);

  const leadStatusLabels = new Map(
    leadStatuses.map((s) => [s.code, s.label_uk])
  );
  const projectStageLabels = new Map(
    projectStages.map((s) => [s.code, s.label_uk])
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Дашборд</h1>
        <div className="flex gap-3 text-sm">
          <Link href="/app/leads" className="text-[var(--accent)] hover:underline">
            Ліди
          </Link>
          <Link
            href="/app/projects"
            className="text-[var(--accent)] hover:underline"
          >
            Проєкти
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
          <p className="text-sm text-[var(--muted)]">Усього лідів</p>
          <p className="mt-1 text-2xl font-semibold">{stats.total_leads}</p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
          <p className="text-sm text-[var(--muted)]">Усього проєктів</p>
          <p className="mt-1 text-2xl font-semibold">{stats.total_projects}</p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
          <p className="text-sm text-[var(--muted)]">Прострочені передзвони</p>
          <p className="mt-1 text-2xl font-semibold text-amber-700">
            {stats.callback_overdue}
          </p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
          <p className="text-sm text-[var(--muted)]">Ліди в роботі</p>
          <p className="mt-1 text-2xl font-semibold">
            {stats.leads_by_status.in_progress ?? 0}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
          <h2 className="mb-4 font-medium">Ліди за статусом</h2>
          <ul className="space-y-2 text-sm">
            {Object.entries(stats.leads_by_status).map(([code, count]) => (
              <li key={code} className="flex justify-between gap-4">
                <span>{leadStatusLabels.get(code) ?? code}</span>
                <span className="font-medium">{count}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
          <h2 className="mb-4 font-medium">Проєкти за етапом</h2>
          <ul className="space-y-2 text-sm">
            {Object.entries(stats.projects_by_status).map(([code, count]) => (
              <li key={code} className="flex justify-between gap-4">
                <span>{projectStageLabels.get(code) ?? code}</span>
                <span className="font-medium">{count}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
