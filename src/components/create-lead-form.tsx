"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";
import { createManualLead } from "@/actions/leads";
import { formatSupabaseError } from "@/lib/errors";
import { toDatetimeLocalValue } from "@/lib/datetime";
import { defaultCityForOffice } from "@/lib/offices";
import {
  formLabels,
  optionLabel,
  PRODUCT_INTEREST_OPTIONS,
  PROJECT_STAGE_OPTIONS,
} from "@/lib/lead-form-options";
import type { Office } from "@/lib/types/database";
import { Button } from "./ui/button";

type Props = {
  offices: Office[];
  canPickOffice: boolean;
  defaultOfficeId: string;
  defaultCityRegion: string;
};

export function CreateLeadForm({
  offices,
  canPickOffice,
  defaultOfficeId,
  defaultCityRegion,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [selectedOfficeId, setSelectedOfficeId] = useState(defaultOfficeId);
  const [cityRegion, setCityRegion] = useState(defaultCityRegion);

  const selectedOffice = offices.find((o) => o.id === selectedOfficeId);
  const officeCode = selectedOffice?.code;
  const labels = formLabels(officeCode);

  function onOfficeChange(officeId: string) {
    setSelectedOfficeId(officeId);
    const office = offices.find((o) => o.id === officeId);
    if (office) setCityRegion(defaultCityForOffice(office));
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setError(null);
    startTransition(async () => {
      try {
        const fd = new FormData(form);
        const dt = fd.get("lead_datetime");
        if (typeof dt === "string" && dt) {
          const parsed = new Date(dt);
          if (!Number.isNaN(parsed.getTime())) {
            fd.set("recorded_at", parsed.toISOString());
          }
        }
        const result = await createManualLead(fd);
        router.push(`/app/leads/${result.leadId}`);
      } catch (err) {
        setError(formatSupabaseError(err, "Помилка створення"));
      }
    });
  }

  const fieldClass =
    "w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-70";

  return (
    <form onSubmit={onSubmit} className="max-w-lg space-y-6" encType="multipart/form-data">
      <div>
        <label className="mb-1 block text-sm text-[var(--muted)]">Офіс</label>
        <select
          name="office_id"
          required
          value={selectedOfficeId}
          disabled={!canPickOffice}
          onChange={(e) => onOfficeChange(e.target.value)}
          className={fieldClass}
        >
          {offices.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name_uk}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm text-[var(--muted)]">
          Місто / Регіон
        </label>
        <input
          name="city_region"
          value={cityRegion}
          onChange={(e) => setCityRegion(e.target.value)}
          className={fieldClass}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm text-[var(--muted)]">
          {labels.leadDateTime}
        </label>
        <input
          type="datetime-local"
          name="lead_datetime"
          required
          defaultValue={toDatetimeLocalValue()}
          className={fieldClass}
        />
        <p className="mt-1 text-xs text-[var(--muted)]">
          {labels.leadDateTimeHint}
        </p>
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

      <fieldset className="space-y-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
        <legend className="px-1 text-sm font-medium">{labels.block1}</legend>
        <div>
          <label className="mb-1 block text-sm text-[var(--muted)]">
            {labels.product}
          </label>
          <select name="product_interest" required className={fieldClass} defaultValue="">
            <option value="" disabled>
              {labels.selectPlaceholder}
            </option>
            {PRODUCT_INTEREST_OPTIONS.map((o) => (
              <option key={o.code} value={o.code}>
                {optionLabel(o, officeCode)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm text-[var(--muted)]">
            {labels.orderComment}
          </label>
          <textarea
            name="order_comment"
            rows={2}
            className={fieldClass}
            placeholder={labels.orderComment}
          />
        </div>
      </fieldset>

      <fieldset className="space-y-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
        <legend className="px-1 text-sm font-medium">{labels.block2}</legend>
        <div>
          <label className="mb-1 block text-sm text-[var(--muted)]">
            {labels.projectStage}
          </label>
          <select
            name="project_stage_source"
            required
            className={fieldClass}
            defaultValue=""
          >
            <option value="" disabled>
              {labels.selectPlaceholder}
            </option>
            {PROJECT_STAGE_OPTIONS.map((o) => (
              <option key={o.code} value={o.code}>
                {optionLabel(o, officeCode)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm text-[var(--muted)]">
            {labels.stageComment}
          </label>
          <textarea
            name="stage_comment"
            rows={2}
            className={fieldClass}
            placeholder={labels.stageComment}
          />
        </div>
      </fieldset>

      <div>
        <label className="mb-1 block text-sm text-[var(--muted)]">
          {labels.attachments}
        </label>
        <input
          type="file"
          name="attachments"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.docx,.xlsx,application/pdf,image/jpeg,image/png"
          className="block w-full text-sm text-[var(--muted)] file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--accent)] file:px-3 file:py-2 file:text-sm file:text-white"
        />
        <p className="mt-1 text-xs text-[var(--muted)]">{labels.attachmentsHint}</p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Створення…" : "Створити лід"}
      </Button>
    </form>
  );
}
