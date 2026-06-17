import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { DSBadge, DSSurface } from "@/components/ui/design-system";
import type { WorkflowDashboard, WorkflowQueueItem } from "@/lib/db/workflow-dashboard";
import { formatPhoneDisplay } from "@/lib/phone";
import { formatLeadDateTime } from "@/lib/datetime";

export async function WorkflowDashboardView({
  data,
  isAdminView,
  filters,
}: {
  data: WorkflowDashboard;
  isAdminView: boolean;
  filters: React.ReactNode;
}) {
  const td = await getTranslations("dashboard");
  const tw = await getTranslations("workflow");

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
        <QueueList title={td("queues.callbacks")} items={data.queues.callbacks} tw={tw} highlightOverdue />
        <QueueList title={td("queues.noShow")} items={data.queues.no_show} tw={tw} />
        <QueueList title={td("queues.scheduledShowroom")} items={data.queues.scheduled_showroom} tw={tw} />
        <QueueList title={td("queues.contractPrepay")} items={data.queues.contract_prepay} tw={tw} />
      </div>
    </div>
  );
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
