"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { setLeadQuality } from "@/actions/workflow";
import { LeadActivityComposer } from "@/components/customer/lead-activity-composer";
import { LeadCloseDialog } from "@/components/customer/lead-close-dialog";
import {
  LeadCardProvider,
  isOptimisticTaskId,
  useLeadCard,
} from "@/components/customer/lead-card-state";
import { LeadCommercePanel } from "@/components/customer/lead-commerce-panel";
import { LeadDetailsPanel } from "@/components/customer/lead-details-panel";
import { LeadFilesPanel } from "@/components/customer/lead-files-panel";
import { LeadTasksPanel } from "@/components/customer/lead-tasks-panel";
import { LeadTimeline } from "@/components/customer/lead-timeline";
import {
  DSBadge,
  DSButton,
  DSIcon,
  DSSurface,
} from "@/components/ui/design-system";
import { formatLeadDateTime, isPastDate } from "@/lib/datetime";
import type { LeadPageData } from "@/lib/db/lead-detail";
import { buildLeadTimeline } from "@/lib/lead-timeline";
import { isTerminalWorkflowStatus } from "@/lib/workflow";

export function CustomerCard({ data }: { data: LeadPageData }) {
  return (
    <LeadCardProvider initialData={data}>
      <CustomerCardContent />
    </LeadCardProvider>
  );
}

function CustomerCardContent() {
  const t = useTranslations("customerCard");
  const tw = useTranslations("workflow");
  const tc = useTranslations("common");
  const ts = useTranslations("sourceSystem");
  const tf = useTranslations("feedback");
  const { data, isPending, pendingKey, runMutation } = useLeadCard();
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const lead = data.lead;
  const officeJoined = lead.offices;
  const office = Array.isArray(officeJoined) ? officeJoined[0] : officeJoined;
  const officeCode = office?.code;
  const openTasks = data.tasks
    .filter((task) => task.status === "open")
    .sort(
      (left, right) =>
        new Date(left.due_at).getTime() - new Date(right.due_at).getTime()
    );
  const openVisit =
    data.visits.find((visit) => visit.status === "scheduled") ?? null;
  const plannedContract =
    data.contracts.find((contract) => contract.status === "planned") ?? null;
  const nextTask = openTasks[0] ?? null;
  const nextTaskSaving = nextTask ? isOptimisticTaskId(nextTask.id) : false;
  const isOverdue = nextTask != null && isPastDate(nextTask.due_at);
  const sourceSystem =
    lead.source_system === "meta_lead_ads" ||
    lead.source_system === "google_ads" ||
    lead.source_system === "site_form" ||
    lead.source_system === "manual"
      ? ts(lead.source_system)
      : lead.source_system;

  const timeline = buildLeadTimeline(data, {
    callResult: (result) => tw(`callResult.${result}`),
    showroomStatus: (status) => tw(`showroomStatus.${status}`),
    contractStatus: (status) => tw(`contractStatus.${status}`),
    paymentType: (type) => tw(`paymentType.${type}`),
    taskStatus: (status) =>
      status === "open"
        ? tc("open")
        : status === "done"
          ? tc("done")
          : tc("canceled"),
    formatDate: (value) => formatLeadDateTime(value, officeCode),
    taskDue: t("nextDue"),
    comment: t("timeline.note"),
    fileAdded: t("timeline.fileAdded"),
    eventTitles: {
      created: t("timeline.events.created"),
      lead_assigned: t("timeline.events.lead_assigned"),
      customer_data_updated: t("timeline.events.customer_data_updated"),
      callback_cleared: t("timeline.events.callback_cleared"),
      no_answer: t("timeline.events.no_answer"),
      converted: t("timeline.events.converted"),
      status_changed: t("timeline.events.status_changed"),
      note_added: t("timeline.events.note_added"),
      lead_quality_changed: t("timeline.events.lead_quality_changed"),
    },
    qualityLabel: (quality: string | null) =>
      quality === "good"
        ? t("quality.good")
        : quality === "bad"
          ? t("quality.bad")
          : t("quality.cleared"),
  });

  return (
    <div className="mx-auto max-w-[1480px] space-y-5">
      <div>
        <Link
          href="/app/leads"
          className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-medium text-[var(--ds-foreground-lighter)] transition-colors hover:text-[var(--ds-foreground)]"
        >
          <span aria-hidden="true">←</span>
          {tc("back")}
        </Link>
      </div>

      <DSSurface className="relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-0.5 bg-[var(--ds-accent)]" />
        {!isTerminalWorkflowStatus(lead.workflow_status) && (
          <div className="absolute right-4 top-4 sm:right-5 sm:top-5">
            <DSButton
              type="button"
              variant="ghost"
              className="cursor-pointer text-[var(--ds-danger-strong)] hover:bg-[var(--ds-danger-soft)] hover:text-[var(--ds-danger-strong)]"
              disabled={isPending}
              onClick={() => setCloseDialogOpen(true)}
            >
              {t("closeLead.action")}
            </DSButton>
          </div>
        )}
        <div
          className={`grid gap-5 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-center ${
            !isTerminalWorkflowStatus(lead.workflow_status) ? "pr-28 sm:pr-36" : ""
          }`}
        >
          <div className="flex min-w-0 items-start gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-lg border border-[var(--ds-accent-border)] bg-[var(--ds-accent-soft)] text-[var(--ds-accent-strong)]">
              <DSIcon name="user" className="size-5" />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-xl font-semibold tracking-tight sm:text-2xl">
                  {lead.name ?? tc("name")}
                </h1>
                <DSBadge tone={statusTone(lead.workflow_status)} dot>
                  {tw(`status.${lead.workflow_status}`)}
                </DSBadge>
                {lead.lead_quality === "good" && (
                  <DSBadge tone="success">{t("quality.good")}</DSBadge>
                )}
                {lead.lead_quality === "bad" && (
                  <DSBadge tone="danger">{t("quality.bad")}</DSBadge>
                )}
              </div>
              {!isTerminalWorkflowStatus(lead.workflow_status) && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <QualityChip
                    label={t("quality.markGood")}
                    active={lead.lead_quality === "good"}
                    disabled={isPending}
                    loading={pendingKey === "quality-good"}
                    onClick={() =>
                      void runMutation(
                        () =>
                          setLeadQuality(
                            lead.id,
                            lead.lead_quality === "good" ? null : "good"
                          ),
                        {
                          key: "quality-good",
                          successMessage: tf("actionCompleted"),
                        }
                      )
                    }
                  />
                  <QualityChip
                    label={t("quality.markBad")}
                    active={lead.lead_quality === "bad"}
                    disabled={isPending}
                    loading={pendingKey === "quality-bad"}
                    tone="danger"
                    onClick={() =>
                      void runMutation(
                        () =>
                          setLeadQuality(
                            lead.id,
                            lead.lead_quality === "bad" ? null : "bad"
                          ),
                        {
                          key: "quality-bad",
                          successMessage: tf("actionCompleted"),
                        }
                      )
                    }
                  />
                </div>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[var(--ds-foreground-light)]">
                <span className="inline-flex items-center gap-1.5">
                  <DSIcon name="layout" />
                  {office?.name_uk ?? "—"}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <DSIcon name="user" />
                  {lead.profiles?.display_name ?? t("unassigned")}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <DSIcon name="sparkles" />
                  {sourceSystem}
                </span>
              </div>
            </div>
          </div>

          <div
            className={`rounded-lg border px-4 py-3 ${
              isOverdue
                ? "border-[var(--ds-danger-border-soft)] bg-[var(--ds-danger-soft)]"
                : nextTask
                  ? "border-[var(--ds-warning-border)] bg-[var(--ds-warning-soft)]"
                  : "border-[var(--ds-border)] bg-[var(--ds-surface-2)]"
            }`}
          >
            <div className="flex items-center gap-2">
              <DSIcon
                name="clock"
                className={
                  isOverdue
                    ? "text-[var(--ds-danger-strong)]"
                    : "text-[var(--ds-foreground-light)]"
                }
              />
              <p className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--ds-foreground-lighter)]">
                {t("header.nextTask")}
              </p>
              {isOverdue && (
                <DSBadge tone="danger" className="ml-auto">
                  {tc("overdue")}
                </DSBadge>
              )}
              {nextTaskSaving && (
                <DSBadge tone="info" className="ml-auto">
                  {tf("saving")}
                </DSBadge>
              )}
            </div>
            {nextTask ? (
              <>
                <p className="mt-2 truncate text-sm font-semibold">{nextTask.title}</p>
                <p className="mt-0.5 text-xs text-[var(--ds-foreground-light)]">
                  {formatLeadDateTime(nextTask.due_at, officeCode)}
                </p>
              </>
            ) : (
              <p className="mt-2 text-sm text-[var(--ds-foreground-light)]">
                {t("header.noNextTask")}
              </p>
            )}
          </div>
        </div>
      </DSSurface>

      <LeadCloseDialog
        leadId={lead.id}
        open={closeDialogOpen}
        onClose={() => setCloseDialogOpen(false)}
      />

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-5">
          <LeadActivityComposer
            leadId={lead.id}
            workflowStatus={lead.workflow_status}
            openVisit={openVisit}
            plannedContract={plannedContract}
          />
          <LeadTasksPanel tasks={openTasks} officeCode={officeCode} />
          <LeadTimeline items={timeline} officeCode={officeCode} />
        </div>

        <aside className="space-y-5 xl:sticky xl:top-[76px]">
          <LeadDetailsPanel lead={lead} officeCode={officeCode} />
          <LeadCommercePanel
            leadId={lead.id}
            lead={lead}
            contracts={data.contracts}
            payments={data.payments}
            officeCode={officeCode}
          />
          <LeadFilesPanel
            leadId={lead.id}
            attachments={data.attachments}
            officeCode={officeCode}
          />
        </aside>
      </div>
    </div>
  );
}

