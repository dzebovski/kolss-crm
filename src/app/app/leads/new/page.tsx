import { requireAuth } from "@/lib/auth";
import { defaultCityForOffice } from "@/lib/offices";
import { resolveUserOfficeContext } from "@/lib/queries/user-offices";
import { CreateLeadForm } from "@/components/create-lead-form";

export default async function NewLeadPage() {
  const ctx = await requireAuth();
  const { isSuperAdmin, offices, userOffices } =
    await resolveUserOfficeContext(ctx);

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
