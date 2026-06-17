import { Suspense } from "react";
import { DashboardFilters } from "@/components/dashboard-filters";
import { WorkflowDashboardView } from "@/components/workflow-dashboard-view";
import { requireAuth } from "@/lib/auth";
import { getWorkflowDashboard } from "@/lib/db/workflow-dashboard";
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
  const periodDays = ALLOWED_PERIODS.has(requestedPeriod) ? requestedPeriod : 30;
  const selectedOfficeId =
    officeCtx.canUseOfficeFilter &&
    officeCtx.filterOffices.some((office) => office.id === params.office)
      ? params.office
      : undefined;

  const data = await getWorkflowDashboard({
    officeId: selectedOfficeId,
    periodDays,
  });

  const isAdminView = ctx.profile.role !== "office_member";

  return (
    <WorkflowDashboardView
      data={data}
      isAdminView={isAdminView}
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
