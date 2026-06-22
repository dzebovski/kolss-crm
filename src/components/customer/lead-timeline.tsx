"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  DSBadge,
  DSIcon,
  DSSurface,
} from "@/components/ui/design-system";
import {
  type LeadTimelineItem,
  type LeadTimelineView,
} from "@/lib/lead-timeline";
import { formatLeadDateTime } from "@/lib/datetime";
import { isOptimisticTaskId } from "@/components/customer/lead-card-state";

type TimelineFilter = "all" | LeadTimelineView;

export function LeadTimeline({
  items,
  officeCode,
}: {
  items: LeadTimelineItem[];
  officeCode?: string;
}) {
  const t = useTranslations("customerCard.timeline");
  const [filter, setFilter] = useState<TimelineFilter>("records");
  const visibleItems = useMemo(
    () =>
      filter === "all" ? items : items.filter((item) => item.view === filter),
    [filter, items]
  );
  const filters: TimelineFilter[] = ["all", "records", "statuses", "tasks"];

  return (
    <DSSurface className="overflow-hidden">
      <div className="border-b border-[var(--ds-border)] px-4 py-4 sm:px-5">
        <h2 className="text-sm font-semibold">{t("title")}</h2>
        <div className="mt-3 flex gap-1 overflow-x-auto pb-1">
          {filters.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              className={`shrink-0 rounded-md px-2.5 py-1.5 text-xs font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--ds-focus)] ${
                filter === item
                  ? "bg-[var(--ds-surface-3)] text-[var(--ds-foreground)]"
                  : "text-[var(--ds-foreground-lighter)] hover:bg-[var(--ds-surface-2)] hover:text-[var(--ds-foreground)]"
              }`}
            >
              {t(`filters.${item}`)}
            </button>
          ))}
        </div>
      </div>

      {visibleItems.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-[var(--ds-foreground-lighter)]">
          {t("empty")}
        </p>
      ) : (
        <ol className="px-4 py-5 sm:px-5">
          {visibleItems.map((item, index) => (
            <li
              key={item.id}
              aria-busy={
                item.id.startsWith("task:") &&
                isOptimisticTaskId(item.id.slice("task:".length))
                  ? true
                  : undefined
              }
              className="relative flex gap-3 pb-6 last:pb-0"
            >
              {index < visibleItems.length - 1 && (
                <span className="absolute left-[15px] top-8 h-[calc(100%-20px)] w-px bg-[var(--ds-border)]" />
              )}
              <span className="z-10 grid size-8 shrink-0 place-items-center rounded-full border border-[var(--ds-border)] bg-[var(--ds-surface-1)] text-[var(--ds-foreground-light)]">
                <DSIcon name={item.icon} className="size-3.5" />
              </span>
              <div className="min-w-0 flex-1 pt-0.5">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium">{item.title}</p>
                  {item.tone && item.tone !== "neutral" && (
                    <DSBadge tone={item.tone} className="text-[10px]">
                      {t(`categories.${item.view}`)}
                    </DSBadge>
                  )}
                </div>
                {item.description && (
                  <p className="mt-1 whitespace-pre-wrap text-sm text-[var(--ds-foreground-light)]">
                    {item.description}
                  </p>
                )}
                <p className="mt-1.5 text-xs text-[var(--ds-foreground-lighter)]">
                  {[item.actor, formatLeadDateTime(item.occurredAt, officeCode)]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </DSSurface>
  );
}
