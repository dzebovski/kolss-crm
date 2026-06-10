import { createClient } from "@/lib/supabase/server";
import { CreateLeadForm } from "@/components/create-lead-form";
import { defaultCityForOffice } from "@/lib/offices";
import type { Office } from "@/lib/types/database";

export default async function NewLeadPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single()
    : { data: null };

  const isSuperAdmin = profile?.role === "super_admin";

  const [{ data: allOffices }, { data: memberships }] = await Promise.all([
    supabase.from("offices").select("*").eq("is_active", true).order("code"),
    user && !isSuperAdmin
      ? supabase
          .from("user_office_memberships")
          .select("office_id, offices(*)")
          .eq("user_id", user.id)
      : Promise.resolve({ data: null }),
  ]);

  const offices = (allOffices as Office[]) ?? [];
  const userOffices: Office[] =
    isSuperAdmin || !memberships
      ? offices
      : memberships
          .map((m) => m.offices as unknown as Office)
          .filter(Boolean);

  const defaultOffice = userOffices[0] ?? offices[0];
  const formOffices = isSuperAdmin ? offices : userOffices;
  const canPickOffice = isSuperAdmin || userOffices.length > 1;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Новий лід</h1>
      {defaultOffice ? (
        <CreateLeadForm
          offices={formOffices}
          canPickOffice={canPickOffice}
          defaultOfficeId={defaultOffice.id}
          defaultCityRegion={defaultCityForOffice(defaultOffice)}
        />
      ) : (
        <p className="text-sm text-[var(--muted)]">
          Немає доступного офісу. Зверніться до адміністратора.
        </p>
      )}
    </div>
  );
}
