import { NextRequest, NextResponse } from "next/server";
import { verifyCronSecret } from "@/lib/cron-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { processPendingNotifications } from "@/services/notifications/process";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();
    const result = await processPendingNotifications(supabase);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Processing failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
