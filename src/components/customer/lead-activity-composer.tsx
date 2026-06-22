"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { saveLeadActivity, takeLeadInWork } from "@/actions/workflow";
import { LeadCommerceActions } from "@/components/customer/lead-commerce-actions";
import { LeadShowroomActions } from "@/components/customer/lead-showroom-actions";
import {
  DSButton,
  DSField,
  DSInput,
  DSTextarea,
  DSSurface,
  DSIcon,
  type IconName,
} from "@/components/ui/design-system";
import { useLeadCard } from "@/components/customer/lead-card-state";
import { isTerminalWorkflowStatus, type LeadActivityType } from "@/lib/workflow";
import type { LeadPageData } from "@/lib/db/lead-detail";
import type { LeadComment, LeadContract, LeadShowroomVisit } from "@/lib/types/database";

const CALL_ACTIVITY_TYPES = ["reached", "no_answer", "cannot_talk"] as const;

const ACTIVITY_TYPE_ICONS: Record<LeadActivityType, IconName> = {
  note: "mail",
  reached: "check",
  no_answer: "phone",
  cannot_talk: "clock",
  showroom: "calendar",
};

export function LeadActivityComposer({
  leadId,
  workflowStatus,
  openVisit,
  plannedContract,
}: {
  leadId: string;
  workflowStatus: string;
  openVisit?: LeadShowroomVisit | null;
  plannedContract?: LeadContract | null;
}) {
  const t = useTranslations("workflow");
  const tc = useTranslations("common");
  const tp = useTranslations("customerCard.activityComposer");
  const tf = useTranslations("feedback");
  const { data, isPending, pendingKey, runMutation } = useLeadCard();
  const [comment, setComment] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [activityType, setActivityType] = useState<LeadActivityType>("note");
  const [error, setError] = useState<string | null>(null);

  const terminal = isTerminalWorkflowStatus(workflowStatus);
  const missingWorkflowRecord =
    (workflowStatus === "showroom_scheduled" && !openVisit) ||
    (workflowStatus === "contract_planned" && !plannedContract);

  const showCallChips =
    !terminal &&
    workflowStatus !== "new" &&
    workflowStatus !== "showroom_scheduled";

  const showShowroomChip =
    !terminal &&
    workflowStatus !== "new" &&
    workflowStatus !== "showroom_scheduled";

  function clearFields() {
    setComment("");
    setScheduledAt("");
    setActivityType("note");
  }

  async function run(
    key: string,
    action: () => Promise<LeadPageData | null>,
    successMessage = tf("actionCompleted")
  ) {
    setError(null);
    try {
      await runMutation(action, { key, successMessage });
      clearFields();
    } catch (value) {
      setError(value instanceof Error ? value.message : tc("error"));
    }
  }

  function saveActivity() {
    if (activityType === "showroom" && !scheduledAt.trim()) {
      setError(tp("showroomDateRequired"));
      return;
    }

    const body = comment.trim();
    const dueAt =
      activityType === "note" && scheduledAt.trim()
        ? new Date(scheduledAt).toISOString()
        : activityType === "showroom"
          ? new Date(scheduledAt).toISOString()
          : null;

    const capturedType = activityType;
    clearFields();
    setError(null);

    void runMutation(() => saveLeadActivity(leadId, body, capturedType, dueAt), {
      key: "save-activity",
      successMessage: tf("noteAdded"),
      optimistic:
        capturedType === "note" && !dueAt
          ? (current) => appendOptimisticNote(current, body, data.lead.lead_status)
          : undefined,
    }).catch((value) => {
      setError(value instanceof Error ? value.message : tc("error"));
    });
  }

  if (workflowStatus === "new") {
    return (
      <DSSurface className="overflow-hidden">
        <div className="space-y-4 p-4 sm:p-5">
          <div>
            <h2 className="text-sm font-semibold">{t("actions.takeInWork")}</h2>
            <p className="mt-1 text-sm text-[var(--ds-foreground-light)]">
              {tp("takeInWorkHint")}
            </p>
            <DSButton
              className="mt-4"
              variant="primary"
              disabled={isPending}
              loading={pendingKey === "take-in-work"}
              loadingLabel={tf("takingInWork")}
              onClick={() =>
                void run(
                  "take-in-work",
                  () => takeLeadInWork(leadId),
                  tf("leadTakenInWork")
                )
              }
            >
              {t("actions.takeInWork")}
            </DSButton>
          </div>
        </div>
      </DSSurface>
    );
  }

  return (
    <div className="space-y-3">
      {!terminal && (
        <DSSurface className="overflow-hidden">
          <div className="space-y-4 p-4 sm:p-5">
            {error && (
              <p className="rounded-md border border-[var(--ds-danger-border-soft)] bg-[var(--ds-danger-soft)] px-3 py-2 text-sm text-[var(--ds-danger-strong)]">
                {error}
              </p>
            )}

            <DSField label={tp("recordLabel")} required>
              <DSTextarea
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                rows={4}
                placeholder={tp("recordPlaceholder")}
              />
            </DSField>

            <DSField
              label={tp("optionalDate")}
              hint={
                activityType === "showroom"
                  ? tp("showroomDateHint")
                  : tp("optionalDateHint")
              }
            >
              <DSInput
                type="datetime-local"
                value={scheduledAt}
                onChange={(event) => setScheduledAt(event.target.value)}
              />
            </DSField>

            <div className="space-y-2">
              <p className="text-xs font-medium text-[var(--ds-foreground-lighter)]">
                {tp("activityType")}
              </p>
              <div className="flex flex-wrap gap-2">
                <ActivityChip
                  active={activityType === "note"}
                  icon={ACTIVITY_TYPE_ICONS.note}
                  onClick={() => setActivityType("note")}
                >
                  {tp("types.note")}
                </ActivityChip>
                {showCallChips &&
                  CALL_ACTIVITY_TYPES.map((type) => (
                    <ActivityChip
                      key={type}
                      active={activityType === type}
                      icon={ACTIVITY_TYPE_ICONS[type]}
                      onClick={() => setActivityType(type)}
                    >
                      {tp(`types.${type}`)}
                    </ActivityChip>
                  ))}
                {showShowroomChip && (
                  <ActivityChip
                    active={activityType === "showroom"}
                    icon={ACTIVITY_TYPE_ICONS.showroom}
                    onClick={() => setActivityType("showroom")}
                  >
                    {tp("types.showroom")}
                  </ActivityChip>
                )}
              </div>
            </div>

            <div className="border-t border-[var(--ds-border)] pt-4">
              <DSButton
                variant="primary"
                disabled={isPending || !comment.trim()}
                loading={pendingKey === "save-activity"}
                loadingLabel={tf("saving")}
                onClick={saveActivity}
              >
                {tp("save")}
              </DSButton>
            </div>
          </div>
        </DSSurface>
      )}

      {terminal && (
        <DSSurface className="overflow-hidden">
          <p className="p-4 text-sm text-[var(--ds-foreground-light)] sm:p-5">
            {tp("terminal")}
          </p>
        </DSSurface>
      )}

      {missingWorkflowRecord && (
        <p className="rounded-md border border-[var(--ds-warning-border)] bg-[var(--ds-warning-soft)] px-3 py-2 text-sm text-[var(--ds-warning-strong)]">
          {tp("unavailable")}
        </p>
      )}

      <LeadShowroomActions workflowStatus={workflowStatus} openVisit={openVisit} />
      <LeadCommerceActions
        leadId={leadId}
        workflowStatus={workflowStatus}
        plannedContract={plannedContract}
      />
    </div>
  );
}

