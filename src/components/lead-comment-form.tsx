"use client";

import { useTransition } from "react";
import { addLeadComment } from "@/actions/leads";
import type { LeadStatus } from "@/lib/types/database";
import { Button } from "./ui/button";

type Props = {
  leadId: string;
  currentStatus: string;
  statuses: LeadStatus[];
};

export function LeadCommentForm({ leadId, currentStatus, statuses }: Props) {
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="flex flex-col gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4"
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const fd = new FormData(form);
        const status = fd.get("lead_status") as string;
        const body = fd.get("body") as string;
        startTransition(async () => {
          await addLeadComment(leadId, status, body);
          form.reset();
          const statusSelect = form.elements.namedItem(
            "lead_status"
          ) as HTMLSelectElement | null;
          if (statusSelect) statusSelect.value = currentStatus;
        });
      }}
    >
      <h3 className="font-medium">Додати коментар</h3>
      <select
        name="lead_status"
        defaultValue={currentStatus}
        className="rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm"
      >
        {statuses.map((s) => (
          <option key={s.code} value={s.code}>
            {s.label_uk}
          </option>
        ))}
      </select>
      <textarea
        name="body"
        required
        rows={3}
        placeholder="Коментар…"
        className="rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm"
      />
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Збереження…" : "Додати"}
      </Button>
    </form>
  );
}
