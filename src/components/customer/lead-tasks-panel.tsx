"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { cancelTask, completeTask } from "@/actions/workflow";
import {
  isOptimisticTaskId,
  useLeadCard,
} from "@/components/customer/lead-card-state";
import { DSButton, DSIcon, DSSurface } from "@/components/ui/design-system";
import { formatLeadDateTime } from "@/lib/datetime";
import type { Task } from "@/lib/types/database";

export function LeadTasksPanel({
  tasks,
  officeCode,
}: {
  tasks: Task[];
  officeCode?: string;
}) {
  const t = useTranslations("customerCard.tasksPanel");
  const tw = useTranslations("workflow");
  const tf = useTranslations("feedback");
  const { isPending, pendingKey, runMutation } = useLeadCard();
  const [error, setError] = useState<string | null>(null);

  async function run(
    key: string,
    action: () => ReturnType<typeof completeTask>,
    successMessage: string
  ) {
    setError(null);
    try {
      await runMutation(action, { key, successMessage });
    } catch (value) {
      setError(value instanceof Error ? value.message : "Error");
    }
  }

  if (!tasks.length) return null;

  return (
    <DSSurface className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-[var(--ds-border)] px-4 py-3">
        <h2 className="text-sm font-semibold">{t("title")}</h2>
        <span className="font-mono text-[10px] text-[var(--ds-foreground-lighter)]">
          {tasks.length}
        </span>
      </div>
      {error && (
        <p className="border-b border-[var(--ds-danger-border-soft)] bg-[var(--ds-danger-soft)] px-4 py-2 text-xs text-[var(--ds-danger-strong)]">
          {error}
        </p>
      )}
      <div className="divide-y divide-[var(--ds-border)]">
        {tasks.map((task) => (
          <div
            key={task.id}
            aria-busy={isOptimisticTaskId(task.id) || undefined}
            className="flex items-center gap-3 px-4 py-3"
          >
            <span className="grid size-8 shrink-0 place-items-center rounded-md bg-[var(--ds-info-soft)] text-[var(--ds-info-strong)]">
              {isOptimisticTaskId(task.id) ? (
                <span className="size-3.5 animate-spin rounded-full border-2 border-current border-r-transparent" />
              ) : (
                <DSIcon name="clock" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{task.title}</p>
              <p className="mt-0.5 text-xs text-[var(--ds-foreground-lighter)]">
                {isOptimisticTaskId(task.id)
                  ? tf("saving")
                  : formatLeadDateTime(task.due_at, officeCode)}
              </p>
            </div>
            {!isOptimisticTaskId(task.id) && (
              <div className="flex shrink-0 gap-1">
                <DSButton
                  size="sm"
                  variant="ghost"
                  disabled={isPending}
                  loading={pendingKey === `complete-task-${task.id}`}
                  loadingLabel={tf("completingTask")}
                  onClick={() =>
                    void run(
                      `complete-task-${task.id}`,
                      () => completeTask(task.id),
                      tf("taskCompleted")
                    )
                  }
                >
                  {tw("actions.completeTask")}
                </DSButton>
                <DSButton
                  size="icon"
                  variant="ghost"
                  aria-label={tw("actions.cancelTask")}
                  disabled={isPending}
                  loading={pendingKey === `cancel-task-${task.id}`}
                  onClick={() =>
                    void run(
                      `cancel-task-${task.id}`,
                      () => cancelTask(task.id, t("canceledComment")),
                      tf("taskCanceled")
                    )
                  }
                >
                  <DSIcon name="x" />
                </DSButton>
              </div>
            )}
          </div>
        ))}
      </div>
    </DSSurface>
  );
}
