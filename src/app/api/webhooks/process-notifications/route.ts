import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyImportWebhookSecret } from "@/lib/webhook-auth";
import { processPendingNotifications } from "@/services/notifications/process";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!verifyImportWebhookSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();
    const result = await processPendingNotifications(supabase);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Processing failed";
    console.error("[webhooks/process-notifications]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
