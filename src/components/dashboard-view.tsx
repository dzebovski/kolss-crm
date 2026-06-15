import Link from "next/link";
import {
  DSBadge,
  DSIcon,
  DSSurface,
  type IconName,
} from "@/components/ui/design-system";
import { formatLeadDateTime } from "@/lib/datetime";
import type {
  DashboardOverview,
  DashboardWorkItem,
  DashboardWorkItemKind,
} from "@/lib/db/dashboard";
import type { LeadStatus, ProjectStage } from "@/lib/types/database";

type DashboardMetric = {
  label: string;
  value: string | number;
  detail: string;
  icon: IconName;
  tone?: "default" | "warning" | "danger" | "success";
  href?: string;
};

const workItemConfig: Record<
  DashboardWorkItemKind,
  {
    label: string;
    description: string;
    tone: "accent" | "warning" | "danger";
    icon: IconName;
  }
> = {
  callback_overdue: {
    label: "Прострочений передзвон",
    description: "Час контакту вже минув",
    tone: "danger",
    icon: "phone",
  },
  callback_today: {
    label: "Передзвон сьогодні",
    description: "Запланований контакт із клієнтом",
    tone: "warning",
    icon: "clock",
  },
  new_unassigned: {
    label: "Новий нерозподілений лід",
    description: "Потрібно взяти в роботу",
    tone: "accent",
    icon: "inbox",
  },
  stale_approval: {
    label: "Погодження без активності",
    description: "Клієнт думає понад 3 дні",
    tone: "warning",
    icon: "briefcase",
  },
};

function MetricCard({ metric }: { metric: DashboardMetric }) {
  const toneClass = {
    default: "text-[var(--ds-foreground)]",
    warning: "text-[var(--ds-warning-strong)]",
    danger: "text-[var(--ds-danger-strong)]",
    success: "text-[var(--ds-success-strong)]",
  }[metric.tone ?? "default"];

  const content = (
    <>
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs font-medium text-[var(--ds-foreground-light)]">
          {metric.label}
        </p>
        <span className="grid size-7 place-items-center rounded-md border border-[var(--ds-border)] bg-[var(--ds-surface-2)] text-[var(--ds-foreground-lighter)]">
          <DSIcon name={metric.icon} />
        </span>
      </div>
      <p className={`mt-4 text-3xl font-medium tracking-[-0.04em] ${toneClass}`}>
        {metric.value}
      </p>
      <p className="mt-1.5 text-xs leading-5 text-[var(--ds-foreground-lighter)]">
        {metric.detail}
      </p>
    </>
  );

  if (metric.href) {
    return (
      <Link
        href={metric.href}
        className="block rounded-lg border border-[var(--ds-border)] bg-[var(--ds-surface-1)] p-4 shadow-[var(--ds-shadow-card)] outline-none transition-[background-color,border-color,box-shadow] hover:border-[var(--ds-border-hover)] hover:bg-[var(--ds-surface-0)] hover:shadow-[var(--ds-shadow-button-hover)] focus-visible:ring-2 focus-visible:ring-[var(--ds-focus)]"
      >
        {content}
      </Link>
    );
  }

  return <DSSurface className="p-4">{content}</DSSurface>;
}

function SectionHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--ds-border)] px-5 py-4">
      <div>
        <h2 className="text-sm font-semibold text-[var(--ds-foreground)]">
          {title}
        </h2>
        <p className="mt-1 text-xs leading-5 text-[var(--ds-foreground-lighter)]">
          {description}
        </p>
      </div>
      {action}
    </div>
  );
}

