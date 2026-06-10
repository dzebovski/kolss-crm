import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProjectCommentForm } from "@/components/project-comment-form";
import { ProjectForm } from "@/components/project-form";
import { ProjectStatusForm } from "@/components/project-status-form";
import { labelForCrmCode, PRODUCT_TYPE_OPTIONS } from "@/lib/crm-options";
import type {
  Project,
  ProjectAttachment,
  ProjectComment,
  ProjectStage,
} from "@/lib/types/database";
import { formatLeadDateTime } from "@/lib/datetime";
import { formatPhoneDisplay } from "@/lib/phone";
import { getProjectAttachmentSignedUrls } from "@/services/storage/project-attachments";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [
    { data: project, error },
    { data: stages },
    { data: comments },
    { data: attachments },
  ] = await Promise.all([
    supabase
      .from("projects")
      .select("*, leads!lead_id(*), offices(code, name_uk)")
      .eq("id", id)
      .single(),
    supabase.from("project_stages").select("*").order("sort_order"),
    supabase
      .from("project_comments")
      .select("*, profiles(display_name)")
      .eq("project_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("project_attachments")
      .select("*")
      .eq("project_id", id)
      .order("created_at", { ascending: false }),
  ]);

  if (error || !project) notFound();

  const p = project as Project & {
    leads: {
      name: string | null;
      phone: string | null;
      email: string | null;
    };
    offices: { code: string; name_uk: string } | { code: string; name_uk: string }[];
  };

  const office = Array.isArray(p.offices) ? p.offices[0] : p.offices;
  const officeCode = office?.code;
  const stageList = (stages as ProjectStage[]) ?? [];
  const currentStage = stageList.find((s) => s.code === p.status);
  const isTerminal = currentStage?.is_terminal ?? false;

  const attachmentRows = (attachments as ProjectAttachment[]) ?? [];
  const signedAttachments = attachmentRows.length
    ? await getProjectAttachmentSignedUrls(supabase, attachmentRows)
    : [];

  const contractFiles = signedAttachments.filter(
    (a) => a.document_type === "contract"
  );
  const actFiles = signedAttachments.filter((a) => a.document_type === "act");
  const otherFiles = signedAttachments.filter(
    (a) => a.document_type === "other"
  );

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/app/projects"
          className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
        >
          ← Назад до проєктів
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">
          {p.leads?.name ?? "Проєкт"}
        </h1>
        <p className="text-sm text-[var(--muted)]">
          {office?.name_uk} · {currentStage?.label_uk ?? p.status}
        </p>
      </div>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 text-sm lg:col-span-1">
          <h2 className="font-medium">Клієнт</h2>
          <p>
            <span className="text-[var(--muted)]">Телефон:</span>{" "}
            {formatPhoneDisplay(p.leads?.phone, officeCode)}
          </p>
          <p>
            <span className="text-[var(--muted)]">Email:</span>{" "}
            {p.leads?.email ?? "—"}
          </p>
          <p>
            <span className="text-[var(--muted)]">Тип:</span>{" "}
            {labelForCrmCode(PRODUCT_TYPE_OPTIONS, p.product_type, officeCode)}
          </p>
          <Link
            href={`/app/leads/${p.lead_id}`}
            className="inline-block text-[var(--accent)] hover:underline"
          >
            Картка ліда
          </Link>
        </div>

        <div className="lg:col-span-2">
          <ProjectStatusForm
            projectId={p.id}
            currentStatus={p.status}
            stages={stageList}
            isOnlyMeasurement={p.is_only_measurement}
            isTerminal={isTerminal}
          />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
          <h2 className="mb-4 font-medium">Дані проєкту</h2>
          <ProjectForm
            project={p}
            officeCode={officeCode}
            readOnly={isTerminal}
          />
        </div>

        <div className="space-y-4">
          <ProjectCommentForm projectId={p.id} />
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
            <h3 className="mb-3 font-medium">Коментарі</h3>
            <ul className="space-y-2 text-sm">
              {(comments as ProjectComment[])?.map((c) => (
                <li
                  key={c.id}
                  className="border-t border-[var(--border)] pt-2 first:border-0 first:pt-0"
                >
                  <p>{c.body}</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    {c.profiles?.display_name ?? "—"} ·{" "}
                    {formatLeadDateTime(c.created_at, officeCode)}
                  </p>
                </li>
              ))}
              {!comments?.length && (
                <p className="text-[var(--muted)]">Коментарів немає.</p>
              )}
            </ul>
          </div>
        </div>
      </section>

      {(contractFiles.length > 0 ||
        actFiles.length > 0 ||
        otherFiles.length > 0) && (
        <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 text-sm">
          <h2 className="mb-3 font-medium">Документи</h2>
          {contractFiles.length > 0 && (
            <div className="mb-3">
              <p className="text-[var(--muted)]">Договори</p>
              <ul>
                {contractFiles.map((f) => (
                  <li key={f.url}>
                    <a
                      href={f.url}
                      className="text-[var(--accent)] hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {f.file_name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {actFiles.length > 0 && (
            <div className="mb-3">
              <p className="text-[var(--muted)]">Акти</p>
              <ul>
                {actFiles.map((f) => (
                  <li key={f.url}>
                    <a
                      href={f.url}
                      className="text-[var(--accent)] hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {f.file_name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