function statusTone(status: string) {
  if (status === "bad_lead") return "danger" as const;
  if (status === "warranty" || status === "installed") return "success" as const;
  if (
    status === "callback_required" ||
    status === "showroom_no_show" ||
    status === "postpayment_received"
  ) {
    return "warning" as const;
  }
  if (status === "new") return "neutral" as const;
  return "accent" as const;
}

function QualityChip({
  label,
  active,
  disabled,
  loading,
  tone = "accent",
  onClick,
}: {
  label: string;
  active: boolean;
  disabled: boolean;
  loading: boolean;
  tone?: "accent" | "danger";
  onClick: () => void;
}) {
  const activeClass =
    tone === "danger"
      ? "border-[var(--ds-danger-border-soft)] bg-[var(--ds-danger-soft)] text-[var(--ds-danger-strong)]"
      : "border-[var(--ds-accent-border)] bg-[var(--ds-accent-soft)] text-[var(--ds-accent-strong)]";

  return (
    <button
      type="button"
      disabled={disabled || loading}
      onClick={onClick}
      className={`cursor-pointer rounded-full border px-2.5 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        active
          ? activeClass
          : "border-[var(--ds-border)] bg-[var(--ds-surface-2)] text-[var(--ds-foreground-light)] hover:text-[var(--ds-foreground)]"
      }`}
    >
      {label}
    </button>
  );
}
