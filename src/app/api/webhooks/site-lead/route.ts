import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyImportWebhookSecret } from "@/lib/webhook-auth";
import { enqueueLeadNotifications } from "@/services/notifications/enqueue";
import { processPendingNotifications } from "@/services/notifications/process";

type SiteLeadBody = {
  office_code?: string;
  name?: string;
  phone?: string;
  email?: string;
  product_interest?: string;
  order_comment?: string;
  external_id?: string;
};

export async function POST(request: NextRequest) {
  if (!verifyImportWebhookSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: SiteLeadBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const officeCode = body.office_code?.trim() || "kyiv";
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

  const externalId =
    body.external_id?.trim() || `site:${crypto.randomUUID()}`;

  const { data: existing } = await admin
    .from("leads")
    .select("id")
    .eq("source_system", "site_form")
    .eq("external_lead_id", externalId)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ ok: true, lead_id: existing.id, duplicate: true });
  }

  const { data: lead, error } = await admin
    .from("leads")
    .insert({
      office_id: office.id,
      source_system: "site_form",
      external_lead_id: externalId,
      lead_status: "new",
      name: body.name?.trim() || null,
      phone: body.phone?.trim() || null,
      email: body.email?.trim() || null,
      product_interest: body.product_interest?.trim() || null,
      order_comment: body.order_comment?.trim() || null,
      raw_payload: body,
    })
    .select("id, name, phone, email, product_interest, office_id, source_system")
    .single();

  if (error || !lead) {
    return NextResponse.json(
      { error: error?.message ?? "Insert failed" },
      { status: 500 }
    );
  }

  await enqueueLeadNotifications(admin, lead, office);
  await processPendingNotifications(admin);

  return NextResponse.json({ ok: true, lead_id: lead.id });
}
