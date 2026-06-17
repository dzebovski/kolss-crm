"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import {
  cancelTask,
  completeTask,
  createManualTask,
  markInstalled,
  markShowroomNoShow,
  markShowroomVisited,
  planContract,
  recordContactAttempt,
  recordPayment,
  rescheduleShowroomVisit,
  scheduleShowroomVisit,
  signContract,
  startWarranty,
  takeLeadInWork,
} from "@/actions/workflow";
import {
  CONTACT_RESULTS,
  PAYMENT_CURRENCIES,
  type ContactResult,
  type PaymentCurrency,
} from "@/lib/workflow";
import { DSButton, DSField, DSInput, DSSelect, DSTextarea, DSSurface } from "@/components/ui/design-system";
import type { LeadContract, LeadShowroomVisit, Task } from "@/lib/types/database";

type Props = {
  leadId: string;
  workflowStatus: string;
  openVisit?: LeadShowroomVisit | null;
  plannedContract?: LeadContract | null;
  openTasks: Task[];
};

export function CustomerWorkflowPanel({
  leadId,
  workflowStatus,
  openVisit,
  plannedContract,
  openTasks,
}: Props) {
  const t = useTranslations("workflow");
  const tc = useTranslations("common");
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [materials, setMaterials] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<PaymentCurrency>("UAH");
  const [scheduledAt, setScheduledAt] = useState("");
  const [taskTitle, setTaskTitle] = useState("");

  function run(action: () => Promise<void>) {
    setError(null);
    start(async () => {
      try {
        await action();
        setComment("");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : tc("error"));
      }
    });
  }

  return (
    <DSSurface className="space-y-4 p-4">
      <h2 className="text-sm font-semibold">{t("actions.recordCall")}</h2>
      {error && <p className="text-sm text-red-600">{error}</p>}

      {workflowStatus === "new" && (
        <DSButton disabled={pending} onClick={() => run(() => takeLeadInWork(leadId))}>
          {t("actions.takeInWork")}
        </DSButton>
      )}

      {["in_work", "callback_required", "contacted", "showroom_no_show"].includes(workflowStatus) && (
        <div className="space-y-3">
          <DSField label={tc("comment")}>
            <DSTextarea value={comment} onChange={(e) => setComment(e.target.value)} rows={2} />
          </DSField>
          <div className="flex flex-wrap gap-2">
            {CONTACT_RESULTS.map((result) => (
              <DSButton
                key={result}
                variant={result === "bad_lead" ? "ghost" : "primary"}
                disabled={pending}
                onClick={() =>
                  run(() => recordContactAttempt(leadId, result as ContactResult, comment))
                }
              >
                {t(`callResult.${result}`)}
              </DSButton>
            ))}
          </div>
        </div>
      )}

      {["contacted", "showroom_no_show", "callback_required", "in_work"].includes(workflowStatus) && (
        <div className="space-y-2 border-t border-[var(--ds-border)] pt-3">
          <p className="text-sm font-medium">{t("actions.scheduleShowroom")}</p>
          <DSField label={tc("date")}>
            <DSInput type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
          </DSField>
          <DSButton
            disabled={pending || !scheduledAt}
            onClick={() => run(() => scheduleShowroomVisit(leadId, new Date(scheduledAt).toISOString(), comment))}
          >
            {t("actions.scheduleShowroom")}
          </DSButton>
        </div>
      )}

      {workflowStatus === "showroom_scheduled" && openVisit && (
        <div className="space-y-2 border-t border-[var(--ds-border)] pt-3">
          <DSButton
            variant="ghost"
            disabled={pending}
            onClick={() => run(() => markShowroomNoShow(openVisit.id, comment || "No-show"))}
          >
            {t("actions.markNoShow")}
          </DSButton>
          <DSField label={t("actions.markVisited")}>
            <DSInput placeholder={tc("comment")} value={materials} onChange={(e) => setMaterials(e.target.value)} />
          </DSField>
          <div className="grid grid-cols-2 gap-2">
            <DSInput placeholder={tc("amount")} value={amount} onChange={(e) => setAmount(e.target.value)} />
            <DSSelect value={currency} onChange={(e) => setCurrency(e.target.value as PaymentCurrency)}>
              {PAYMENT_CURRENCIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </DSSelect>
          </div>
          <DSButton
            disabled={pending || !materials || !amount}
            onClick={() =>
              run(() =>
                markShowroomVisited(openVisit.id, materials, amount, currency, comment || materials)
              )
            }
          >
            {t("actions.markVisited")}
          </DSButton>
          {scheduledAt && (
            <DSButton
              variant="ghost"
              disabled={pending}
              onClick={() =>
                run(() =>
                  rescheduleShowroomVisit(openVisit.id, new Date(scheduledAt).toISOString(), comment)
                )
              }
            >
              {t("actions.rescheduleShowroom")}
            </DSButton>
          )}
        </div>
      )}

      {workflowStatus === "showroom_visited" && (
        <div className="space-y-2 border-t border-[var(--ds-border)] pt-3">
          <DSField label={tc("date")}>
            <DSInput type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
          </DSField>
          <DSButton
            disabled={pending || !scheduledAt}
            onClick={() => run(() => planContract(leadId, new Date(scheduledAt).toISOString(), comment || "Planned"))}
          >
            {t("actions.planContract")}
          </DSButton>
        </div>
      )}

      {workflowStatus === "contract_planned" && plannedContract && (
        <div className="space-y-2 border-t border-[var(--ds-border)] pt-3">
          <DSField label={tc("date")}>
            <DSInput type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
          </DSField>
          <DSButton
            disabled={pending || !scheduledAt}
            onClick={() =>
              run(() =>
                signContract(plannedContract.id, new Date(scheduledAt).toISOString(), comment || "Signed")
              )
            }
          >
            {t("actions.signContract")}
          </DSButton>
        </div>
      )}

      {workflowStatus === "contract_signed" && (
        <div className="space-y-2 border-t border-[var(--ds-border)] pt-3">
          <div className="grid grid-cols-2 gap-2">
            <DSInput placeholder={tc("amount")} value={amount} onChange={(e) => setAmount(e.target.value)} />
            <DSSelect value={currency} onChange={(e) => setCurrency(e.target.value as PaymentCurrency)}>
              {PAYMENT_CURRENCIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </DSSelect>
          </div>
          <DSField label={tc("date")}>
            <DSInput type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
          </DSField>
          <DSButton
            disabled={pending || !amount || !scheduledAt}
            onClick={() =>
              run(() =>
                recordPayment(
                  leadId,
                  "prepayment",
                  amount,
                  currency,
                  new Date(scheduledAt).toISOString(),
                  comment || "Prepayment"
                )
              )
            }
          >
            {t("actions.recordPrepayment")}
          </DSButton>
        </div>
      )}

      {workflowStatus === "in_production" && (
        <div className="space-y-2 border-t border-[var(--ds-border)] pt-3">
          <DSButton
            disabled={pending}
            onClick={() =>
              run(() =>
                recordPayment(
                  leadId,
                  "postpayment",
                  amount || "1",
                  currency,
                  new Date().toISOString(),
                  comment || "Postpayment"
                )
              )
            }
          >
            {t("actions.recordPostpayment")}
          </DSButton>
          <DSButton disabled={pending} onClick={() => run(() => markInstalled(leadId, comment || "Installed"))}>
            {t("actions.markInstalled")}
          </DSButton>
        </div>
      )}

      {workflowStatus === "installed" && (
        <DSButton disabled={pending} onClick={() => run(() => startWarranty(leadId, comment || "Warranty"))}>
          {t("actions.startWarranty")}
        </DSButton>
      )}

      <div className="space-y-2 border-t border-[var(--ds-border)] pt-3">
        <p className="text-sm font-medium">{t("actions.createTask")}</p>
        <DSInput placeholder="Title" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} />
        <DSInput type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
        <DSButton
          variant="ghost"
          disabled={pending || !taskTitle || !scheduledAt}
          onClick={() =>
            run(() =>
              createManualTask(leadId, taskTitle, new Date(scheduledAt).toISOString(), comment || taskTitle)
            )
          }
        >
          {t("actions.createTask")}
        </DSButton>
      </div>

      {openTasks.length > 0 && (
        <div className="space-y-2 border-t border-[var(--ds-border)] pt-3">
          {openTasks.map((task) => (
            <div key={task.id} className="flex items-center justify-between gap-2 text-sm">
              <span>{task.title}</span>
              <div className="flex gap-1">
                <DSButton variant="ghost" disabled={pending} onClick={() => run(() => completeTask(task.id))}>
                  {t("actions.completeTask")}
                </DSButton>
                <DSButton variant="ghost" disabled={pending} onClick={() => run(() => cancelTask(task.id, comment || "Canceled"))}>
                  {t("actions.cancelTask")}
                </DSButton>
              </div>
            </div>
          ))}
        </div>
      )}
    </DSSurface>
  );
}
