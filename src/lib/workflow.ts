/** Workflow status codes for lead-centric CRM */
import type { DSBadgeTone } from "@/components/ui/design-system";

export const WORKFLOW_STATUSES = [
  "new",
  "in_work",
  "callback_required",
  "contacted",
  "showroom_scheduled",
  "showroom_visited",
  "showroom_no_show",
  "contract_planned",
  "contract_signed",
  "prepayment_received",
  "in_production",
  "postpayment_received",
  "installed",
  "warranty",
  "bad_lead",
] as const;

export type WorkflowStatus = (typeof WORKFLOW_STATUSES)[number];

/** Grouped status filters for the leads list page */
export const LEAD_LIST_FILTER_GROUPS = [
  {
    key: "new",
    statuses: ["new"],
  },
  {
    key: "in_work",
    statuses: ["in_work", "callback_required", "contacted", "contract_planned"],
  },
  {
    key: "showroom",
    statuses: ["showroom_scheduled", "showroom_visited", "showroom_no_show"],
  },
  {
    key: "deal",
    statuses: [
      "contract_signed",
      "prepayment_received",
      "in_production",
      "postpayment_received",
      "installed",
      "warranty",
    ],
  },
  {
    key: "bad_lead",
    statuses: ["bad_lead"],
  },
] as const;

export type LeadListFilterGroupKey = (typeof LEAD_LIST_FILTER_GROUPS)[number]["key"];

export function resolveLeadListStatusFilter(status?: string): string[] | undefined {
  if (!status) return undefined;

  const group = LEAD_LIST_FILTER_GROUPS.find((g) => g.key === status);
  if (group) return [...group.statuses];

  if ((WORKFLOW_STATUSES as readonly string[]).includes(status)) {
    const containingGroup = LEAD_LIST_FILTER_GROUPS.find((g) =>
      (g.statuses as readonly string[]).includes(status)
    );
    if (containingGroup) return [...containingGroup.statuses];
  }

  return undefined;
}

export function isLeadListFilterGroupActive(
  groupKey: LeadListFilterGroupKey,
  statusFilter?: string
): boolean {
  if (!statusFilter) return false;
  if (statusFilter === groupKey) return true;
  const group = LEAD_LIST_FILTER_GROUPS.find((g) => g.key === groupKey);
  return group ? (group.statuses as readonly string[]).includes(statusFilter) : false;
}

export function workflowGroupTone(key: LeadListFilterGroupKey): DSBadgeTone {
  switch (key) {
    case "new":
      return "info";
    case "in_work":
      return "success";
    case "showroom":
      return "purple";
    case "deal":
      return "accent";
    case "bad_lead":
      return "danger";
  }
}

export function workflowStatusTone(status: string): DSBadgeTone {
  const group = LEAD_LIST_FILTER_GROUPS.find((g) =>
    (g.statuses as readonly string[]).includes(status)
  );
  return group ? workflowGroupTone(group.key) : "neutral";
}

export const LEAD_QUALITIES = ["good", "bad"] as const;
export type LeadQuality = (typeof LEAD_QUALITIES)[number];

export const LEAD_ACTIVITY_TYPES = [
  "note",
  "reached",
  "no_answer",
  "cannot_talk",
  "showroom",
] as const;
export type LeadActivityType = (typeof LEAD_ACTIVITY_TYPES)[number];

export const CONTACT_RESULTS = [
  "reached",
  "no_answer",
  "cannot_talk",
  "bad_lead",
] as const;

export type ContactResult = (typeof CONTACT_RESULTS)[number];

export const TASK_TYPES = [
  "callback",
  "showroom_no_show_followup",
  "showroom_visit",
  "contract_followup",
  "prepayment_followup",
  "manual",
] as const;

export type TaskType = (typeof TASK_TYPES)[number];

export const PAYMENT_CURRENCIES = ["PLN", "EUR", "USD", "GBP", "UAH"] as const;
export type PaymentCurrency = (typeof PAYMENT_CURRENCIES)[number];

export const SOURCE_CHANNELS = ["facebook", "instagram", "website", "other"] as const;
export type SourceChannel = (typeof SOURCE_CHANNELS)[number];

export function isTerminalWorkflowStatus(status: string): boolean {
  return status === "warranty" || status === "bad_lead";
}