function WorkItemRow({
  item,
  showOffice,
}: {
  item: DashboardWorkItem;
  showOffice: boolean;
}) {
  const config = workItemConfig[item.kind];
  const href =
    item.entity_type === "lead"
      ? `/app/leads/${item.id}`
      : `/app/projects/${item.id}`;

  return (
    <Link
      href={href}
      className="group flex items-start gap-3 border-b border-[var(--ds-border)] px-5 py-3.5 outline-none transition-colors last:border-b-0 hover:bg-[var(--ds-surface-2)] focus-visible:bg-[var(--ds-surface-2)]"
    >
      <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-md border border-[var(--ds-border)] bg-[var(--ds-surface-1)] text-[var(--ds-foreground-light)] transition-colors group-hover:border-[var(--ds-border-hover)] group-hover:text-[var(--ds-foreground)]">
        <DSIcon name={config.icon} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="truncate text-sm font-medium text-[var(--ds-foreground)]">
            {item.title}
          </span>
          <DSBadge tone={config.tone}>{config.label}</DSBadge>
          {showOffice && <DSBadge>{item.office_name}</DSBadge>}
        </span>
        <span className="mt-1 block truncate text-xs text-[var(--ds-foreground-light)]">
          {item.detail}
        </span>
        <span className="mt-1 block text-[11px] text-[var(--ds-foreground-lighter)]">
          {item.due_at
            ? formatLeadDateTime(item.due_at, item.office_code)
            : config.description}
        </span>
      </span>
      <DSIcon
        name="arrow-right"
        className="mt-2 text-[var(--ds-foreground-lighter)] transition-colors group-hover:text-[var(--ds-foreground)]"
      />
    </Link>
  );
}

function WorkList({
  title,
  description,
  items,
  showOffice,
  emptyText,
}: {
  title: string;
  description: string;
  items: DashboardWorkItem[];
  showOffice: boolean;
  emptyText: string;
}) {
  return (
    <DSSurface className="overflow-hidden">
      <SectionHeader
        title={title}
        description={description}
        action={<DSBadge>{items.length}</DSBadge>}
      />
      {items.length > 0 ? (
        <div>
          {items.slice(0, 6).map((item) => (
            <WorkItemRow
              key={`${item.kind}-${item.id}`}
              item={item}
              showOffice={showOffice}
            />
          ))}
        </div>
      ) : (
        <div className="grid min-h-44 place-items-center px-6 py-10 text-center">
          <div>
            <span className="mx-auto grid size-9 place-items-center rounded-md border border-[var(--ds-border)] bg-[var(--ds-surface-2)] text-[var(--ds-success-strong)]">
              <DSIcon name="check" />
            </span>
            <p className="mt-3 text-sm font-medium">{emptyText}</p>
            <p className="mt-1 text-xs text-[var(--ds-foreground-lighter)]">
              Немає записів, що потребують дії.
            </p>
          </div>
        </div>
      )}
    </DSSurface>
  );
}

function StatusDistribution({
  title,
  description,
  statuses,
  counts,
  hrefBase,
  officeId,
}: {
  title: string;
  description: string;
  statuses: Array<{ code: string; label: string }>;
  counts: Record<string, number>;
  hrefBase: string;
  officeId?: string;
}) {
  const total = Object.values(counts).reduce((sum, value) => sum + value, 0);
  const max = Math.max(1, ...Object.values(counts));
  const listHref = officeId ? `${hrefBase}?office=${officeId}` : hrefBase;

  return (
    <DSSurface className="overflow-hidden">
      <SectionHeader
        title={title}
        description={description}
        action={
          <Link
            href={listHref}
            className="rounded-md px-2 py-1 text-xs font-medium text-[var(--ds-foreground-light)] outline-none transition-colors hover:bg-[var(--ds-surface-2)] hover:text-[var(--ds-foreground)] focus-visible:ring-2 focus-visible:ring-[var(--ds-focus)]"
          >
            Відкрити список
          </Link>
        }
      />
      <div className="space-y-4 p-5">
        {statuses.map((status) => {
          const count = counts[status.code] ?? 0;
          const params = new URLSearchParams({ status: status.code });
          if (officeId) params.set("office", officeId);
          return (
            <Link
              key={status.code}
              href={`${hrefBase}?${params.toString()}`}
              className="group block rounded-md outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-focus)]"
            >
              <span className="mb-1.5 flex items-center justify-between gap-4 text-xs">
                <span className="text-[var(--ds-foreground-light)] transition-colors group-hover:text-[var(--ds-foreground)]">
                  {status.label}
                </span>
                <span className="font-mono text-[11px] text-[var(--ds-foreground-lighter)]">
                  {count}
                </span>
              </span>
              <span className="block h-1.5 overflow-hidden rounded-full bg-[var(--ds-surface-3)]">
                <span
                  className="block h-full rounded-full bg-[var(--ds-accent)] transition-colors group-hover:bg-[var(--ds-primary)]"
                  style={{ width: `${(count / max) * 100}%` }}
                />
              </span>
            </Link>
          );
        })}
        {total === 0 && (
          <p className="py-4 text-center text-xs text-[var(--ds-foreground-lighter)]">
            Даних за вибраним офісом ще немає.
          </p>
        )}
      </div>
    </DSSurface>
  );
}

