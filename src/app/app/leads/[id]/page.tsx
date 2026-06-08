import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LeadCommentForm } from "@/components/lead-comment-form";
import { LeadStatusForm } from "@/components/lead-status-form";
import type {
  Lead,
  LeadComment,
  LeadEvent,
  PipelineStage,
} from "@/lib/types/database";

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [
    { data: lead, error },
    { data: stages },
    { data: comments },
    { data: events },
  ] = await Promise.all([
    supabase
      .from("leads")
      .select("*, offices(code, name_uk)")
      .eq("id", id)
      .single(),
    supabase.from("pipeline_stages").select("*").order("sort_order"),
    supabase
      .from("lead_comments")
      .select("*, profiles(display_name)")
      .eq("lead_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("lead_events")
      .select("*, profiles(display_name)")
      .eq("lead_id", id)
      .order("created_at", { ascending: false }),
  ]);

  if (error || !lead) notFound();

  const l = lead as Lead & { offices: { name_uk: string; code: string } };
  const stageList = (stages as PipelineStage[]) ?? [];
  const stageMap = new Map(stageList.map((s) => [s.code, s.label_uk]));

  const commentsByStage = new Map<string, LeadComment[]>();
  for (const c of (comments as LeadComment[]) ?? []) {
    const list = commentsByStage.get(c.pipeline_stage) ?? [];
    list.push(c);
    commentsByStage.set(c.pipeline_stage, list);
  }

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/app/leads"
          className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
        >
          ← Назад до списку
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">{l.name ?? "Лід"}</h1>
        <p className="text-sm text-[var(--muted)]">
          {l.offices?.name_uk} · {l.source_system} · {l.external_lead_id}
        </p>
      </div>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 text-sm">
          <h2 className="font-medium">Контакти</h2>
          <p>
            <span className="text-[var(--muted)]">Телефон:</span> {l.phone ?? "—"}
          </p>
          <p>
            <span className="text-[var(--muted)]">Email:</span> {l.email ?? "—"}
          </p>
          <p>
            <span className="text-[var(--muted)]">Запит:</span>{" "}
            {l.product_interest ?? "—"}
          </p>
          <p>
            <span className="text-[var(--muted)]">Етап з Meta:</span>{" "}
            {l.project_stage_source ?? "—"}
          </p>
          <p>
            <span className="text-[var(--muted)]">Платформа:</span>{" "}
            {l.platform ?? "—"}
          </p>
          <p>
            <span className="text-[var(--muted)]">Кампанія:</span>{" "}
            {l.campaign_name ?? "—"}
          </p>
        </div>

        <div className="space-y-4">
          <LeadStatusForm
            leadId={l.id}
            currentStatus={l.crm_status}
            stages={stageList}
          />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <LeadCommentForm
          leadId={l.id}
          currentStage={l.crm_status}
          stages={stageList}
        />

        <div className="space-y-4">
          <h2 className="font-medium">Коментарі по етапах</h2>
          {stageList.map((stage) => {
            const items = commentsByStage.get(stage.code);
            if (!items?.length) return null;
            return (
              <div
                key={stage.code}
                className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4"
              >
                <h3 className="mb-2 text-sm font-medium text-[var(--accent)]">
                  {stage.label_uk}
                </h3>
                <ul className="space-y-2 text-sm">
                  {items.map((c) => (
                    <li key={c.id} className="border-t border-[var(--border)] pt-2 first:border-0 first:pt-0">
                      <p>{c.body}</p>
                      <p className="mt-1 text-xs text-[var(--muted)]">
                        {c.profiles?.display_name ?? "Користувач"} ·{" "}
                        {new Date(c.created_at).toLocaleString("uk-UA")}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
          {![...commentsByStage.values()].some((a) => a.length) && (
            <p className="text-sm text-[var(--muted)]">Коментарів ще немає.</p>
          )}
        </div>
      </section>

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
                  → {String((ev.new_value as { crm_status?: string }).crm_status)}
                  {stageMap.get(
                    String((ev.new_value as { crm_status?: string }).crm_status)
                  )
                    ? ` (${stageMap.get(String((ev.new_value as { crm_status?: string }).crm_status))})`
                    : ""}
                </span>
              )}
              <span className="ml-2 text-[var(--muted)]">
                {ev.profiles?.display_name ?? "Система"} ·{" "}
                {new Date(ev.created_at).toLocaleString("uk-UA")}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
