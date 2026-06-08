import type { SupabaseClient } from "@supabase/supabase-js";

type NotificationRow = {
  id: string;
  lead_id: string;
  channel: "telegram" | "slack";
  payload: Record<string, unknown>;
  attempts: number;
};

function officeEnvPrefix(officeCode: string | undefined): "KYIV" | "WARSAW" | null {
  if (officeCode === "kyiv") return "KYIV";
  if (officeCode === "warsaw") return "WARSAW";
  return null;
}

async function sendTelegram(
  text: string,
  officeCode: string | undefined
): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const prefix = officeEnvPrefix(officeCode);
  const chatId =
    (prefix && process.env[`TELEGRAM_CHAT_ID_${prefix}`]) ||
    process.env.TELEGRAM_CHAT_ID_KYIV;
  if (!token || !chatId) {
    throw new Error("Missing TELEGRAM_BOT_TOKEN or office chat id");
  }
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
  if (!res.ok) {
    throw new Error(`Telegram error: ${res.status} ${await res.text()}`);
  }
}

async function sendSlack(
  text: string,
  officeCode: string | undefined
): Promise<void> {
  const prefix = officeEnvPrefix(officeCode);
  const webhook =
    (prefix && process.env[`SLACK_WEBHOOK_URL_${prefix}`]) ||
    process.env.SLACK_WEBHOOK_URL_KYIV;
  if (!webhook) throw new Error("Missing Slack webhook for office");
  const res = await fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) {
    throw new Error(`Slack error: ${res.status} ${await res.text()}`);
  }
}

function buildMessage(payload: Record<string, unknown>): string {
  const lines = [
    "🆕 Новий лід у KOLSS CRM",
    `Офіс: ${payload.office_code ?? "—"}`,
    `Імʼя: ${payload.name ?? "—"}`,
    `Телефон: ${payload.phone ?? "—"}`,
    `Email: ${payload.email ?? "—"}`,
    `Запит: ${payload.product_interest ?? "—"}`,
  ];
  if (payload.crm_url) lines.push(`Картка: ${payload.crm_url}`);
  return lines.join("\n");
}

export async function processPendingNotifications(supabase: SupabaseClient) {
  const { data: pending, error } = await supabase
    .from("lead_notifications")
    .select("id, lead_id, channel, payload, attempts")
    .in("status", ["pending", "failed"])
    .lt("attempts", 10)
    .order("created_at", { ascending: true })
    .limit(50);

  if (error) throw error;
  if (!pending?.length) return { processed: 0, sent: 0, failed: 0 };

  let sent = 0;
  let failed = 0;

  for (const row of pending as NotificationRow[]) {
    const payload = row.payload as Record<string, unknown>;
    const officeCode = payload.office_code as string | undefined;
    const text = buildMessage(payload);

    try {
      if (row.channel === "telegram") {
        await sendTelegram(text, officeCode);
      } else {
        await sendSlack(text, officeCode);
      }
      await supabase
        .from("lead_notifications")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
          attempts: row.attempts + 1,
          last_error: null,
        })
        .eq("id", row.id);
      sent++;
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unknown error";
      await supabase
        .from("lead_notifications")
        .update({
          status: "failed",
          attempts: row.attempts + 1,
          last_error: message,
        })
        .eq("id", row.id);
      failed++;
    }
  }

  return { processed: pending.length, sent, failed };
}
