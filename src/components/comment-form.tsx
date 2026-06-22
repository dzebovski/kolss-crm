"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "./ui/button";

type Props = {
  title: string;
  placeholder?: string;
  onSubmit: (body: string) => Promise<unknown>;
};

export function CommentForm({ title, placeholder = "Коментар…", onSubmit }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="flex flex-col gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4"
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const body = (new FormData(form).get("body") as string) ?? "";
        setError(null);
        startTransition(async () => {
          try {
            await onSubmit(body);
            form.reset();
            router.refresh();
          } catch (err) {
            setError(err instanceof Error ? err.message : "Помилка збереження");
          }
        });
      }}
    >
      <h3 className="font-medium">{title}</h3>
      <textarea
        name="body"
        required
        rows={3}
        placeholder={placeholder}
        className="rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm"
      />
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Збереження…" : "Додати"}
      </Button>
    </form>
  );
}
