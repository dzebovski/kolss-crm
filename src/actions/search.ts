"use server";

import { getSessionContext } from "@/lib/auth";
import { resolveEffectiveContext } from "@/lib/queries/effective-context";
import { createClient } from "@/lib/supabase/server";

export type LeadSearchResult = {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  workflowStatus: string;
  office: {
    code: string;
    name: string;
  } | null;
};

const SEARCH_COLUMNS =
  "id, name, phone, email, workflow_status, office_id, offices(code, name_uk)";

function cleanSearchTerm(value: string) {
  return value.trim().replace(/[%_]/g, "").slice(0, 120);
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

export async function searchAccessibleLeads(
  rawQuery: string
): Promise<LeadSearchResult[]> {
  const query = cleanSearchTerm(rawQuery);
  if (query.length < 2) return [];

  const ctx = await getSessionContext();
  if (!ctx || !ctx.profile.is_active) throw new Error("Unauthorized");

  const effective = await resolveEffectiveContext(ctx);
  const supabase = await createClient();
  const phoneDigits = query.replace(/\D/g, "");

  function baseQuery() {
    let builder = supabase.from("leads").select(SEARCH_COLUMNS);
    if (effective.forcedOfficeId) {
      builder = builder.eq("office_id", effective.forcedOfficeId);
    }
    return builder;
  }

  const searches = [
    baseQuery().ilike("name", `%${query}%`).limit(8),
    baseQuery().ilike("email", `%${query}%`).limit(8),
    baseQuery().ilike("phone", `%${phoneDigits || query}%`).limit(8),
  ];

  if (isUuid(query)) {
    searches.unshift(baseQuery().eq("id", query).limit(1));
  }

  const results = await Promise.all(searches);
  const rows = new Map<string, LeadSearchResult>();

  for (const result of results) {
    if (result.error) throw new Error(result.error.message);
    for (const row of result.data ?? []) {
      if (rows.size >= 8 || rows.has(row.id)) continue;
      const joined = row.offices as
        | { code: string; name_uk: string }
        | { code: string; name_uk: string }[]
        | null;
      const office = Array.isArray(joined) ? joined[0] : joined;
      rows.set(row.id, {
        id: row.id,
        name: row.name,
        phone: row.phone,
        email: row.email,
        workflowStatus: row.workflow_status,
        office: office ? { code: office.code, name: office.name_uk } : null,
      });
    }
  }

  return [...rows.values()];
}
