import type { SupabaseClient } from "@supabase/supabase-js";
import type { ImportSource } from "@/lib/types/database";
import { enqueueLeadNotifications } from "@/services/notifications/enqueue";
import { mapLeadRecord, type MappedLeadRow } from "./lead-mapper";

export type ImportSourceWithOffice = ImportSource & {
  offices?: { code: string } | null;
};

export type UpsertResult = "created" | "updated" | "skipped";

export type ImportBatchResult = {
  sourceId: string;
  rowsProcessed: number;
  rowsCreated: number;
  rowsUpdated: number;
  rowsSkipped: number;
};

function marketingFieldsFromMapped(mapped: MappedLeadRow) {
  return {
    name: mapped.name,
    phone: mapped.phone,
    email: mapped.email,
    product_interest: mapped.product_interest,
    project_stage_source: mapped.project_stage_source,
    source_created_at: mapped.source_created_at,
    ad_id: mapped.ad_id,
    ad_name: mapped.ad_name,
    campaign_id: mapped.campaign_id,
    campaign_name: mapped.campaign_name,
    form_id: mapped.form_id,
    form_name: mapped.form_name,
    platform: mapped.platform,
    is_organic: mapped.is_organic,
    raw_payload: mapped.raw_payload,
  };
}

export async function upsertMappedLead(
  supabase: SupabaseClient,
  source: ImportSourceWithOffice,
  mapped: MappedLeadRow
): Promise<UpsertResult> {
  if (mapped.isTestLead) return "skipped";

  const { data: existing } = await supabase
    .from("leads")
    .select("id")
    .eq("source_system", mapped.source_system)
    .eq("external_lead_id", mapped.external_lead_id)
    .maybeSingle();

  const marketingFields = marketingFieldsFromMapped(mapped);

  if (existing) {
    await supabase.from("leads").update(marketingFields).eq("id", existing.id);
    return "updated";
  }

  const { data: created, error: insertErr } = await supabase
    .from("leads")
    .insert({
      office_id: source.office_id,
      source_system: mapped.source_system,
      external_lead_id: mapped.external_lead_id,
      lead_status: "new",
      ...marketingFields,
    })
    .select("id, name, phone, email, product_interest, office_id, source_system")
    .single();

  if (insertErr) throw insertErr;

  if (created) {
    await enqueueLeadNotifications(supabase, created, source.offices ?? null);
  }

  return "created";
}

export async function processWebhookImport(
  supabase: SupabaseClient,
  source: ImportSourceWithOffice,
  rows: Record<string, unknown>[]
): Promise<ImportBatchResult> {
  const { data: run, error: runErr } = await supabase
    .from("lead_import_runs")
    .insert({ source_id: source.id, status: "running" })
    .select("id")
    .single();

  if (runErr || !run) throw runErr ?? new Error("Failed to create import run");

  let rowsProcessed = 0;
  let rowsCreated = 0;
  let rowsUpdated = 0;
  let rowsSkipped = 0;

  const officeCode = source.offices?.code ?? "kyiv";

  try {
    for (let i = 0; i < rows.length; i++) {
      rowsProcessed++;
      const mapped = mapLeadRecord(rows[i], {
        rowNumber: i + 1,
        spreadsheetId: source.spreadsheet_id,
        sheetName: source.sheet_name,
        officeCode,
      });

      const result = await upsertMappedLead(supabase, source, mapped);
      if (result === "created") rowsCreated++;
      else if (result === "updated") rowsUpdated++;
      else rowsSkipped++;
    }

    await supabase
      .from("lead_import_sources")
      .update({ last_imported_at: new Date().toISOString() })
      .eq("id", source.id);

    await supabase
      .from("lead_import_runs")
      .update({
        status: "success",
        rows_processed: rowsProcessed,
        rows_created: rowsCreated,
        rows_updated: rowsUpdated,
        rows_skipped: rowsSkipped,
        finished_at: new Date().toISOString(),
      })
      .eq("id", run.id);

    return {
      sourceId: source.id,
      rowsProcessed,
      rowsCreated,
      rowsUpdated,
      rowsSkipped,
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Import failed";
    await supabase
      .from("lead_import_runs")
      .update({
        status: "failed",
        rows_processed: rowsProcessed,
        rows_created: rowsCreated,
        rows_updated: rowsUpdated,
        rows_skipped: rowsSkipped,
        error_message: message,
        finished_at: new Date().toISOString(),
      })
      .eq("id", run.id);
    throw e;
  }
}
