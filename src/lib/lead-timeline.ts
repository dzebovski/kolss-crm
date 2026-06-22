import type { LeadPageData } from "@/lib/db/lead-detail";
import type { IconName } from "@/components/ui/design-system";

export type LeadTimelineCategory =
  | "calls"
  | "tasks"
  | "showroom"
  | "commerce"
  | "activity";

export type LeadTimelineView = "records" | "statuses" | "tasks";

export type LeadTimelineItem = {
  id: string;
  category: LeadTimelineCategory;
  view: LeadTimelineView;
  occurredAt: string;
  title: string;
  description?: string | null;
  actor?: string | null;
  icon: IconName;
  tone?: "neutral" | "accent" | "success" | "warning" | "danger" | "info";
};

type TimelineLabels = {
  callResult: (result: string) => string;
  showroomStatus: (status: string) => string;
  contractStatus: (status: string) => string;
  paymentType: (type: string) => string;
  taskStatus: (status: string) => string;
  formatDate: (value: string) => string;
  taskDue: string;
  comment: string;
  fileAdded: string;
  qualityLabel: (quality: string | null) => string;
  eventTitles: Record<string, string>;
};

const DOMAIN_EVENT_TYPES = new Set([
  "contact_attempt",
  "showroom_visit_scheduled",
  "showroom_visit_rescheduled",
  "showroom_no_show",
  "showroom_visit_completed",
  "contract_planned",
  "contract_signed",
  "production_started",
  "payment_recorded",
  "task_created",
  "task_completed",
  "task_canceled",
  "installed",
  "warranty_started",
  "files_uploaded",
  "note_added",
]);

function actor(profile?: { display_name: string | null }) {
  return profile?.display_name ?? null;
}

function humanizeEventType(value: string) {
  return value.replaceAll("_", " ").replace(/^\w/, (letter) => letter.toUpperCase());
}

function qualityFromEvent(event: {
  old_value: unknown;
  new_value: unknown;
}): string | null {
  const payload = event.new_value as { lead_quality?: string | null } | null;
  return payload?.lead_quality ?? null;
}

export function buildLeadTimeline(
  data: LeadPageData,
  labels: TimelineLabels
): LeadTimelineItem[] {
  const items: LeadTimelineItem[] = [];

  for (const call of data.calls) {
    items.push({
      id: `call:${call.id}`,
      category: "calls",
      view: "records",
      occurredAt: call.created_at,
      title: labels.callResult(call.result),
      description: call.comment,
      actor: actor(call.profiles),
      icon: "phone",
      tone:
        call.result === "reached"
          ? "success"
          : call.result === "bad_lead"
            ? "danger"
            : "warning",
    });
  }

  for (const task of data.tasks) {
    items.push({
      id: `task:${task.id}`,
      category: "tasks",
      view: "tasks",
      occurredAt: task.completed_at ?? task.created_at,
      title: `${task.title} · ${labels.taskStatus(task.status)}`,
      description: `${labels.taskDue}: ${labels.formatDate(task.due_at)}`,
      actor: actor(task.profiles),
      icon: task.status === "done" ? "check" : task.status === "canceled" ? "x" : "clock",
      tone: task.status === "done" ? "success" : task.status === "canceled" ? "danger" : "info",
    });
  }

  for (const comment of data.comments) {
    items.push({
      id: `comment:${comment.id}`,
      category: "activity",
      view: "records",
      occurredAt: comment.created_at,
      title: labels.comment,
      description: comment.body,
      actor: actor(comment.profiles),
      icon: "mail",
      tone: "neutral",
    });
  }

  for (const visit of data.visits) {
    items.push({
      id: `visit:${visit.id}`,
      category: "showroom",
      view: "statuses",
      occurredAt: visit.updated_at ?? visit.created_at,
      title: labels.showroomStatus(visit.status),
      description:
        [
          labels.formatDate(visit.scheduled_at),
          visit.comment,
          visit.materials,
          visit.quoted_price_amount != null
            ? `${visit.quoted_price_amount} ${visit.quoted_price_currency ?? ""}`.trim()
            : null,
        ]
          .filter(Boolean)
          .join(" · ") || null,
      actor: actor(visit.profiles),
      icon: "calendar",
      tone:
        visit.status === "visited"
          ? "success"
          : visit.status === "no_show"
            ? "danger"
            : "info",
    });
  }

  for (const contract of data.contracts) {
    items.push({
      id: `contract:${contract.id}`,
      category: "commerce",
      view: "statuses",
      occurredAt: contract.signed_at ?? contract.planned_at ?? contract.created_at,
      title: labels.contractStatus(contract.status),
      description:
        [
          contract.signed_at
            ? labels.formatDate(contract.signed_at)
            : contract.planned_at
              ? labels.formatDate(contract.planned_at)
              : null,
          contract.comment,
        ]
          .filter(Boolean)
          .join(" · ") || null,
      actor: actor(contract.profiles),
      icon: "file",
      tone: contract.status === "signed" ? "success" : "accent",
    });
  }

  for (const payment of data.payments) {
    items.push({
      id: `payment:${payment.id}`,
      category: "commerce",
      view: "statuses",
      occurredAt: payment.paid_at,
      title: labels.paymentType(payment.payment_type),
      description: `${payment.amount} ${payment.currency}${payment.comment ? ` · ${payment.comment}` : ""}`,
      actor: actor(payment.profiles),
      icon: "briefcase",
      tone: "success",
    });
  }

  for (const attachment of data.attachments) {
    items.push({
      id: `attachment:${attachment.id}`,
      category: "activity",
      view: "records",
      occurredAt: attachment.created_at,
      title: labels.fileAdded,
      description: attachment.file_name,
      actor: actor(attachment.profiles),
      icon: "file",
      tone: "neutral",
    });
  }

  for (const event of data.events) {
    if (DOMAIN_EVENT_TYPES.has(event.event_type)) continue;

    const isQuality = event.event_type === "lead_quality_changed";
    items.push({
      id: `event:${event.id}`,
      category: "activity",
      view: "statuses",
      occurredAt: event.created_at,
      title: isQuality
        ? labels.qualityLabel(qualityFromEvent(event))
        : (labels.eventTitles[event.event_type] ?? humanizeEventType(event.event_type)),
      description: event.comment,
      actor: actor(event.profiles),
      icon: isQuality ? "sparkles" : event.event_type === "lead_assigned" ? "user" : "sparkles",
      tone: isQuality
        ? qualityFromEvent(event) === "good"
          ? "success"
          : qualityFromEvent(event) === "bad"
            ? "danger"
            : "neutral"
        : event.event_type === "created"
          ? "accent"
          : "neutral",
    });
  }

  return items
    .sort(
      (left, right) =>
        new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime()
    )
    .slice(0, 50);
}
