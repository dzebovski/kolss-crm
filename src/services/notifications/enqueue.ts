import type { SupabaseClient } from "@supabase/supabase-js";
import type { Lead } from "@/lib/types/database";

function slackConfigured(officeCode: string | undefined): boolean {
  const prefix =
    officeCode === "kyiv" ? "KYIV" : officeCode === "warsaw" ? "WARSAW" : null;
  const webhook =
    (prefix && process.env[`SLACK_WEBHOOK_URL_${prefix}`]) ||
    process.env.SLACK_WEBHOOK_URL_KYIV;
  return !!webhook;
}

export async function enqueueLeadNotifications(
  supabase: SupabaseClient,
  lead: Pick<Lead, "id" | "name" | "phone" | "email" | "product_interest" | "office_id">,
  offices?: { code: string } | null
) {
  const officeCode = offices?.code;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const payload = {
    lead_id: lead.id,
    name: lead.name,
    phone: lead.phone,
    email: lead.email,
    product_interest: lead.product_interest,
    office_code: officeCode,
    crm_url: siteUrl ? `${siteUrl}/app/leads/${lead.id}` : null,
  };

  const channels: ("telegram" | "slack")[] = ["telegram"];
  if (slackConfigured(officeCode)) channels.push("slack");
  for (const channel of channels) {
    await supabase.from("lead_notifications").upsert(
      {
        lead_id: lead.id,
        channel,
        status: "pending",
        payload,
        attempts: 0,
        last_error: null,
      },
      { onConflict: "lead_id,channel", ignoreDuplicates: true }
    );
  }
}
