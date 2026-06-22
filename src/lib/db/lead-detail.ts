import { createClient } from "@/lib/supabase/server";
import {
  getLeadAttachments,
  getLeadById,
  getLeadComments,
  getLeadEvents,
} from "@/lib/db/leads";
import {
  getLeadContactAttempts,
  getLeadContracts,
  getLeadPayments,
  getLeadShowroomVisits,
  getLeadTasks,
} from "@/lib/db/workflow";
import type {
  Lead,
  LeadAttachment,
  LeadComment,
  LeadContactAttempt,
  LeadContract,
  LeadEvent,
  LeadPayment,
  LeadShowroomVisit,
  SignedLeadAttachment,
  Task,
} from "@/lib/types/database";
import { getLeadAttachmentSignedUrls } from "@/services/storage/lead-attachments";

export type GetLeadPageDataOptions = {
  /** When false, skips attachment queries and signed URL generation (mutation snapshots). */
  includeAttachments?: boolean;
};

export type LeadPageData = {
  lead: Lead & {
    offices: { name_uk: string; code: string } | { name_uk: string; code: string }[];
    profiles?: { display_name: string | null };
  };
  calls: LeadContactAttempt[];
  tasks: Task[];
  comments: LeadComment[];
  visits: LeadShowroomVisit[];
  contracts: LeadContract[];
  payments: LeadPayment[];
  attachments: SignedLeadAttachment[];
  events: LeadEvent[];
};

export async function getLeadPageData(
  leadId: string,
  options: GetLeadPageDataOptions = {}
): Promise<LeadPageData | null> {
  const includeAttachments = options.includeAttachments !== false;

  const [
    { data: lead, error },
    { data: calls },
    { data: tasks },
    { data: comments },
    { data: visits },
    { data: contracts },
    { data: payments },
    attachmentResult,
    { data: events },
  ] = await Promise.all([
    getLeadById(leadId),
    getLeadContactAttempts(leadId),
    getLeadTasks(leadId),
    getLeadComments(leadId),
    getLeadShowroomVisits(leadId),
    getLeadContracts(leadId),
    getLeadPayments(leadId),
    includeAttachments ? getLeadAttachments(leadId) : Promise.resolve({ data: [] }),
    getLeadEvents(leadId),
  ]);

  if (error || !lead) return null;

  let attachments: SignedLeadAttachment[] = [];
  if (includeAttachments) {
    const { data: attachmentRows } = attachmentResult;
    const supabase = await createClient();
    attachments = await getLeadAttachmentSignedUrls(
      supabase,
      ((attachmentRows as unknown as LeadAttachment[]) ?? [])
    );
  }

  return {
    lead: lead as LeadPageData["lead"],
    calls: (calls as unknown as LeadContactAttempt[]) ?? [],
    tasks: (tasks as unknown as Task[]) ?? [],
    comments: (comments as unknown as LeadComment[]) ?? [],
    visits: (visits as unknown as LeadShowroomVisit[]) ?? [],
    contracts: (contracts as unknown as LeadContract[]) ?? [],
    payments: (payments as unknown as LeadPayment[]) ?? [],
    attachments,
    events: (events as unknown as LeadEvent[]) ?? [],
  };
}
