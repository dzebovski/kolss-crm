"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  archiveProject,
  completeMeasurementOnly,
  updateProjectStatus,
} from "@/actions/projects";
import { LOSS_REASON_OPTIONS } from "@/lib/crm-options";
import type { ProjectStage } from "@/lib/types/database";
import { Button } from "./ui/button";

type Props = {
  projectId: string;
  currentStatus: string;
  stages: ProjectStage[];
  isOnlyMeasurement: boolean;
  isTerminal: boolean;
};

export function ProjectStatusForm({
  projectId,
  currentStatus,
  stages,
  isOnlyMeasurement,
  isTerminal,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [showArchive, setShowArchive] = useState(false);
  const [lossReason, setLossReason] = useState("");
  const [estimatedBudget, setEstimatedBudget] = useState("");
  const [ourQuote, setOurQuote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const currentIndex = stages.findIndex((s) => s.code === currentStatus);
  const nextStage = currentIndex >= 0 ? stages[currentIndex + 1] : null;
  const showPriceFields = lossReason === "price";

  if (isTerminal) return null;

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
    <div className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
      <h2 className="font-medium">Етап проєкту</h2>
      {error && <p className="text-sm text-red-600">{error}</p>}

      {isOnlyMeasurement && currentStatus === "measurement" && (
        <Button
          type="button"
          disabled={pending}
          onClick={() => run(() => completeMeasurementOnly(projectId))}
        >
          Завершити (тільки замір)
        </Button>
      )}

      {nextStage && !nextStage.is_terminal && (
        <Button
          type="button"
          disabled={pending}
          onClick={() =>
            run(() => updateProjectStatus(projectId, nextStage.code))
          }
        >
          Далі: {nextStage.label_uk}
        </Button>
      )}

      {nextStage?.code === "completed" && (
        <Button
          type="button"
          disabled={pending}
          onClick={() =>
            run(() => updateProjectStatus(projectId, "completed"))
          }
        >
          Успішно реалізовано
        </Button>
      )}

      <Button
        type="button"
        variant="secondary"
        disabled={pending}
        onClick={() => setShowArchive((v) => !v)}
      >
        Архівувати / відмова
      </Button>

      {showArchive && (
        <form
          className="space-y-3 border-t border-[var(--border)] pt-3"
          onSubmit={(e) => {
            e.preventDefault();
            run(() =>
              archiveProject(projectId, lossReason, estimatedBudget, ourQuote)
            );
          }}
        >
          <select
            required
            value={lossReason}
            onChange={(e) => setLossReason(e.target.value)}
            className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm"
          >
            <option value="">Причина відмови…</option>
            {LOSS_REASON_OPTIONS.map((o) => (
              <option key={o.code} value={o.code}>
                {o.labelUk}
              </option>
            ))}
          </select>
          {showPriceFields && (
            <>
              <input
                required
                placeholder="Бюджет клієнта"
                value={estimatedBudget}
                onChange={(e) => setEstimatedBudget(e.target.value)}
                className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm"
              />
              <input
                required
                placeholder="Наш прорахунок"
                value={ourQuote}
                onChange={(e) => setOurQuote(e.target.value)}
                className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm"
              />
            </>
          )}
          <Button type="submit" disabled={pending || !lossReason}>
            Архівувати
          </Button>
        </form>
      )}
    </div>
  );
}
