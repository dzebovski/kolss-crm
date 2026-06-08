import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchSheetRows } from "@/lib/google/sheets";
import type { ImportSource } from "@/lib/types/database";
import { enqueueLeadNotifications } from "@/services/notifications/enqueue";
import { headersFromRows, mapSheetRow } from "./lead-mapper";

export async function runImportForSource(
  supabase: SupabaseClient,
  source: ImportSource & { offices?: { code: string } }
) {
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

  try {
    const sheetRows = await fetchSheetRows(
      source.spreadsheet_id,
      source.sheet_name
    );
    const { headers, dataRows } = headersFromRows(
      sheetRows,
      source.header_row
    );

    for (const { row, rowNumber } of dataRows) {
      rowsProcessed++;
      const mapped = mapSheetRow(
        headers,
        row,
        rowNumber,
        source.spreadsheet_id,
        source.sheet_name
      );
      if (!mapped || mapped.isTestLead) {
        rowsSkipped++;
        continue;
      }

      const { data: existing } = await supabase
        .from("leads")
        .select("id, crm_status, office_id")
        .eq("source_system", mapped.source_system)
        .eq("external_lead_id", mapped.external_lead_id)
        .maybeSingle();

      const marketingFields = {
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

      if (existing) {
        await supabase.from("leads").update(marketingFields).eq("id", existing.id);
        rowsUpdated++;
      } else {
        const { data: created, error: insertErr } = await supabase
          .from("leads")
          .insert({
            office_id: source.office_id,
            source_system: mapped.source_system,
            external_lead_id: mapped.external_lead_id,
            crm_status: "new",
            ...marketingFields,
          })
          .select("id, name, phone, email, product_interest, office_id")
          .single();

        if (insertErr) throw insertErr;
        rowsCreated++;
        if (created) {
          await enqueueLeadNotifications(supabase, created, source.offices ?? null);
        }
      }
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

export async function runAllImports(supabase: SupabaseClient) {
  const { data: sources, error } = await supabase
    .from("lead_import_sources")
    .select("*, offices(code)")
    .eq("is_enabled", true);

  if (error) throw error;
  const results = [];
  for (const source of sources ?? []) {
    results.push(await runImportForSource(supabase, source as ImportSource & { offices?: { code: string } }));
  }
  return results;
}
