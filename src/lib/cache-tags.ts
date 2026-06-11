import { revalidatePath } from "next/cache";

export function revalidateLeads(leadId?: string) {
  revalidatePath("/app/leads");
  revalidatePath("/app/dashboard");
  if (leadId) {
    revalidatePath(`/app/leads/${leadId}`);
  }
}

export function revalidateProjects(projectId?: string) {
  revalidatePath("/app/projects");
  revalidatePath("/app/dashboard");
  if (projectId) {
    revalidatePath(`/app/projects/${projectId}`);
  }
}

export function revalidateDashboard() {
  revalidatePath("/app/dashboard");
}
