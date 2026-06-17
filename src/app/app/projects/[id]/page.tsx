import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";

export default async function ProjectDetailPage() {
  await requireAuth();
  redirect("/app/leads");
}
