export type UserRole =
  | "super_admin"
  | "curator"
  | "office_admin"
  | "office_member";

export type Profile = {
  id: string;
  role: UserRole;
  display_name: string | null;
  is_active: boolean;
  deactivated_at: string | null;
  created_at: string;
  updated_at: string;
};

export type UserOfficeMembership = {
  user_id: string;
  office_id: string;
  offices?: Office;
};

export type AdminUserRow = {
  id: string;
  email: string;
  profile: Profile;
  offices: Office[];
};

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
  crm_status_changed_at: string | null;
  assigned_to: string | null;
  name: string | null;
  phone: string | null;
  email: string | null;
  product_interest: string | null;
  order_comment: string | null;
  city_region: string | null;
  project_stage_source: string | null;
  stage_comment: string | null;
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

export type LeadAttachment = {
  id: string;
  lead_id: string;
  uploaded_by: string;
  file_name: string;
  storage_path: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
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
