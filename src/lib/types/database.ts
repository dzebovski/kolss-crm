export type UserRole = "super_admin" | "office_admin" | "office_member";

export type Office = {
  id: string;
  code: string;
  name_uk: string;
  name_pl: string;
  is_active: boolean;
};

export type PipelineStage = {
  code: string;
  label_uk: string;
  label_pl: string;
  sort_order: number;
  is_terminal: boolean;
};

export type Lead = {
  id: string;
  office_id: string;
  source_system: string;
  external_lead_id: string;
  crm_status: string;
  assigned_to: string | null;
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
  created_at: string;
  updated_at: string;
  offices?: Office;
};

export type LeadComment = {
  id: string;
  lead_id: string;
  author_id: string;
  pipeline_stage: string;
  body: string;
  created_at: string;
  profiles?: { display_name: string | null };
};

export type LeadEvent = {
  id: string;
  lead_id: string;
  actor_id: string | null;
  event_type: string;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  created_at: string;
  profiles?: { display_name: string | null };
};

export type ImportSource = {
  id: string;
  office_id: string;
  name: string;
  spreadsheet_id: string;
  sheet_name: string;
  header_row: number;
  is_enabled: boolean;
};
