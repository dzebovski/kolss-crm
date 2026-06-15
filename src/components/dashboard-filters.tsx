"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { DSSelect } from "@/components/ui/design-system";
import type { Office } from "@/lib/types/database";

export function DashboardFilters({
  offices,
  currentOfficeId,
  periodDays,
  showOfficeFilter,
}: {
  offices: Office[];
  currentOfficeId: string;
  periodDays: number;
  showOfficeFilter: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateParam(name: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(name, value);
    } else {
      params.delete(name);
    }
    const query = params.toString();
    router.push(query ? `/app/dashboard?${query}` : "/app/dashboard");
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {showOfficeFilter && (
        <DSSelect
          aria-label="Фільтр за офісом"
          value={currentOfficeId}
          onChange={(event) => updateParam("office", event.target.value)}
          className="w-44"
        >
          <option value="">Усі офіси</option>
          {offices.map((office) => (
            <option key={office.id} value={office.id}>
              {office.name_uk}
            </option>
          ))}
        </DSSelect>
      )}
      <DSSelect
        aria-label="Період дашборда"
        value={String(periodDays)}
        onChange={(event) => updateParam("period", event.target.value)}
        className="w-36"
      >
        <option value="7">7 днів</option>
        <option value="30">30 днів</option>
        <option value="90">90 днів</option>
      </DSSelect>
    </div>
  );
}
