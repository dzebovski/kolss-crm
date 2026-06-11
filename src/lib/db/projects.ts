import { createClient } from "@/lib/supabase/server";

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
    .select("*, leads!lead_id(name, phone), offices(code, name_uk)", {
      count: "exact",
    })
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
    .select("*, leads!lead_id(name, phone, email), offices(code, name_uk)")
    .eq("id", id)
    .single();
}
