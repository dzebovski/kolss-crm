import { createClient } from "@/lib/supabase/server";

export const PROJECT_LIST_COLUMNS =
  "id, lead_id, office_id, status, product_type, updated_at, last_activity_at, is_only_measurement, leads!lead_id(name, phone), offices(code, name_uk)";

export const PROJECT_DETAIL_COLUMNS =
  "*, leads!lead_id(name, phone, email), offices(code, name_uk)";

export type ProjectListFilters = {
  officeId?: string;
  status?: string;
  offset: number;
  limit: number;
};

export async function listProjects(filters: ProjectListFilters) {
  const supabase = await createClient();

  let query = supabase
    .from("projects")
    .select(PROJECT_LIST_COLUMNS, { count: "exact" })
    .order("updated_at", { ascending: false })
    .range(filters.offset, filters.offset + filters.limit - 1);

  if (filters.officeId) {
    query = query.eq("office_id", filters.officeId);
  }
  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  return query;
}

export async function getProjectById(id: string) {
  const supabase = await createClient();
  return supabase
    .from("projects")
    .select(PROJECT_DETAIL_COLUMNS)
    .eq("id", id)
    .single();
}

export async function getProjectComments(projectId: string) {
  const supabase = await createClient();
  return supabase
    .from("project_comments")
    .select("*, profiles(display_name)")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
}

export async function getProjectAttachments(projectId: string) {
  const supabase = await createClient();
  return supabase
    .from("project_attachments")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
}
