import { Suspense } from "react";
import { DashboardFilters } from "@/components/dashboard-filters";
import { DashboardView } from "@/components/dashboard-view";
import { requireAuth } from "@/lib/auth";
import { getDashboardOverview } from "@/lib/db/dashboard";
import {
  getLeadStatuses,
  getProjectStages,
} from "@/lib/queries/reference-data";
import { resolveUserOfficeContext } from "@/lib/queries/user-offices";

const ALLOWED_PERIODS = new Set([7, 30, 90]);

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ office?: string; period?: string }>;
}) {
  const params = await searchParams;
  const ctx = await requireAuth();
  const officeCtx = await resolveUserOfficeContext(ctx);
  const requestedPeriod = Number(params.period);
  const periodDays = ALLOWED_PERIODS.has(requestedPeriod)
    ? requestedPeriod
    : 30;
  const selectedOfficeId =
    officeCtx.canUseOfficeFilter &&
    officeCtx.filterOffices.some((office) => office.id === params.office)
      ? params.office
      : undefined;

  const [data, leadStatuses, projectStages] = await Promise.all([
    getDashboardOverview({
      officeId: selectedOfficeId,
      periodDays,
    }),
    getLeadStatuses(),
    getProjectStages(),
  ]);

  const isAdminView = ctx.profile.role !== "office_member";
  const userName =
    ctx.profile.display_name?.split(/\s+/)[0] ?? ctx.user.email ?? "колего";

  return (
    <DashboardView
      data={data}
      isAdminView={isAdminView}
      showOffice={officeCtx.canUseOfficeFilter && !selectedOfficeId}
      leadStatuses={leadStatuses}
      projectStages={projectStages}
      userName={userName}
      officeId={selectedOfficeId}
      filters={
        <Suspense>
          <DashboardFilters
            offices={officeCtx.filterOffices}
            currentOfficeId={selectedOfficeId ?? ""}
            periodDays={periodDays}
            showOfficeFilter={officeCtx.canUseOfficeFilter}
          />
        </Suspense>
      }
    />
  );
}
