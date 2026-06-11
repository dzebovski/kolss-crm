import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyImportWebhookSecret } from "@/lib/webhook-auth";
import { enqueueLeadNotifications } from "@/services/notifications/enqueue";
import { processPendingNotifications } from "@/services/notifications/process";

const siteLeadSchema = z.object({
  office_code: z.string().trim().max(32).optional(),
  name: z.string().trim().max(200).optional(),
  phone: z.string().trim().max(50).optional(),
  email: z.string().trim().max(254).optional(),
  product_interest: z.string().trim().max(64).optional(),
  order_comment: z.string().trim().max(5000).optional(),
  external_id: z.string().trim().max(256).optional(),
});

export async function POST(request: NextRequest) {
  if (!verifyImportWebhookSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = siteLeadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const data = parsed.data;
  const officeCode = data.office_code || "kyiv";

  try {
    const admin = createAdminClient();

    const { data: office } = await admin
      .from("offices")
      .select("id, code")
      .eq("code", officeCode)
      .eq("is_active", true)
      .single();

    if (!office) {
      return NextResponse.json({ error: "Office not found" }, { status: 400 });
    }

    const externalId = data.external_id || `site:${crypto.randomUUID()}`;

    const { data: existing } = await admin
      .from("leads")
      .select("id")
      .eq("source_system", "site_form")
      .eq("external_lead_id", externalId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({
        ok: true,
        lead_id: existing.id,
        duplicate: true,
      });
    }

    const { data: lead, error } = await admin
      .from("leads")
      .insert({
        office_id: office.id,
        source_system: "site_form",
        external_lead_id: externalId,
        lead_status: "new",
        name: data.name || null,
        phone: data.phone || null,
        email: data.email || null,
        product_interest: data.product_interest || null,
        order_comment: data.order_comment || null,
        raw_payload: data,
      })
      .select("id, name, phone, email, product_interest, office_id, source_system")
      .single();

    if (error || !lead) {
      console.error("[webhooks/site-lead] insert failed", error);
      return NextResponse.json({ error: "Insert failed" }, { status: 500 });
    }

    await enqueueLeadNotifications(admin, lead, office);
    await processPendingNotifications(admin);

    return NextResponse.json({ ok: true, lead_id: lead.id });
  } catch (e) {
    console.error("[webhooks/site-lead]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
