/** Workflow status codes for lead-centric CRM */
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
