import { createClient } from "@/lib/supabase/server";
import { getActiveOffices } from "@/lib/queries/reference-data";
import { isSuperAdminRole } from "@/lib/auth";
import { hasOfficeLeadFilter } from "@/lib/roles";
import type { SessionContext } from "@/lib/auth";
import type { Office } from "@/lib/types/database";

export type UserOfficeContext = {
  isSuperAdmin: boolean;
  canFilter: boolean;
  offices: Office[];
  userOffices: Office[];
  filterOffices: Office[];
  canUseOfficeFilter: boolean;
};

export async function resolveUserOfficeContext(
  ctx: SessionContext
): Promise<UserOfficeContext> {
  const supabase = await createClient();
  const isSuperAdmin = isSuperAdminRole(ctx.profile.role);
  const canFilter = hasOfficeLeadFilter(ctx.profile.role);

  const [offices, membershipsResult] = await Promise.all([
    getActiveOffices(),
    !isSuperAdmin
      ? supabase
          .from("user_office_memberships")
          .select("office_id, offices(*)")
          .eq("user_id", ctx.user.id)
      : Promise.resolve({ data: null }),
  ]);

  const memberships = membershipsResult.data;
  const userOffices: Office[] =
    isSuperAdmin || !memberships
      ? offices
      : memberships
          .map((m) => m.offices as unknown as Office)
          .filter(Boolean);

  const filterOffices = isSuperAdmin ? offices : userOffices;

  return {
    isSuperAdmin,
    canFilter,
    offices,
    userOffices,
    filterOffices,
    canUseOfficeFilter: canFilter && filterOffices.length > 1,
  };
}
