"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { addLeadComment } from "@/actions/leads";
import { Button } from "./ui/button";

type Props = {
  leadId: string;
  currentStatus: string;
};

export function LeadCommentForm({ leadId, currentStatus }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="flex flex-col gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4"
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const body = (new FormData(form).get("body") as string) ?? "";
        startTransition(async () => {
          await addLeadComment(leadId, currentStatus, body);
          form.reset();
          router.refresh();
        });
      }}
    >
      <h3 className="font-medium">Додати коментар</h3>
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
