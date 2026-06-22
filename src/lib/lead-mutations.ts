import "server-only";

import {
  LEAD_CACHE_SCOPES,
  revalidateLeadCache,
  type LeadCacheInvalidation,
} from "@/lib/cache-tags";
import {
  getLeadPageData,
  type GetLeadPageDataOptions,
  type LeadPageData,
} from "@/lib/db/lead-detail";
import { perfAsync } from "@/lib/perf";

export type FinishLeadMutationOptions = {
  invalidate?: LeadCacheInvalidation;
  snapshot?: GetLeadPageDataOptions;
};

export async function finishLeadMutation(
  leadId: string,
  options: FinishLeadMutationOptions = {}
): Promise<LeadPageData> {
  const invalidate = options.invalidate ?? LEAD_CACHE_SCOPES.listOnly;

  return perfAsync("finishLeadMutation", async () => {
    revalidateLeadCache(invalidate);

    const snapshot = await perfAsync("getLeadPageData", () =>
      getLeadPageData(leadId, options.snapshot)
    );

    if (!snapshot) throw new Error("Lead not found after update");
    return snapshot;
  });
}