function appendOptimisticNote(
  current: LeadPageData,
  body: string,
  leadStatus: string
): LeadPageData {
  const now = new Date().toISOString();
  const optimisticComment: LeadComment = {
    id: `optimistic-note:${now}`,
    lead_id: current.lead.id,
    author_id: "",
    lead_status: leadStatus,
    body,
    created_at: now,
    profiles: { display_name: null },
  };

  return {
    ...current,
    comments: [optimisticComment, ...current.comments],
    events: [
      {
        id: `optimistic-event:${now}`,
        lead_id: current.lead.id,
        actor_id: null,
        event_type: "note_added",
        comment: body,
        old_value: null,
        new_value: null,
        created_at: now,
        profiles: { display_name: null },
      },
      ...current.events,
    ],
  };
}

function ActivityChip({
  active,
  icon,
  onClick,
  children,
}: {
  active: boolean;
  icon: IconName;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "border-[var(--ds-accent-border)] bg-[var(--ds-accent-soft)] text-[var(--ds-accent-strong)]"
          : "border-[var(--ds-border)] bg-[var(--ds-surface-2)] text-[var(--ds-foreground-light)] hover:border-[var(--ds-border-strong)] hover:text-[var(--ds-foreground)]"
      }`}
    >
      <DSIcon name={icon} className="size-3.5 shrink-0" />
      {children}
    </button>
  );
}
