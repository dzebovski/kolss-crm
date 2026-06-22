import { requireAuth } from "@/lib/auth";
import { defaultCityForOffice } from "@/lib/offices";
import { resolveEffectiveContext } from "@/lib/queries/effective-context";
import { CreateLeadForm } from "@/components/create-lead-form";

export default async function NewLeadPage() {
  const ctx = await requireAuth();
  const effective = await resolveEffectiveContext(ctx);
  const { officeCtx, forcedOfficeId } = effective;
  const { isSuperAdmin, offices, userOffices } = officeCtx;

  const defaultOffice = userOffices[0] ?? offices[0];
  const formOffices = forcedOfficeId ? userOffices : isSuperAdmin ? offices : userOffices;
  const canPickOffice =
    !forcedOfficeId && (isSuperAdmin ? offices.length > 1 : userOffices.length > 1);

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
