import { revalidatePath, updateTag } from "next/cache";

export function revalidateLeads(leadId?: string) {
  updateTag("leads");
  updateTag("dashboard");
  revalidatePath("/app/leads");
  revalidatePath("/app/dashboard");
  if (leadId) {
    updateTag(`lead:${leadId}`);
    revalidatePath(`/app/leads/${leadId}`);
  }
}

export function revalidateProjects(projectId?: string) {
  updateTag("projects");
  updateTag("dashboard");
  revalidatePath("/app/projects");
  revalidatePath("/app/dashboard");
  if (projectId) {
    updateTag(`project:${projectId}`);
    revalidatePath(`/app/projects/${projectId}`);
  }
}

export function revalidateDashboard() {
  updateTag("dashboard");
  revalidatePath("/app/dashboard");
}
