import { getLeadComments } from "@/lib/db/leads";
import { getLeadStatuses } from "@/lib/queries/reference-data";
import type { LeadComment } from "@/lib/types/database";
import { formatLeadDateTime } from "@/lib/datetime";

type Props = {
  leadId: string;
  officeCode?: string;
};

export async function LeadDetailComments({ leadId, officeCode }: Props) {
  const [{ data: comments }, statuses] = await Promise.all([
    getLeadComments(leadId),
    getLeadStatuses(),
  ]);

  const commentsByStatus = new Map<string, LeadComment[]>();
  for (const c of (comments as LeadComment[]) ?? []) {
    const list = commentsByStatus.get(c.lead_status) ?? [];
    list.push(c);
    commentsByStatus.set(c.lead_status, list);
  }

  return (
    <div className="space-y-4">
      <h2 className="font-medium">Коментарі</h2>
      {statuses.map((status) => {
        const items = commentsByStatus.get(status.code);
        if (!items?.length) return null;
        return (
          <div
            key={status.code}
            className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4"
          >
            <h3 className="mb-2 text-sm font-medium text-[var(--accent)]">
              {status.label_uk}
            </h3>
            <ul className="space-y-2 text-sm">
              {items.map((c) => (
                <li
                  key={c.id}
                  className="border-t border-[var(--border)] pt-2 first:border-0 first:pt-0"
                >
                  <p>{c.body}</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    {c.profiles?.display_name ?? "Користувач"} ·{" "}
                    {formatLeadDateTime(c.created_at, officeCode)}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
      {![...commentsByStatus.values()].some((a) => a.length) && (
        <p className="text-sm text-[var(--muted)]">Коментарів ще немає.</p>
      )}
    </div>
  );
}
