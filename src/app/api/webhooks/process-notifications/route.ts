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
    console.error("[webhooks/process-notifications]", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
