import { unstable_cache } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { listLeads, type LeadListFilters } from "@/lib/db/leads";

function filtersCacheKey(filters: LeadListFilters) {
  return JSON.stringify(filters);
}

export function getCachedLeadsList(
  userId: string,
  filters: LeadListFilters,
  fetcher: () => ReturnType<typeof listLeads>
) {
  return unstable_cache(fetcher, ["leads-list", userId, filtersCacheKey(filters)], {
    tags: [CACHE_TAGS.leadsList],
    revalidate: 60,
  })();
}
