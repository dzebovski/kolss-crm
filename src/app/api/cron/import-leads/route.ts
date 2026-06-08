import { NextRequest, NextResponse } from "next/server";
import { verifyCronSecret } from "@/lib/cron-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { runAllImports } from "@/services/import/run-import";
import { processPendingNotifications } from "@/services/notifications/process";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();
    const importResults = await runAllImports(supabase);
    const notificationResults = await processPendingNotifications(supabase);
    return NextResponse.json({
      ok: true,
      import: importResults,
      notifications: notificationResults,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Import failed";
    console.error("[cron/import-leads]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
