export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      lead_attachments: {
        Row: {
          created_at: string
          file_name: string
          id: string
          lead_id: string
          mime_type: string
          size_bytes: number
          storage_path: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          file_name: string
          id?: string
          lead_id: string
          mime_type: string
          size_bytes: number
          storage_path: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          file_name?: string
          id?: string
          lead_id?: string
          mime_type?: string
          size_bytes?: number
          storage_path?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_attachments_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_comments: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          lead_id: string
          lead_status: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          lead_id: string
          lead_status: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          lead_id?: string
          lead_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_comments_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_comments_lead_status_fkey"
            columns: ["lead_status"]
            isOneToOne: false
            referencedRelation: "lead_statuses"
            referencedColumns: ["code"]
          },
        ]
      }
      lead_events: {
        Row: {
          actor_id: string | null
          created_at: string
          event_type: string
          id: string
          lead_id: string
          new_value: Json | null
          old_value: Json | null
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          lead_id: string
          new_value?: Json | null
          old_value?: Json | null
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          lead_id?: string
          new_value?: Json | null
          old_value?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_events_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_import_runs: {
        Row: {
          error_message: string | null
          finished_at: string | null
          id: string
          rows_created: number
          rows_processed: number
          rows_skipped: number
          rows_updated: number
          source_id: string
          started_at: string
          status: string
        }
        Insert: {
          error_message?: string | null
          finished_at?: string | null
          id?: string
          rows_created?: number
          rows_processed?: number
          rows_skipped?: number
          rows_updated?: number
          source_id: string
          started_at?: string
          status: string
        }
        Update: {
          error_message?: string | null
          finished_at?: string | null
          id?: string
          rows_created?: number
          rows_processed?: number
          rows_skipped?: number
          rows_updated?: number
          source_id?: string
          started_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_import_runs_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "lead_import_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_import_sources: {
        Row: {
          column_map: Json
          created_at: string
          header_row: number
          id: string
          is_enabled: boolean
          last_imported_at: string | null
          name: string
          office_id: string
          sheet_name: string
          spreadsheet_id: string
        }
        Insert: {
          column_map?: Json
          created_at?: string
          header_row?: number
          id?: string
          is_enabled?: boolean
          last_imported_at?: string | null
          name: string
          office_id: string
          sheet_name?: string
          spreadsheet_id: string
        }
        Update: {
          column_map?: Json
          created_at?: string
          header_row?: number
          id?: string
          is_enabled?: boolean
          last_imported_at?: string | null
          name?: string
          office_id?: string
          sheet_name?: string
          spreadsheet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_import_sources_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_notifications: {
        Row: {
          attempts: number
          channel: Database["public"]["Enums"]["notification_channel"]
          created_at: string
          id: string
          last_error: string | null
          lead_id: string
          payload: Json
          sent_at: string | null
          status: Database["public"]["Enums"]["notification_status"]
        }
        Insert: {
          attempts?: number
          channel: Database["public"]["Enums"]["notification_channel"]
          created_at?: string
          id?: string
          last_error?: string | null
          lead_id: string
          payload?: Json
          sent_at?: string | null
          status?: Database["public"]["Enums"]["notification_status"]
        }
        Update: {
          attempts?: number
          channel?: Database["public"]["Enums"]["notification_channel"]
          created_at?: string
          id?: string
          last_error?: string | null
          lead_id?: string
          payload?: Json
          sent_at?: string | null
          status?: Database["public"]["Enums"]["notification_status"]
        }
        Relationships: [
          {
            foreignKeyName: "lead_notifications_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_statuses: {
        Row: {
          code: string
          is_terminal: boolean
          label_pl: string
          label_uk: string
          sort_order: number
        }
        Insert: {
          code: string
          is_terminal?: boolean
          label_pl: string
          label_uk: string
          sort_order: number
        }
        Update: {
          code?: string
          is_terminal?: boolean
          label_pl?: string
          label_uk?: string
          sort_order?: number
        }
        Relationships: []
      }
      leads: {
        Row: {
          ad_id: string | null
          ad_name: string | null
          assigned_to: string | null
          callback_due_at: string | null
          campaign_id: string | null
          campaign_name: string | null
          city_region: string | null
          converted_project_id: string | null
          created_at: string
          email: string | null
          estimated_budget: number | null
          external_lead_id: string
          form_id: string | null
          form_name: string | null
          id: string
          is_organic: string | null
          lead_status: string
          lead_status_changed_at: string | null
          loss_reason: string | null
          name: string | null
          office_id: string
          order_comment: string | null
          our_quote: number | null
          phone: string | null
          platform: string | null
          product_interest: string | null
          project_stage_source: string | null
          raw_payload: Json
          source_created_at: string | null
          source_system: string
          stage_comment: string | null
          updated_at: string
        }
        Insert: {
          ad_id?: string | null
          ad_name?: string | null
          assigned_to?: string | null
          callback_due_at?: string | null
          campaign_id?: string | null
          campaign_name?: string | null
          city_region?: string | null
          converted_project_id?: string | null
          created_at?: string
          email?: string | null
          estimated_budget?: number | null
          external_lead_id: string
          form_id?: string | null
          form_name?: string | null
          id?: string
          is_organic?: string | null
          lead_status?: string
          lead_status_changed_at?: string | null
          loss_reason?: string | null
          name?: string | null
          office_id: string
          order_comment?: string | null
          our_quote?: number | null
          phone?: string | null
          platform?: string | null
          product_interest?: string | null
          project_stage_source?: string | null
          raw_payload?: Json
          source_created_at?: string | null
          source_system?: string
          stage_comment?: string | null
          updated_at?: string
        }
        Update: {
          ad_id?: string | null
          ad_name?: string | null
          assigned_to?: string | null
          callback_due_at?: string | null
          campaign_id?: string | null
          campaign_name?: string | null
          city_region?: string | null
          converted_project_id?: string | null
          created_at?: string
          email?: string | null
          estimated_budget?: number | null
          external_lead_id?: string
          form_id?: string | null
          form_name?: string | null
          id?: string
          is_organic?: string | null
          lead_status?: string
          lead_status_changed_at?: string | null
          loss_reason?: string | null
          name?: string | null
          office_id?: string
          order_comment?: string | null
          our_quote?: number | null
          phone?: string | null
          platform?: string | null
          product_interest?: string | null
          project_stage_source?: string | null
          raw_payload?: Json
          source_created_at?: string | null
          source_system?: string
          stage_comment?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_converted_project_id_fkey"
            columns: ["converted_project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_lead_status_fkey"
            columns: ["lead_status"]
            isOneToOne: false
            referencedRelation: "lead_statuses"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "leads_loss_reason_fkey"
            columns: ["loss_reason"]
            isOneToOne: false
            referencedRelation: "loss_reasons"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "leads_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["id"]
          },
        ]
      }
      loss_reasons: {
        Row: {
          code: string
          label_pl: string
          label_uk: string
        }
        Insert: {
          code: string
          label_pl: string
          label_uk: string
        }
        Update: {
          code?: string
          label_pl?: string
          label_uk?: string
        }
        Relationships: []
      }
      offices: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean
          name_pl: string
          name_uk: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          name_pl: string
          name_uk: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name_pl?: string
          name_uk?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          deactivated_at: string | null
          display_name: string | null
          id: string
          is_active: boolean
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          deactivated_at?: string | null
          display_name?: string | null
          id: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          deactivated_at?: string | null
          display_name?: string | null
          id?: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      project_attachments: {
        Row: {
          created_at: string
          document_type: Database["public"]["Enums"]["project_document_type"]
          file_name: string
          id: string
          mime_type: string
          project_id: string
          size_bytes: number
          storage_path: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          document_type?: Database["public"]["Enums"]["project_document_type"]
          file_name: string
          id?: string
          mime_type: string
          project_id: string
          size_bytes: number
          storage_path: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          document_type?: Database["public"]["Enums"]["project_document_type"]
          file_name?: string
          id?: string
          mime_type?: string
          project_id?: string
          size_bytes?: number
          storage_path?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_attachments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      project_comments: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          project_id: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          project_id: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_comments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_stages: {
        Row: {
          code: string
          is_terminal: boolean
          label_pl: string
          label_uk: string
          sort_order: number
        }
        Insert: {
          code: string
          is_terminal?: boolean
          label_pl: string
          label_uk: string
          sort_order: number
        }
        Update: {
          code?: string
          is_terminal?: boolean
          label_pl?: string
          label_uk?: string
          sort_order?: number
        }
        Relationships: []
      }
      projects: {
        Row: {
          advance_paid: number | null
          assigned_to: string | null
          created_at: string
          estimated_budget: number | null
          final_paid: number | null
          id: string
          is_only_measurement: boolean
          last_activity_at: string
          lead_id: string
          loss_reason: string | null
          office_id: string
          our_quote: number | null
          product_details: string | null
          product_type: string | null
          status: string
          status_changed_at: string
          updated_at: string
        }
        Insert: {
          advance_paid?: number | null
          assigned_to?: string | null
          created_at?: string
          estimated_budget?: number | null
          final_paid?: number | null
          id?: string
          is_only_measurement?: boolean
          last_activity_at?: string
          lead_id: string
          loss_reason?: string | null
          office_id: string
          our_quote?: number | null
          product_details?: string | null
          product_type?: string | null
          status?: string
          status_changed_at?: string
          updated_at?: string
        }
        Update: {
          advance_paid?: number | null
          assigned_to?: string | null
          created_at?: string
          estimated_budget?: number | null
          final_paid?: number | null
          id?: string
          is_only_measurement?: boolean
          last_activity_at?: string
          lead_id?: string
          loss_reason?: string | null
          office_id?: string
          our_quote?: number | null
          product_details?: string | null
          product_type?: string | null
          status?: string
          status_changed_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: true
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_loss_reason_fkey"
            columns: ["loss_reason"]
            isOneToOne: false
            referencedRelation: "loss_reasons"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "projects_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_status_fkey"
            columns: ["status"]
            isOneToOne: false
            referencedRelation: "project_stages"
            referencedColumns: ["code"]
          },
        ]
      }
      tasks: {
        Row: {
          assignee_id: string | null
          completed_at: string | null
          created_at: string
          due_at: string
          entity_id: string
          entity_type: Database["public"]["Enums"]["task_entity_type"]
          id: string
          priority: Database["public"]["Enums"]["task_priority"]
          source: Database["public"]["Enums"]["task_source"]
          status: Database["public"]["Enums"]["task_status"]
          title: string
        }
        Insert: {
          assignee_id?: string | null
          completed_at?: string | null
          created_at?: string
          due_at: string
          entity_id: string
          entity_type: Database["public"]["Enums"]["task_entity_type"]
          id?: string
          priority?: Database["public"]["Enums"]["task_priority"]
          source?: Database["public"]["Enums"]["task_source"]
          status?: Database["public"]["Enums"]["task_status"]
          title: string
        }
        Update: {
          assignee_id?: string | null
          completed_at?: string | null
          created_at?: string
          due_at?: string
          entity_id?: string
          entity_type?: Database["public"]["Enums"]["task_entity_type"]
          id?: string
          priority?: Database["public"]["Enums"]["task_priority"]
          source?: Database["public"]["Enums"]["task_source"]
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_office_memberships: {
        Row: {
          office_id: string
          user_id: string
        }
        Insert: {
          office_id: string
          user_id: string
        }
        Update: {
          office_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_office_memberships_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_office_memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_office: {
        Args: { target_office_id: string }
        Returns: boolean
      }
      convert_lead_to_project: { Args: { p_lead_id: string }; Returns: string }
      get_dashboard_overview: {
        Args: { p_office_id?: string; p_period_days?: number }
        Returns: Json
      }
      get_dashboard_stats: { Args: never; Returns: Json }
      is_super_admin: { Args: never; Returns: boolean }
      mark_lead_failed: {
        Args: {
          p_estimated_budget?: number
          p_lead_id: string
          p_loss_reason: string
          p_our_quote?: number
        }
        Returns: undefined
      }
      take_lead_in_progress: { Args: { p_lead_id: string }; Returns: undefined }
      user_office_ids: { Args: never; Returns: string[] }
    }
    Enums: {
      notification_channel: "telegram" | "slack"
      notification_status: "pending" | "sent" | "failed"
      project_document_type: "contract" | "act" | "other"
      task_entity_type: "lead" | "project"
      task_priority: "normal" | "high"
      task_source: "manual" | "auto_no_answer" | "auto_inactivity"
      task_status: "open" | "done" | "canceled"
      user_role: "super_admin" | "curator" | "office_admin" | "office_member"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      notification_channel: ["telegram", "slack"],
      notification_status: ["pending", "sent", "failed"],
      project_document_type: ["contract", "act", "other"],
      task_entity_type: ["lead", "project"],
      task_priority: ["normal", "high"],
      task_source: ["manual", "auto_no_answer", "auto_inactivity"],
      task_status: ["open", "done", "canceled"],
      user_role: ["super_admin", "curator", "office_admin", "office_member"],
    },
  },
} as const
