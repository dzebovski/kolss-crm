import { Suspense } from "react";
import { DashboardFilters } from "@/components/dashboard-filters";
import { WorkflowDashboardView } from "@/components/workflow-dashboard-view";
import { DSSkeleton } from "@/components/ui/skeleton";
import { requireAuth } from "@/lib/auth";
import { resolveDashboardDateRange } from "@/lib/dashboard-period";
import { getCachedWorkflowDashboard } from "@/lib/db/cached-dashboard";
import { getWorkflowDashboard } from "@/lib/db/workflow-dashboard";
import { createClient } from "@/lib/supabase/server";
import { resolveEffectiveContext } from "@/lib/queries/effective-context";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ office?: string; from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const ctx = await requireAuth();
  const effective = await resolveEffectiveContext(ctx);
  const { officeCtx, forcedOfficeId, forcedOfficeCode, isAdminView } = effective;
  const dateRange = resolveDashboardDateRange({
    from: params.from,
    to: params.to,
  });

  const selectedOfficeId = forcedOfficeId
    ? forcedOfficeId
    : officeCtx.canUseOfficeFilter &&
        officeCtx.filterOffices.some((office) => office.id === params.office)
      ? params.office
      : undefined;
  const defaultOfficeCode =
    forcedOfficeCode ??
    officeCtx.filterOffices.find((office) => office.id === selectedOfficeId)?.code ??
    officeCtx.userOffices[0]?.code ??
    "kyiv";

  const dashboardParams = {
    officeId: selectedOfficeId,
    from: dateRange.fromIso,
    to: dateRange.toIso,
  };

  const supabase = await createClient();
  const data = await getCachedWorkflowDashboard(ctx.user.id, dashboardParams, () =>
    getWorkflowDashboard({ ...dashboardParams, supabase })
  );

  return (
    <WorkflowDashboardView
      data={data}
      isAdminView={isAdminView}
      defaultOfficeCode={defaultOfficeCode}
      filters={
        <Suspense fallback={<DSSkeleton className="h-10 w-full max-w-xl rounded-lg" />}>
          <DashboardFilters
            offices={officeCtx.filterOffices}
            currentOfficeId={selectedOfficeId ?? ""}
            dateFrom={dateRange.from}
            dateTo={dateRange.to}
            showOfficeFilter={officeCtx.canUseOfficeFilter && !forcedOfficeId}
          />
        </Suspense>
      }
    />
  );
}
