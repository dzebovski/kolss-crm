import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getSlackWebhookUrl,
  getTelegramBotToken,
  getTelegramChatId,
} from "@/lib/office-env";

type NotificationRow = {
  id: string;
  lead_id: string;
  channel: "telegram" | "slack";
  payload: Record<string, unknown>;
  attempts: number;
};

async function sendTelegram(
  text: string,
  officeCode: string | undefined
): Promise<void> {
  const token = getTelegramBotToken(officeCode);
  const chatId = getTelegramChatId(officeCode);
  if (!token || !chatId) {
    throw new Error(
      `Missing Telegram config for office: ${officeCode ?? "unknown"}`
    );
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
  const webhook = getSlackWebhookUrl(officeCode);
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
