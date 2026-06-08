"use client";

import { useTransition } from "react";
import { updateLeadStatus } from "@/actions/leads";
import type { PipelineStage } from "@/lib/types/database";
import { Button } from "./ui/button";

type Props = {
  leadId: string;
  currentStatus: string;
  stages: PipelineStage[];
};

export function LeadStatusForm({ leadId, currentStatus, stages }: Props) {
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="flex flex-wrap items-end gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const status = fd.get("crm_status") as string;
        startTransition(() => updateLeadStatus(leadId, status));
      }}
    >
      <div>
        <label className="mb-1 block text-sm text-[var(--muted)]">
          Етап CRM
        </label>
        <select
          name="crm_status"
          defaultValue={currentStatus}
          className="min-w-[200px] rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm"
        >
          {stages.map((s) => (
            <option key={s.code} value={s.code}>
              {s.label_uk}
            </option>
          ))}
        </select>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Збереження…" : "Змінити етап"}
      </Button>
    </form>
  );
}
