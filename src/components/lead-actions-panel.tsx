"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  clearCallbackDue,
  convertLeadToProject,
  markLeadFailed,
  recordNoAnswer,
  takeLeadInProgress,
} from "@/actions/leads";
import { formatLeadDateTime } from "@/lib/datetime";
import { hasActiveCallbackReminder } from "@/lib/callback-reminder";
import { LOSS_REASON_OPTIONS } from "@/lib/crm-options";
import type { LeadStatus } from "@/lib/types/database";
import { Button } from "./ui/button";

type Props = {
  leadId: string;
  leadStatus: string;
  statuses: LeadStatus[];
  convertedProjectId: string | null;
  callbackDueAt: string | null;
  officeCode?: string;
};

export function LeadActionsPanel({
  leadId,
  leadStatus,
  statuses,
  convertedProjectId,
  callbackDueAt,
  officeCode,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [showFailForm, setShowFailForm] = useState(false);
  const [lossReason, setLossReason] = useState("");
  const [estimatedBudget, setEstimatedBudget] = useState("");
  const [ourQuote, setOurQuote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const statusLabel =
    statuses.find((s) => s.code === leadStatus)?.label_uk ?? leadStatus;
  const isTerminal =
    leadStatus === "converted" || leadStatus === "failed";
  const showPriceFields = lossReason === "price";
  const hasCallback = hasActiveCallbackReminder(callbackDueAt);

  function run(action: () => Promise<void>) {
    setError(null);
    startTransition(async () => {
      try {
        await action();
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Помилка");
      }
    });
  }

  return (
    <div className="space-y-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
      <div>
        <h2 className="font-medium">Статус ліда</h2>
        <p className="mt-1 text-lg">{statusLabel}</p>
        {hasCallback && callbackDueAt && (
          <p className="mt-2 inline-flex rounded-md bg-amber-100 px-2 py-1 text-sm font-medium text-amber-900">
            Передзвонити до {formatLeadDateTime(callbackDueAt, officeCode)}
          </p>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {leadStatus === "converted" && convertedProjectId && (
        <Button
          type="button"
          onClick={() => router.push(`/app/projects/${convertedProjectId}`)}
        >
          Відкрити проєкт
        </Button>
      )}

      {!isTerminal && (
        <div className="flex flex-wrap gap-2">
          {leadStatus === "new" && (
            <Button
              type="button"
              disabled={pending}
              onClick={() => run(() => takeLeadInProgress(leadId))}
            >
              Взяти в роботу
            </Button>
          )}
          {(leadStatus === "new" || leadStatus === "in_progress") && (
            <>
              {leadStatus === "in_progress" && (
                <>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={pending}
                    onClick={() => run(() => recordNoAnswer(leadId))}
                  >
                    Не додзвонився
                  </Button>
                  {hasCallback && (
                    <Button
                      type="button"
                      disabled={pending}
                      onClick={() => run(() => clearCallbackDue(leadId))}
                    >
                      Додзвонився
                    </Button>
                  )}
                </>
              )}
              <Button
                type="button"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    setError(null);
                    try {
                      const projectId = await convertLeadToProject(leadId);
                      router.push(`/app/projects/${projectId}`);
                    } catch (e) {
                      setError(e instanceof Error ? e.message : "Помилка");
                    }
                  })
                }
              >
                Створити проєкт
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={pending}
                onClick={() => setShowFailForm((v) => !v)}
              >
                Невдалий лід
              </Button>
            </>
          )}
        </div>
      )}

      {showFailForm && !isTerminal && (
        <form
          className="space-y-3 border-t border-[var(--border)] pt-4"
          onSubmit={(e) => {
            e.preventDefault();
            run(() =>
              markLeadFailed(leadId, lossReason, estimatedBudget, ourQuote)
            );
          }}
        >
          <label className="block text-sm">
            <span className="text-[var(--muted)]">Причина відмови</span>
            <select
              required
              value={lossReason}
              onChange={(e) => setLossReason(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm"
            >
              <option value="">Оберіть…</option>
              {LOSS_REASON_OPTIONS.map((o) => (
                <option key={o.code} value={o.code}>
                  {o.labelUk}
                </option>
              ))}
            </select>
          </label>
          {showPriceFields && (
            <>
              <label className="block text-sm">
                <span className="text-[var(--muted)]">
                  Орієнтовний бюджет клієнта
                </span>
                <input
                  required
                  type="text"
                  inputMode="decimal"
                  value={estimatedBudget}
                  onChange={(e) => setEstimatedBudget(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm"
                />
              </label>
              <label className="block text-sm">
                <span className="text-[var(--muted)]">Наш прорахунок</span>
                <input
                  required
                  type="text"
                  inputMode="decimal"
                  value={ourQuote}
                  onChange={(e) => setOurQuote(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm"
                />
              </label>
            </>
          )}
          <Button type="submit" disabled={pending || !lossReason}>
            Зберегти як невдалий
          </Button>
        </form>
      )}
    </div>
  );
}
