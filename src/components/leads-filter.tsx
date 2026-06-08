"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { Office } from "@/lib/types/database";

type Props = {
  offices: Office[];
  currentOfficeId?: string;
};

export function LeadsFilter({ offices, currentOfficeId }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function onChange(officeId: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (officeId) params.set("office", officeId);
    else params.delete("office");
    router.push(`/app/leads?${params.toString()}`);
  }

  return (
    <select
      value={currentOfficeId ?? ""}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm"
    >
      <option value="">Усі офіси (доступні)</option>
      {offices.map((o) => (
        <option key={o.id} value={o.id}>
          {o.name_uk}
        </option>
      ))}
    </select>
  );
}
