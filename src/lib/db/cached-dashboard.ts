import { unstable_cache } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";
import {
  getWorkflowDashboard,
  type WorkflowDashboard,
} from "@/lib/db/workflow-dashboard";

type DashboardParams = {
  officeId?: string;
  managerId?: string;
  from: string;
  to: string;
};

function paramsCacheKey(params: DashboardParams) {
  return JSON.stringify(params);
}

export function getCachedWorkflowDashboard(
  userId: string,
  params: DashboardParams,
  fetcher: () => Promise<WorkflowDashboard>
) {
  return unstable_cache(fetcher, ["dashboard", userId, paramsCacheKey(params)], {
    tags: [CACHE_TAGS.dashboard],
    revalidate: 60,
  })();
}
