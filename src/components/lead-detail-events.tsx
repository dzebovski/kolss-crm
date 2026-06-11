import { getLeadEvents } from "@/lib/db/leads";
import { getLeadStatusMap } from "@/lib/queries/reference-data";
import type { LeadEvent } from "@/lib/types/database";
import { formatLeadDateTime } from "@/lib/datetime";

type Props = {
  leadId: string;
  officeCode?: string;
};

export async function LeadDetailEvents({ leadId, officeCode }: Props) {
  const [{ data: events }, statusMap] = await Promise.all([
    getLeadEvents(leadId),
    getLeadStatusMap(),
  ]);

  return (
    <section>
      <h2 className="mb-3 font-medium">Історія змін</h2>
      <ul className="space-y-2 text-sm">
        {(events as LeadEvent[])?.map((ev) => (
          <li
            key={ev.id}
            className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-2"
          >
            <span className="font-medium">{ev.event_type}</span>
            {ev.event_type === "status_change" && ev.new_value && (
              <span>
                {" "}
                →{" "}
                {String(
                  (ev.new_value as { lead_status?: string }).lead_status ??
                    (ev.new_value as { crm_status?: string }).crm_status
                )}
                {statusMap.get(
                  String(
                    (ev.new_value as { lead_status?: string }).lead_status ??
                      (ev.new_value as { crm_status?: string }).crm_status
                  )
                )
                  ? ` (${statusMap.get(String((ev.new_value as { lead_status?: string }).lead_status))})`
                  : ""}
              </span>
            )}
            <span className="ml-2 text-[var(--muted)]">
              {ev.profiles?.display_name ?? "Система"} ·{" "}
              {formatLeadDateTime(ev.created_at, officeCode)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
