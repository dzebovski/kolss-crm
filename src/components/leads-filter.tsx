"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { Office } from "@/lib/types/database";

type Props = {
  offices: Office[];
  currentOfficeId?: string;
  disabled?: boolean;
  showAllOption?: boolean;
  basePath?: string;
};

export function LeadsFilter({
  offices,
  currentOfficeId,
  disabled = false,
  showAllOption = false,
  basePath = "/app/leads",
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function onChange(officeId: string) {
    if (disabled) return;
    const params = new URLSearchParams(searchParams.toString());
    if (officeId) params.set("office", officeId);
    else params.delete("office");
    params.delete("page");
    router.push(`${basePath}?${params.toString()}`);
  }

  return (
    <select
      value={currentOfficeId ?? ""}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      aria-label="Фільтр за офісом"
      className="rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-70"
    >
      {showAllOption && <option value="">Усі офіси</option>}
      {offices.map((o) => (
        <option key={o.id} value={o.id}>
          {o.name_uk}
        </option>
      ))}
    </select>
  );
}
