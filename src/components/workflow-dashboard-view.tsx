import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { DSBadge, DSSurface } from "@/components/ui/design-system";
import type { WorkflowDashboard, WorkflowQueueItem } from "@/lib/db/workflow-dashboard";
import { formatPhoneDisplay } from "@/lib/phone";
import { formatLeadDateTime, officeTimeZone } from "@/lib/datetime";

export async function WorkflowDashboardView({
  data,
  isAdminView,
  filters,
  defaultOfficeCode,
}: {
  data: WorkflowDashboard;
  isAdminView: boolean;
  filters: React.ReactNode;
  defaultOfficeCode?: string;
}) {
  const td = await getTranslations("dashboard");
  const tw = await getTranslations("workflow");
  const locale = await getLocale();

  const metricCards = [
    { key: "leads_created", label: td("leadsCreated") },
    { key: "not_taken", label: td("notTaken") },
    { key: "reached", label: td("reached") },
    { key: "not_reached", label: td("notReached") },
    { key: "showroom_scheduled", label: td("showroomScheduled") },
    { key: "showroom_completed", label: td("showroomCompleted") },
    { key: "contracts_planned", label: td("contractsPlanned") },
    { key: "contracts_signed", label: td("contractsSigned") },
    { key: "overdue_tasks", label: td("overdueTasks") },
    { key: "no_contact_attempt", label: td("noContactAttempt") },
    { key: "no_show", label: td("noShow") },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">{td("title")}</h1>
        {filters}
      </div>

      {isAdminView && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {metricCards.map((card) => (
            <DSSurface key={card.key} className="p-4">
              <p className="text-xs text-[var(--ds-muted)]">{card.label}</p>
              <p className="text-2xl font-semibold">{data.totals[card.key] ?? 0}</p>
            </DSSurface>
          ))}
        </div>
      )}

      {isAdminView && (
        <DSSurface className="space-y-2 p-4">
          <h2 className="font-medium">{td("prepayments")}</h2>
          <div className="flex flex-wrap gap-4 text-sm">
            {Object.entries(data.prepayments_by_currency).map(([currency, total]) => (
              <span key={currency}>{currency}: {total}</span>
            ))}
            {Object.keys(data.prepayments_by_currency).length === 0 && <span>—</span>}
          </div>
        </DSSurface>
      )}

      {isAdminView && (
        <DSSurface className="space-y-2 p-4">
          <h2 className="font-medium">{td("funnel")}</h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 text-sm">
            {Object.entries(data.funnel).map(([key, value]) => (
              <div key={key} className="flex justify-between rounded-lg border border-[var(--ds-border)] px-3 py-2">
                <span>{tw(`status.${key}`)}</span>
                <span className="font-medium">{value}</span>
              </div>
            ))}
          </div>
        </DSSurface>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <QueueList title={td("queues.newLeads")} items={data.queues.new_leads} tw={tw} />
        <ScheduledEventsList
          title={td("queues.callbacks")}
          items={data.queues.callbacks}
          tw={tw}
          td={td}
          locale={locale}
          defaultOfficeCode={defaultOfficeCode}
        />
        <QueueList title={td("queues.noShow")} items={data.queues.no_show} tw={tw} />
        <QueueList title={td("queues.scheduledShowroom")} items={data.queues.scheduled_showroom} tw={tw} />
        <QueueList title={td("queues.contractPrepay")} items={data.queues.contract_prepay} tw={tw} />
      </div>
    </div>
  );
}

type DatedQueueItem = {
  dateKey: string;
  item: WorkflowQueueItem;
};

type ScheduledEventGroups = {
  overdue: Map<string, WorkflowQueueItem[]>;
  today: DatedQueueItem[];
  tomorrow: DatedQueueItem[];
  scheduled: Map<string, WorkflowQueueItem[]>;
  todayDateKey: string;
  tomorrowDateKey: string;
};

function ScheduledEventsList({
  title,
  items,
  tw,
  td,
  locale,
  defaultOfficeCode = "kyiv",
}: {
  title: string;
  items: WorkflowQueueItem[];
  tw: Awaited<ReturnType<typeof getTranslations>>;
  td: Awaited<ReturnType<typeof getTranslations>>;
  locale: string;
  defaultOfficeCode?: string;
}) {
  const groups = groupScheduledEvents(items, defaultOfficeCode);

  return (
    <DSSurface className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-[var(--ds-border)] px-4 py-3">
        <h3 className="font-medium">{title}</h3>
        <span className="font-mono text-[10px] text-[var(--ds-foreground-lighter)]">
          {items.length}
        </span>
      </div>

      <div className="max-h-[48rem] overflow-y-auto">
        {groups.overdue.size > 0 && (
          <DatedEventCollection
            title={td("queues.dateGroups.overdue")}
            groups={groups.overdue}
            locale={locale}
            tw={tw}
            tone="danger"
          />
        )}

        <RelativeDateEventSection
          title={td("queues.dateGroups.today")}
          dateKey={groups.today[0]?.dateKey ?? groups.todayDateKey}
          items={groups.today.map(({ item }) => item)}
          locale={locale}
          tw={tw}
        />

        <RelativeDateEventSection
          title={td("queues.dateGroups.tomorrow")}
          dateKey={groups.tomorrow[0]?.dateKey ?? groups.tomorrowDateKey}
          items={groups.tomorrow.map(({ item }) => item)}
          locale={locale}
          tw={tw}
        />

        {groups.scheduled.size > 0 && (
          <DatedEventCollection
            title={td("queues.dateGroups.scheduled")}
            groups={groups.scheduled}
            locale={locale}
            tw={tw}
          />
        )}
      </div>
    </DSSurface>
  );
}

function RelativeDateEventSection({
  title,
  dateKey,
  items,
  locale,
  tw,
}: {
  title: string;
  dateKey: string;
  items: WorkflowQueueItem[];
  locale: string;
  tw: Awaited<ReturnType<typeof getTranslations>>;
}) {
  return (
    <section className="border-b border-[var(--ds-border)] last:border-b-0">
      <DateHeading title={title} dateKey={dateKey} locale={locale} />
      <EventRows items={items} locale={locale} tw={tw} />
    </section>
  );
}

function DatedEventCollection({
  title,
  groups,
  locale,
  tw,
  tone = "neutral",
}: {
  title: string;
  groups: Map<string, WorkflowQueueItem[]>;
  locale: string;
  tw: Awaited<ReturnType<typeof getTranslations>>;
  tone?: "neutral" | "danger";
}) {
  return (
    <section className="border-b border-[var(--ds-border)] last:border-b-0">
      <div
        className={`px-4 py-2.5 ${
          tone === "danger"
            ? "bg-[var(--ds-danger-soft)] text-[var(--ds-danger-strong)]"
            : "bg-[var(--ds-surface-2)] text-[var(--ds-foreground-light)]"
        }`}
      >
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em]">
          {title}
        </p>
      </div>
      {[...groups.entries()].map(([dateKey, dateItems]) => (
        <div key={dateKey}>
          <div className="border-y border-[var(--ds-border)] bg-[var(--ds-surface-1)] px-4 py-2 first:border-t-0">
            <p className="text-xs font-medium capitalize text-[var(--ds-foreground-light)]">
              {formatDateKey(dateKey, locale, true)}
            </p>
          </div>
          <EventRows items={dateItems} locale={locale} tw={tw} />
        </div>
      ))}
    </section>
  );
}

