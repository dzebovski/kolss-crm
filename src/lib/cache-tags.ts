import { revalidatePath, revalidateTag } from "next/cache";

export const CACHE_TAGS = {
  leadsList: "leads-list",
  dashboard: "dashboard",
} as const;

export type LeadCacheInvalidation = {
  leadsList?: boolean;
  dashboard?: boolean;
};

export const LEAD_CACHE_SCOPES = {
  none: {} satisfies LeadCacheInvalidation,
  listOnly: { leadsList: true } satisfies LeadCacheInvalidation,
  full: { leadsList: true, dashboard: true } satisfies LeadCacheInvalidation,
} as const;

export function revalidateLeadCache(invalidate: LeadCacheInvalidation = LEAD_CACHE_SCOPES.listOnly) {
  if (invalidate.leadsList) {
    revalidateTag(CACHE_TAGS.leadsList, "max");
  }
  if (invalidate.dashboard) {
    revalidateTag(CACHE_TAGS.dashboard, "max");
  }
}

/** @deprecated Prefer revalidateLeadCache with explicit scopes */
export function revalidateLeadCollections() {
  revalidateLeadCache(LEAD_CACHE_SCOPES.full);
}

export function revalidateLeads(
  leadId?: string,
  invalidate: LeadCacheInvalidation = LEAD_CACHE_SCOPES.listOnly
) {
  revalidateLeadCache(invalidate);
  if (leadId) {
    revalidatePath(`/app/leads/${leadId}`);
  }
}

export function revalidateProjects(projectId?: string) {
  revalidatePath("/app/projects");
  revalidateTag(CACHE_TAGS.dashboard, "max");
  if (projectId) {
    revalidatePath(`/app/projects/${projectId}`);
  }
}

export function revalidateDashboard() {
  revalidateTag(CACHE_TAGS.dashboard, "max");
}