function TeamDiscipline({
  data,
  showOffice,
}: {
  data: DashboardOverview;
  showOffice: boolean;
}) {
  return (
    <DSSurface className="overflow-hidden">
      <SectionHeader
        title="Дисципліна команди"
        description="Поточне навантаження та прострочені контакти."
        action={<DSBadge>{data.team.length} користувачів</DSBadge>}
      />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] text-left text-xs">
          <thead className="border-b border-[var(--ds-border)] bg-[var(--ds-surface-0)] text-[var(--ds-foreground-lighter)]">
            <tr>
              <th className="px-5 py-2.5 font-medium">Менеджер</th>
              {showOffice && (
                <th className="px-4 py-2.5 font-medium">Офіс</th>
              )}
              <th className="px-4 py-2.5 text-right font-medium">
                Ліди в роботі
              </th>
              <th className="px-4 py-2.5 text-right font-medium">
                Активні проєкти
              </th>
              <th className="px-5 py-2.5 text-right font-medium">
                Прострочено
              </th>
            </tr>
          </thead>
          <tbody>
            {data.team.map((member) => (
              <tr
                key={member.id}
                className="border-b border-[var(--ds-border)] last:border-b-0 hover:bg-[var(--ds-surface-2)]"
              >
                <td className="px-5 py-3 font-medium text-[var(--ds-foreground)]">
                  {member.display_name}
                </td>
                {showOffice && (
                  <td className="px-4 py-3 text-[var(--ds-foreground-light)]">
                    {member.offices.join(", ")}
                  </td>
                )}
                <td className="px-4 py-3 text-right font-mono">
                  {member.active_leads}
                </td>
                <td className="px-4 py-3 text-right font-mono">
                  {member.active_projects}
                </td>
                <td className="px-5 py-3 text-right">
                  <DSBadge
                    tone={member.overdue_callbacks > 0 ? "danger" : "success"}
                  >
                    {member.overdue_callbacks}
                  </DSBadge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.team.length === 0 && (
          <p className="px-5 py-8 text-center text-xs text-[var(--ds-foreground-lighter)]">
            Активних користувачів у вибраному офісі немає.
          </p>
        )}
      </div>
    </DSSurface>
  );
}

function RecentLeads({
  data,
  leadStatusMap,
  showOffice,
  officeId,
}: {
  data: DashboardOverview;
  leadStatusMap: Map<string, string>;
  showOffice: boolean;
  officeId?: string;
}) {
  const statusTone = (status: string) => {
    if (status === "converted") return "success" as const;
    if (status === "failed") return "danger" as const;
    if (status === "in_progress") return "info" as const;
    return "accent" as const;
  };

  return (
    <DSSurface className="overflow-hidden">
      <SectionHeader
        title="Останні ліди"
        description="Найновіші звернення у поточному офісному контексті."
        action={
          <Link
            href={officeId ? `/app/leads?office=${officeId}` : "/app/leads"}
            className="rounded-md px-2 py-1 text-xs font-medium text-[var(--ds-foreground-light)] outline-none transition-colors hover:bg-[var(--ds-surface-2)] hover:text-[var(--ds-foreground)] focus-visible:ring-2 focus-visible:ring-[var(--ds-focus)]"
          >
            Усі ліди
          </Link>
        }
      />
      <div>
        {data.recent_leads.map((lead) => (
          <Link
            key={lead.id}
            href={`/app/leads/${lead.id}`}
            className="group grid gap-2 border-b border-[var(--ds-border)] px-5 py-3.5 outline-none transition-colors last:border-b-0 hover:bg-[var(--ds-surface-2)] focus-visible:bg-[var(--ds-surface-2)] sm:grid-cols-[minmax(0,1fr)_auto_auto]"
          >
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-[var(--ds-foreground)]">
                {lead.name}
              </span>
              <span className="mt-0.5 block truncate text-xs text-[var(--ds-foreground-lighter)]">
                {lead.product_interest ?? lead.phone ?? "Без уточненого продукту"}
              </span>
            </span>
            <span className="flex items-center gap-2">
              {showOffice && <DSBadge>{lead.office_name}</DSBadge>}
              <DSBadge tone={statusTone(lead.lead_status)}>
                {leadStatusMap.get(lead.lead_status) ?? lead.lead_status}
              </DSBadge>
            </span>
            <span className="self-center whitespace-nowrap text-[11px] text-[var(--ds-foreground-lighter)]">
              {formatLeadDateTime(lead.created_at, lead.office_code)}
            </span>
          </Link>
        ))}
        {data.recent_leads.length === 0 && (
          <p className="px-5 py-8 text-center text-xs text-[var(--ds-foreground-lighter)]">
            Нових лідів ще немає.
          </p>
        )}
      </div>
    </DSSurface>
  );
}

export function DashboardView({
  data,
  isAdminView,
  showOffice,
  leadStatuses,
  projectStages,
  filters,
  userName,
  officeId,
}: {
  data: DashboardOverview;
  isAdminView: boolean;
  showOffice: boolean;
  leadStatuses: LeadStatus[];
  projectStages: ProjectStage[];
  filters?: React.ReactNode;
  userName: string;
  officeId?: string;
}) {
  function scopedHref(path: string) {
    if (!officeId) return path;
    const separator = path.includes("?") ? "&" : "?";
    return `${path}${separator}office=${officeId}`;
  }

  const conversionRate =
    data.totals.leads_created > 0
      ? Math.round(
          (data.totals.leads_converted / data.totals.leads_created) * 100
        )
      : 0;
  const overdueItems = data.work_items.filter(
    (item) =>
      item.kind === "callback_overdue" || item.kind === "stale_approval"
  );
  const todayItems = data.work_items.filter(
    (item) =>
      item.kind === "callback_today" || item.kind === "new_unassigned"
  );

  const metrics: DashboardMetric[] = isAdminView
    ? [
        {
          label: `Нові ліди · ${data.period_days} днів`,
          value: data.totals.leads_created,
          detail: `${data.totals.leads_new} зараз очікують на роботу`,
          icon: "inbox",
          href: scopedHref("/app/leads?status=new"),
        },
        {
          label: "Конверсія нових лідів",
          value: `${conversionRate}%`,
          detail: `${data.totals.leads_converted} конвертовано за період`,
          icon: "arrow-right",
          tone: "success",
          href: scopedHref("/app/leads?status=converted"),
        },
        {
          label: "Активні проєкти",
          value: data.totals.active_projects,
          detail: `${data.totals.completed_projects} завершено за період`,
          icon: "briefcase",
          href: scopedHref("/app/projects"),
        },
        {
          label: "Прострочені дії",
          value:
            data.totals.callback_overdue + data.totals.stale_approvals,
          detail: `${data.totals.callback_overdue} передзвонів · ${data.totals.stale_approvals} погоджень`,
          icon: "clock",
          tone:
            data.totals.callback_overdue + data.totals.stale_approvals > 0
              ? "danger"
              : "success",
        },
      ]
    : [
        {
          label: "Нові нерозподілені",
          value: data.totals.new_unassigned,
          detail: "Доступні всій команді офісу",
          icon: "inbox",
          tone: data.totals.new_unassigned > 0 ? "warning" : "success",
          href: scopedHref("/app/leads?status=new"),
        },
        {
          label: "Ліди в роботі",
          value: data.totals.leads_in_progress,
          detail: "Усі активні записи вашого офісу",
          icon: "users",
          href: scopedHref("/app/leads?status=in_progress"),
        },
        {
          label: "Передзвони сьогодні",
          value: data.totals.callback_today,
          detail: "Заплановані контакти до кінця дня",
          icon: "phone",
          tone: data.totals.callback_today > 0 ? "warning" : "success",
          href: scopedHref("/app/leads?callback=1"),
        },
        {
          label: "Прострочені дії",
          value:
            data.totals.callback_overdue + data.totals.stale_approvals,
          detail: "Передзвони та завислі погодження",
          icon: "clock",
          tone:
            data.totals.callback_overdue + data.totals.stale_approvals > 0
              ? "danger"
              : "success",
        },
      ];

  const leadStatusMap = new Map(
    leadStatuses.map((status) => [status.code, status.label_uk])
  );

  return (
    <div className="-mx-4 -my-6 min-h-[calc(100vh-64px)] bg-[var(--ds-surface-0)] px-4 py-6 text-[var(--ds-foreground)]">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--ds-foreground-lighter)]">
                {isAdminView ? "Операційний контроль" : "Робочий день"}
              </p>
              <DSBadge tone={isAdminView ? "accent" : "neutral"}>
                {isAdminView ? "Адміністратор" : "Менеджер"}
              </DSBadge>
            </div>
            <h1 className="mt-2 text-2xl font-medium tracking-[-0.035em] sm:text-3xl">
              {isAdminView ? "Дашборд продажів" : `Вітаємо, ${userName}`}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--ds-foreground-light)]">
              {isAdminView
                ? "Статус продажів, навантаження команди та дії, які потребують уваги."
                : "Пріоритети офісу на сьогодні: нові звернення, передзвони та прострочені дії."}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {filters}
            <Link
              href="/app/leads/new"
              className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-[var(--ds-primary-border)] bg-[var(--ds-primary)] px-3 text-sm font-medium text-white shadow-[var(--ds-shadow-button)] outline-none transition-[background-color,border-color,box-shadow] hover:border-[var(--ds-primary-hover)] hover:bg-[var(--ds-primary-hover)] hover:shadow-[var(--ds-shadow-button-hover)] focus-visible:ring-2 focus-visible:ring-[var(--ds-focus)] focus-visible:ring-offset-2"
            >
              <DSIcon name="plus" />
              Новий лід
            </Link>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <MetricCard key={metric.label} metric={metric} />
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <WorkList
            title="Прострочено"
            description="Передзвони та погодження, де команда вже втратила темп."
            items={overdueItems}
            showOffice={showOffice}
            emptyText="Прострочень немає"
          />
          <WorkList
            title="Сьогодні та нові"
            description="Заплановані контакти й нерозподілені звернення офісу."
            items={todayItems}
            showOffice={showOffice}
            emptyText="Черга на сьогодні чиста"
          />
        </div>

        {isAdminView && (
          <TeamDiscipline data={data} showOffice={showOffice} />
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          <StatusDistribution
            title="Статуси лідів"
            description="Поточний стан усіх доступних звернень."
            statuses={leadStatuses.map((status) => ({
              code: status.code,
              label: status.label_uk,
            }))}
            counts={data.leads_by_status}
            hrefBase="/app/leads"
            officeId={officeId}
          />
          <StatusDistribution
            title="Етапи проєктів"
            description="Розподіл активних і завершених проєктів."
            statuses={projectStages.map((stage) => ({
              code: stage.code,
              label: stage.label_uk,
            }))}
            counts={data.projects_by_status}
            hrefBase="/app/projects"
            officeId={officeId}
          />
        </div>

        <RecentLeads
          data={data}
          leadStatusMap={leadStatusMap}
          showOffice={showOffice}
          officeId={officeId}
        />
      </div>
    </div>
  );
}
