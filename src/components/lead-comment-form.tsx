"use client";

import { useTransition } from "react";
import { addLeadComment } from "@/actions/leads";
import type { PipelineStage } from "@/lib/types/database";
import { Button } from "./ui/button";

type Props = {
  leadId: string;
  currentStage: string;
  stages: PipelineStage[];
};

export function LeadCommentForm({ leadId, currentStage, stages }: Props) {
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="flex flex-col gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4"
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const fd = new FormData(form);
        const stage = fd.get("pipeline_stage") as string;
        const body = fd.get("body") as string;
        startTransition(async () => {
          await addLeadComment(leadId, stage, body);
          form.reset();
          const stageSelect = form.elements.namedItem(
            "pipeline_stage"
          ) as HTMLSelectElement | null;
          if (stageSelect) stageSelect.value = currentStage;
        });
      }}
    >
      <h3 className="font-medium">Додати коментар</h3>
      <select
        name="pipeline_stage"
        defaultValue={currentStage}
        className="rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm"
      >
        {stages.map((s) => (
          <option key={s.code} value={s.code}>
            {s.label_uk}
          </option>
        ))}
      </select>
      <textarea
        name="body"
        required
        rows={3}
        placeholder="Коментар по етапу…"
        className="rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm"
      />
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Збереження…" : "Додати"}
      </Button>
    </form>
  );
}