function DateHeading({
  title,
  dateKey,
  locale,
}: {
  title: string;
  dateKey: string;
  locale: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 bg-[var(--ds-surface-2)] px-4 py-2.5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--ds-foreground)]">
        {title}
      </p>
      <p className="text-xs capitalize text-[var(--ds-foreground-lighter)]">
        {formatDateKey(dateKey, locale)}
      </p>
    </div>
  );
}

function EventRows({
  items,
  locale,
  tw,
}: {
  items: WorkflowQueueItem[];
  locale: string;
  tw: Awaited<ReturnType<typeof getTranslations>>;
}) {
  if (items.length === 0) {
    return (
      <p className="px-4 py-4 text-sm text-[var(--ds-foreground-lighter)]">—</p>
    );
  }

  return (
    <ul className="divide-y divide-[var(--ds-border)]">
      {items.map((item) => {
        const officeCode = item.office_code ?? "kyiv";
        const isOverdue = Boolean(item.is_overdue);

        return (
          <li key={item.event_id ?? `${item.id}-${item.next_task_due_at ?? ""}`}>
            <Link
              href={`/app/leads/${item.id}`}
              className={`group flex gap-3 px-4 py-3 transition-colors hover:bg-[var(--ds-surface-2)] ${
                isOverdue ? "bg-[var(--ds-danger-soft)]/45" : ""
              }`}
            >
              <span
                className={`mt-0.5 w-12 shrink-0 font-mono text-xs font-semibold ${
                  isOverdue
                    ? "text-[var(--ds-danger-strong)]"
                    : "text-[var(--ds-accent-strong)]"
                }`}
              >
                {item.next_task_due_at
                  ? formatEventTime(item.next_task_due_at, locale, officeCode)
                  : "—"}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-[var(--ds-foreground)] group-hover:text-[var(--ds-accent-strong)]">
                  {item.name ?? "—"}
                </span>
                {item.next_task_title && (
                  <span className="mt-0.5 block truncate text-xs text-[var(--ds-foreground-light)]">
                    {item.next_task_title}
                  </span>
                )}
                <span className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-[var(--ds-foreground-lighter)]">
                  <span>{formatPhoneDisplay(item.phone, officeCode)}</span>
                  <DSBadge>{tw(`status.${item.workflow_status}`)}</DSBadge>
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function groupScheduledEvents(
  items: WorkflowQueueItem[],
  defaultOfficeCode: string
): ScheduledEventGroups {
  const now = new Date();
  const defaultTimeZone = officeTimeZone(defaultOfficeCode);
  const todayDateKey = dateKeyInTimeZone(now, defaultTimeZone);
  const tomorrowDateKey = addDaysToDateKey(todayDateKey, 1);
  const overdue = new Map<string, WorkflowQueueItem[]>();
  const today: DatedQueueItem[] = [];
  const tomorrow: DatedQueueItem[] = [];
  const scheduled = new Map<string, WorkflowQueueItem[]>();

  for (const item of items) {
    if (!item.next_task_due_at) continue;

    const timeZone = officeTimeZone(item.office_code ?? defaultOfficeCode);
    const dateKey = dateKeyInTimeZone(new Date(item.next_task_due_at), timeZone);
    const officeTodayKey = dateKeyInTimeZone(now, timeZone);
    const officeTomorrowKey = addDaysToDateKey(officeTodayKey, 1);

    if (dateKey < officeTodayKey) {
      appendDateGroup(overdue, dateKey, item);
    } else if (dateKey === officeTodayKey) {
      today.push({ dateKey, item });
    } else if (dateKey === officeTomorrowKey) {
      tomorrow.push({ dateKey, item });
    } else {
      appendDateGroup(scheduled, dateKey, item);
    }
  }

  return {
    overdue,
    today,
    tomorrow,
    scheduled,
    todayDateKey,
    tomorrowDateKey,
  };
}

function appendDateGroup(
  groups: Map<string, WorkflowQueueItem[]>,
  dateKey: string,
  item: WorkflowQueueItem
) {
  const existing = groups.get(dateKey);
  if (existing) {
    existing.push(item);
  } else {
    groups.set(dateKey, [item]);
  }
}

function dateKeyInTimeZone(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `${value("year")}-${value("month")}-${value("day")}`;
}

function addDaysToDateKey(dateKey: string, days: number): string {
  const date = new Date(`${dateKey}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function formatDateKey(
  dateKey: string,
  locale: string,
  includeWeekday = false
): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone: "UTC",
    day: "numeric",
    month: "long",
    ...(includeWeekday ? { weekday: "long" as const } : {}),
  }).format(new Date(`${dateKey}T12:00:00Z`));
}

function formatEventTime(
  iso: string,
  locale: string,
  officeCode: string
): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone: officeTimeZone(officeCode),
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

function QueueList({
  title,
  items,
  tw,
  highlightOverdue,
}: {
  title: string;
  items: WorkflowQueueItem[];
  tw: Awaited<ReturnType<typeof getTranslations>>;
  highlightOverdue?: boolean;
}) {
  return (
    <DSSurface className="space-y-3 p-4">
      <h3 className="font-medium">{title}</h3>
      {items.length === 0 ? (
        <p className="text-sm text-[var(--ds-muted)]">—</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => {
            const isOverdue = highlightOverdue && item.is_overdue;
            return (
              <li
                key={item.id}
                className={`rounded-lg border p-3 text-sm ${isOverdue ? "border-red-300 bg-red-50" : "border-[var(--ds-border)]"}`}
              >
                <Link href={`/app/leads/${item.id}`} className="font-medium text-[var(--ds-accent)] hover:underline">
                  {item.name ?? "—"}
                </Link>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-[var(--ds-muted)]">
                  <span>{formatPhoneDisplay(item.phone, "kyiv")}</span>
                  <DSBadge>{tw(`status.${item.workflow_status}`)}</DSBadge>
                  {item.next_task_due_at && (
                    <span>{formatLeadDateTime(item.next_task_due_at)}</span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </DSSurface>
  );
}
