"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";
import { createManualLead } from "@/actions/leads";
import type { Office } from "@/lib/types/database";
import { Button } from "./ui/button";

type Props = { offices: Office[] };

export function CreateLeadForm({ offices }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setError(null);
    startTransition(async () => {
      try {
        const id = await createManualLead({
          office_id: fd.get("office_id") as string,
          name: fd.get("name") as string,
          phone: fd.get("phone") as string,
          email: (fd.get("email") as string) || undefined,
          product_interest: (fd.get("product_interest") as string) || undefined,
          project_stage_source:
            (fd.get("project_stage_source") as string) || undefined,
        });
        router.push(`/app/leads/${id}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Помилка створення");
      }
    });
  }

  const fieldClass =
    "w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm";

  return (
    <form onSubmit={onSubmit} className="max-w-lg space-y-4">
      <div>
        <label className="mb-1 block text-sm text-[var(--muted)]">Офіс</label>
        <select name="office_id" required className={fieldClass}>
          {offices.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name_uk}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm text-[var(--muted)]">Імʼя</label>
        <input name="name" required className={fieldClass} />
      </div>
      <div>
        <label className="mb-1 block text-sm text-[var(--muted)]">Телефон</label>
        <input name="phone" required className={fieldClass} />
      </div>
      <div>
        <label className="mb-1 block text-sm text-[var(--muted)]">Email</label>
        <input name="email" type="email" className={fieldClass} />
      </div>
      <div>
        <label className="mb-1 block text-sm text-[var(--muted)]">
          Що замовляє
        </label>
        <input name="product_interest" className={fieldClass} />
      </div>
      <div>
        <label className="mb-1 block text-sm text-[var(--muted)]">
          Етап проєкту (з джерела)
        </label>
        <input name="project_stage_source" className={fieldClass} />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Створення…" : "Створити лід"}
      </Button>
    </form>
  );
}
