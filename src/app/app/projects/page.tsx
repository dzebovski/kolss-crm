import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";

export default async function ProjectsPage() {
  const ctx = await requireAuth();
  if (ctx.profile.role !== "super_admin") {
    redirect("/app/dashboard");
  }
  redirect("/app/leads");
}
