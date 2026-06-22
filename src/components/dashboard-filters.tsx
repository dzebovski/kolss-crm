"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { DSInput, DSSelect } from "@/components/ui/design-system";
import {
  detectActivePreset,
  presetRange,
  type DatePreset,
} from "@/lib/dashboard-period";
import { getOfficeLabel } from "@/lib/office-label";
import type { Office } from "@/lib/types/database";

const PRESETS: DatePreset[] = ["today", "yesterday", "week", "month"];

export function DashboardFilters({
  offices,
  currentOfficeId,
  dateFrom,
  dateTo,
  showOfficeFilter,
}: {
  offices: Office[];
  currentOfficeId: string;
  dateFrom: string;
  dateTo: string;
  showOfficeFilter: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const t = useTranslations("dashboard.filters");
  const activePreset = detectActivePreset(dateFrom, dateTo);

  function pushParams(next: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("period");

    for (const [name, value] of Object.entries(next)) {
      if (value) {
        params.set(name, value);
      } else {
        params.delete(name);
      }
    }

    const query = params.toString();
    router.push(query ? `/app/dashboard?${query}` : "/app/dashboard");
  }

  function updateParam(name: string, value: string) {
    pushParams({ [name]: value || undefined });
  }

  function applyPreset(preset: DatePreset) {
    const range = presetRange(preset);
    pushParams({ from: range.from, to: range.to });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {showOfficeFilter && (
        <DSSelect
          aria-label={t("officeAria")}
          value={currentOfficeId}
          onChange={(event) => updateParam("office", event.target.value)}
          className="w-44"
        >
          <option value="">{t("allOffices")}</option>
          {offices.map((office) => (
            <option key={office.id} value={office.id}>
              {getOfficeLabel(office, locale, t)}
            </option>
          ))}
        </DSSelect>
      )}

      <div className="flex items-center gap-1.5">
        <DSInput
          type="date"
          aria-label={t("fromAria")}
          value={dateFrom}
          onChange={(event) => updateParam("from", event.target.value)}
          className="w-36"
        />
        <span className="text-sm text-[var(--ds-muted)]">—</span>
        <DSInput
          type="date"
          aria-label={t("toAria")}
          value={dateTo}
          onChange={(event) => updateParam("to", event.target.value)}
          className="w-36"
        />
      </div>

      <div
        role="group"
        aria-label={t("presetAria")}
        className="inline-flex max-w-full items-center overflow-x-auto rounded-md bg-[var(--ds-surface-2)] p-0.5"
      >
        {PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            aria-pressed={activePreset === preset}
            onClick={() => applyPreset(preset)}
            className={`h-8 shrink-0 rounded-[5px] px-3 text-sm outline-none transition-[background-color,color,box-shadow] focus-visible:ring-2 focus-visible:ring-[var(--ds-focus)] ${
              activePreset === preset
                ? "bg-[var(--ds-surface-1)] font-medium text-[var(--ds-foreground)] shadow-[0_1px_2px_rgba(24,24,23,0.12),0_0_0_1px_rgba(24,24,23,0.06)]"
                : "text-[var(--ds-foreground-light)] hover:bg-[color:rgba(255,255,255,0.6)] hover:text-[var(--ds-foreground)]"
            }`}
          >
            {t(`presets.${preset}`)}
          </button>
        ))}
      </div>
    </div>
  );
}
