import type { Project } from "@/lib/types/database";

const APPROVAL_STALE_DAYS = 3;

export function isApprovalStale(project: Pick<Project, "status" | "last_activity_at">): boolean {
  if (project.status !== "approval") return false;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - APPROVAL_STALE_DAYS);
  return new Date(project.last_activity_at) < cutoff;
}
