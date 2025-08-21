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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      calendar_entries: {
        Row: {
          created_at: string
          date: string
          entry_type: string
          id: string
          is_maintenance_related: boolean
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          entry_type?: string
          id?: string
          is_maintenance_related?: boolean
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          entry_type?: string
          id?: string
          is_maintenance_related?: boolean
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      component_catalog: {
        Row: {
          created_at: string
          icon_id: string | null
          id: string
          is_active: boolean
          name: string
          owner_scope: string
          owner_user_id: string | null
          sort_order: number
          vehicle_type: Database["public"]["Enums"]["vehicle_type"]
        }
        Insert: {
          created_at?: string
          icon_id?: string | null
          id?: string
          is_active?: boolean
          name: string
          owner_scope: string
          owner_user_id?: string | null
          sort_order?: number
          vehicle_type: Database["public"]["Enums"]["vehicle_type"]
        }
        Update: {
          created_at?: string
          icon_id?: string | null
          id?: string
          is_active?: boolean
          name?: string
          owner_scope?: string
          owner_user_id?: string | null
          sort_order?: number
          vehicle_type?: Database["public"]["Enums"]["vehicle_type"]
        }
        Relationships: []
      }
      maintenance_defaults_global: {
        Row: {
          created_at: string
          default_interval_km: number | null
          default_interval_time_months: number | null
          id: string
          maintenance_type_id: string
        }
        Insert: {
          created_at?: string
          default_interval_km?: number | null
          default_interval_time_months?: number | null
          id?: string
          maintenance_type_id: string
        }
        Update: {
          created_at?: string
          default_interval_km?: number | null
          default_interval_time_months?: number | null
          id?: string
          maintenance_type_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_defaults_global_maintenance_type_id_fkey"
            columns: ["maintenance_type_id"]
            isOneToOne: true
            referencedRelation: "maintenance_type_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_defaults_user_vehicle: {
        Row: {
          created_at: string
          default_interval_km: number | null
          default_interval_time_months: number | null
          id: string
          maintenance_type_id: string
          user_id: string
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          default_interval_km?: number | null
          default_interval_time_months?: number | null
          id?: string
          maintenance_type_id: string
          user_id: string
          vehicle_id: string
        }
        Update: {
          created_at?: string
          default_interval_km?: number | null
          default_interval_time_months?: number | null
          id?: string
          maintenance_type_id?: string
          user_id?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_defaults_user_vehicle_maintenance_type_id_fkey"
            columns: ["maintenance_type_id"]
            isOneToOne: false
            referencedRelation: "maintenance_type_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_defaults_user_vehicle_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_events: {
        Row: {
          created_at: string
          custom_name: string | null
          details: Json | null
          id: string
          interval_km: number | null
          interval_time_months: number | null
          km_at_service: number
          maintenance_type_id: string | null
          note: string | null
          performed_at: string
          vehicle_component_id: string
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          custom_name?: string | null
          details?: Json | null
          id?: string
          interval_km?: number | null
          interval_time_months?: number | null
          km_at_service: number
          maintenance_type_id?: string | null
          note?: string | null
          performed_at: string
          vehicle_component_id: string
          vehicle_id: string
        }
        Update: {
          created_at?: string
          custom_name?: string | null
          details?: Json | null
          id?: string
          interval_km?: number | null
          interval_time_months?: number | null
          km_at_service?: number
          maintenance_type_id?: string | null
          note?: string | null
          performed_at?: string
          vehicle_component_id?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_events_maintenance_type_id_fkey"
            columns: ["maintenance_type_id"]
            isOneToOne: false
            referencedRelation: "maintenance_type_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_events_vehicle_component_id_fkey"
            columns: ["vehicle_component_id"]
            isOneToOne: false
            referencedRelation: "vehicle_components"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_events_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_type_catalog: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_standard: boolean
          name: string
          owner_scope: string
          owner_user_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_standard?: boolean
          name: string
          owner_scope: string
          owner_user_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_standard?: boolean
          name?: string
          owner_scope?: string
          owner_user_id?: string | null
        }
        Relationships: []
      }
      maintenance_type_components: {
        Row: {
          component_catalog_id: string
          created_at: string
          id: string
          maintenance_type_id: string
        }
        Insert: {
          component_catalog_id: string
          created_at?: string
          id?: string
          maintenance_type_id: string
        }
        Update: {
          component_catalog_id?: string
          created_at?: string
          id?: string
          maintenance_type_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_type_components_component_catalog_id_fkey"
            columns: ["component_catalog_id"]
            isOneToOne: false
            referencedRelation: "component_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_type_components_maintenance_type_id_fkey"
            columns: ["maintenance_type_id"]
            isOneToOne: false
            referencedRelation: "maintenance_type_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
        }
        Relationships: []
      }
      vehicle_components: {
        Row: {
          alias: string | null
          component_catalog_id: string
          created_at: string
          id: string
          vehicle_id: string
        }
        Insert: {
          alias?: string | null
          component_catalog_id: string
          created_at?: string
          id?: string
          vehicle_id: string
        }
        Update: {
          alias?: string | null
          component_catalog_id?: string
          created_at?: string
          id?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_components_component_catalog_id_fkey"
            columns: ["component_catalog_id"]
            isOneToOne: false
            referencedRelation: "component_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_components_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          brand: string
          created_at: string
          current_km: number
          first_registration: string | null
          id: string
          model: string
          type: Database["public"]["Enums"]["vehicle_type"]
          user_id: string
          vin: string | null
          year: number | null
        }
        Insert: {
          brand: string
          created_at?: string
          current_km?: number
          first_registration?: string | null
          id?: string
          model: string
          type?: Database["public"]["Enums"]["vehicle_type"]
          user_id: string
          vin?: string | null
          year?: number | null
        }
        Update: {
          brand?: string
          created_at?: string
          current_km?: number
          first_registration?: string | null
          id?: string
          model?: string
          type?: Database["public"]["Enums"]["vehicle_type"]
          user_id?: string
          vin?: string | null
          year?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      vehicle_type: "motorcycle" | "car"
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
  public: {
    Enums: {
      vehicle_type: ["motorcycle", "car"],
    },
  },
} as const
