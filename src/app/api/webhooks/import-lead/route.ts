import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyImportWebhookSecret } from "@/lib/webhook-auth";
import { processWebhookImport } from "@/services/import/run-import";
import { processPendingNotifications } from "@/services/notifications/process";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  source_id: z.string().uuid(),
  rows: z.array(z.record(z.string(), z.unknown())).min(1).max(100),
});

export async function POST(request: NextRequest) {
  if (!verifyImportWebhookSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { source_id, rows } = parsed.data;

  try {
    const supabase = createAdminClient();
    const { data: source, error: sourceErr } = await supabase
      .from("lead_import_sources")
      .select("*, offices(code)")
      .eq("id", source_id)
      .maybeSingle();

    if (sourceErr) throw sourceErr;
    if (!source) {
      return NextResponse.json({ error: "Import source not found" }, { status: 404 });
    }
    if (!source.is_enabled) {
      return NextResponse.json({ error: "Import source is disabled" }, { status: 403 });
    }

    const result = await processWebhookImport(supabase, source, rows);
    const notifications = await processPendingNotifications(supabase);
    return NextResponse.json({ ok: true, ...result, notifications });
  } catch (e) {
    console.error("[webhooks/import-lead]", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
