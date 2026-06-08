import { normalizePhoneForOffice } from "@/lib/phone";

const META_COLUMNS = {
  id: "id",
  created_time: "created_time",
  phone_number: "phone_number",
  full_name: "full_name",
  email: "email",
  product_interest: "що_ви_хочете_замовити?",
  project_stage_source: "на_якому_етапі_ваш_проєкт?",
  ad_id: "ad_id",
  ad_name: "ad_name",
  campaign_id: "campaign_id",
  campaign_name: "campaign_name",
  form_id: "form_id",
  form_name: "form_name",
  platform: "platform",
  is_organic: "is_organic",
} as const;

export type MappedLeadRow = {
  source_system: string;
  external_lead_id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  product_interest: string | null;
  project_stage_source: string | null;
  source_created_at: string | null;
  ad_id: string | null;
  ad_name: string | null;
  campaign_id: string | null;
  campaign_name: string | null;
  form_id: string | null;
  form_name: string | null;
  platform: string | null;
  is_organic: string | null;
  raw_payload: Record<string, unknown>;
  isTestLead: boolean;
};

function parseCreatedTime(value: string | undefined): string | null {
  if (!value?.trim()) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function isTestLead(email: string | null, raw: Record<string, unknown>): boolean {
  if (process.env.IMPORT_INCLUDE_TEST_LEADS === "true") return false;
  if (email?.toLowerCase() === "test@meta.com") return true;
  const serialized = JSON.stringify(raw).toLowerCase();
  return serialized.includes("<test lead:");
}

function rowToRecord(headers: string[], row: string[]): Record<string, string> {
  const record: Record<string, string> = {};
  headers.forEach((h, i) => {
    if (h) record[h.trim()] = row[i] ?? "";
  });
  return record;
}

function normalizeRecord(
  record: Record<string, unknown>
): Record<string, string> {
  const normalized: Record<string, string> = {};
  for (const [key, value] of Object.entries(record)) {
    if (!key.trim()) continue;
    if (value === null || value === undefined) {
      normalized[key.trim()] = "";
    } else {
      normalized[key.trim()] = String(value).trim();
    }
  }
  return normalized;
}

function get(
  record: Record<string, string>,
  key: string
): string | undefined {
  const v = record[key];
  return v?.trim() ? v.trim() : undefined;
}

function mapRecordToLead(
  record: Record<string, string>,
  options: {
    rowNumber: number;
    spreadsheetId: string;
    sheetName: string;
    officeCode: string;
  }
): MappedLeadRow {
  const raw_payload = { ...record } as Record<string, unknown>;

  let externalId = get(record, META_COLUMNS.id);
  const source_system = "meta_lead_ads";

  if (!externalId) {
    externalId = `google_sheet:${options.spreadsheetId}:${options.sheetName}:${options.rowNumber}`;
  } else if (!externalId.startsWith("l:")) {
    externalId = `l:${externalId}`;
  }

  const email = get(record, META_COLUMNS.email) ?? null;

  const mapped: MappedLeadRow = {
    source_system,
    external_lead_id: externalId,
    name: get(record, META_COLUMNS.full_name) ?? null,
    phone: normalizePhoneForOffice(
      get(record, META_COLUMNS.phone_number),
      options.officeCode
    ),
    email,
    product_interest: get(record, META_COLUMNS.product_interest) ?? null,
    project_stage_source: get(record, META_COLUMNS.project_stage_source) ?? null,
    source_created_at: parseCreatedTime(get(record, META_COLUMNS.created_time)),
    ad_id: get(record, META_COLUMNS.ad_id) ?? null,
    ad_name: get(record, META_COLUMNS.ad_name) ?? null,
    campaign_id: get(record, META_COLUMNS.campaign_id) ?? null,
    campaign_name: get(record, META_COLUMNS.campaign_name) ?? null,
    form_id: get(record, META_COLUMNS.form_id) ?? null,
    form_name: get(record, META_COLUMNS.form_name) ?? null,
    platform: get(record, META_COLUMNS.platform) ?? null,
    is_organic: get(record, META_COLUMNS.is_organic) ?? null,
    raw_payload,
    isTestLead: false,
  };

  mapped.isTestLead = isTestLead(email, raw_payload);
  return mapped;
}

export function mapLeadRecord(
  record: Record<string, unknown>,
  options: {
    rowNumber?: number;
    spreadsheetId: string;
    sheetName: string;
    officeCode: string;
  }
): MappedLeadRow {
  return mapRecordToLead(normalizeRecord(record), {
    rowNumber: options.rowNumber ?? 0,
    spreadsheetId: options.spreadsheetId,
    sheetName: options.sheetName,
    officeCode: options.officeCode,
  });
}

export function mapSheetRow(
  headers: string[],
  row: string[],
  rowNumber: number,
  spreadsheetId: string,
  sheetName: string,
  officeCode: string
): MappedLeadRow | null {
  const record = rowToRecord(headers, row);
  return mapRecordToLead(record, {
    rowNumber,
    spreadsheetId,
    sheetName,
    officeCode,
  });
}

export function headersFromRows(rows: string[][], headerRow: number): {
  headers: string[];
  dataRows: { row: string[]; rowNumber: number }[];
} {
  if (rows.length < headerRow) {
    return { headers: [], dataRows: [] };
  }
  const headers = rows[headerRow - 1] ?? [];
  const dataRows: { row: string[]; rowNumber: number }[] = [];
  for (let i = headerRow; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.every((c) => !c?.trim())) continue;
    dataRows.push({ row, rowNumber: i + 1 });
  }
  return { headers, dataRows };
}
