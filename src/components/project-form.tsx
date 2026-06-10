"use client";

import { useMemo, useState, useTransition } from "react";
import { updateProject } from "@/actions/projects";
import {
  PRODUCT_TYPE_OPTIONS,
  productDetailsRequired,
} from "@/lib/crm-options";
import type { Project } from "@/lib/types/database";
import { Button } from "./ui/button";

type Props = {
  project: Project;
  officeCode?: string;
  readOnly?: boolean;
};

function formatDecimal(value: number | null | undefined): string {
  if (value == null) return "";
  return String(value);
}

export function ProjectForm({ project, officeCode, readOnly }: Props) {
  const [pending, startTransition] = useTransition();
  const [productType, setProductType] = useState(project.product_type ?? "");
  const [error, setError] = useState<string | null>(null);

  const showDetails = useMemo(
    () => productDetailsRequired(productType),
    [productType]
  );

  const labels =
    officeCode === "warsaw"
      ? {
          product: "Typ produktu",
          details: "Szczegóły produktu",
          budget: "Budżet klienta",
          quote: "Nasza wycena",
          advance: "Zaliczka",
          final: "Płatność końcowa",
          onlyMeasurement: "Tylko pomiar",
          save: "Zapisz",
        }
      : {
          product: "Тип виробу",
          details: "Деталі продукту",
          budget: "Орієнтовний бюджет",
          quote: "Наш прорахунок",
          advance: "Передплата",
          final: "Постоплата",
          onlyMeasurement: "Тільки замір",
          save: "Зберегти",
        };

  if (readOnly) {
    return (
      <p className="text-sm text-[var(--muted)]">
        Проєкт закрито — редагування недоступне.
      </p>
    );
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          try {
            await updateProject(project.id, fd);
          } catch (err) {
            setError(err instanceof Error ? err.message : "Помилка");
          }
        });
      }}
    >
      {error && <p className="text-sm text-red-600">{error}</p>}

      <label className="block text-sm">
        <span className="text-[var(--muted)]">{labels.product}</span>
        <select
          name="product_type"
          value={productType}
          onChange={(e) => setProductType(e.target.value)}
          className="mt-1 w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm"
        >
          <option value="">—</option>
          {PRODUCT_TYPE_OPTIONS.map((o) => (
            <option key={o.code} value={o.code}>
              {officeCode === "warsaw" ? o.labelPl : o.labelUk}
            </option>
          ))}
        </select>
      </label>

      {showDetails && (
        <label className="block text-sm">
          <span className="text-[var(--muted)]">{labels.details}</span>
          <textarea
            name="product_details"
            required
            rows={3}
            defaultValue={project.product_details ?? ""}
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm"
          />
        </label>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="text-[var(--muted)]">{labels.budget}</span>
          <input
            name="estimated_budget"
            type="text"
            inputMode="decimal"
            defaultValue={formatDecimal(project.estimated_budget)}
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="text-[var(--muted)]">{labels.quote}</span>
          <input
            name="our_quote"
            type="text"
            inputMode="decimal"
            defaultValue={formatDecimal(project.our_quote)}
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="text-[var(--muted)]">{labels.advance}</span>
          <input
            name="advance_paid"
            type="text"
            inputMode="decimal"
            defaultValue={formatDecimal(project.advance_paid)}
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="text-[var(--muted)]">{labels.final}</span>
          <input
            name="final_paid"
            type="text"
            inputMode="decimal"
            defaultValue={formatDecimal(project.final_paid)}
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm"
          />
        </label>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="is_only_measurement"
          defaultChecked={project.is_only_measurement}
          className="rounded border-[var(--border)]"
        />
        {labels.onlyMeasurement}
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="text-[var(--muted)]">Договір (PDF, DOCX…)</span>
          <input
            type="file"
            name="contract_files"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.docx,.xlsx"
            className="mt-1 w-full text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="text-[var(--muted)]">Акт (PDF, DOCX…)</span>
          <input
            type="file"
            name="act_files"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.docx,.xlsx"
            className="mt-1 w-full text-sm"
          />
        </label>
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Збереження…" : labels.save}
      </Button>
    </form>
  );
}
