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
  public: {
    Tables: {
      allergies: {
        Row: {
          id: string
          patient_id: string
          name: string
          reaction: string | null
          severity: string | null
          created_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          name: string
          reaction?: string | null
          severity?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          patient_id?: string
          name?: string
          reaction?: string | null
          severity?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "allergies_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          }
        ]
      }
      appointments: {
        Row: {
          created_at: string
          duration_min: number
          id: string
          notes: string | null
          patient_id: string
          provider_id: string | null
          reason: string | null
          scheduled_at: string
          status: string
          visit_type: string
        }
        Insert: {
          created_at?: string
          duration_min?: number
          id?: string
          notes?: string | null
          patient_id: string
          provider_id?: string | null
          reason?: string | null
          scheduled_at: string
          status?: string
          visit_type?: string
        }
        Update: {
          created_at?: string
          duration_min?: number
          id?: string
          notes?: string | null
          patient_id?: string
          provider_id?: string | null
          reason?: string | null
          scheduled_at?: string
          status?: string
          visit_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          entity: string
          entity_id: string | null
          id: string
          metadata: Json
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity: string
          entity_id?: string | null
          id?: string
          metadata?: Json
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity?: string
          entity_id?: string | null
          id?: string
          metadata?: Json
          user_id?: string | null
        }
        Relationships: []
      }
      claims: {
        Row: {
          amount: number
          claim_number: string
          id: string
          notes: string | null
          patient_id: string
          payer: string
          status: string
          submitted_at: string
        }
        Insert: {
          amount?: number
          claim_number?: string
          id?: string
          notes?: string | null
          patient_id: string
          payer: string
          status?: string
          submitted_at?: string
        }
        Update: {
          amount?: number
          claim_number?: string
          id?: string
          notes?: string | null
          patient_id?: string
          payer?: string
          status?: string
          submitted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "claims_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          id: string
          patient_id: string
          name: string
          modality: string | null
          date: string | null
          size: string | null
          storage_path: string | null
          uploaded_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          name: string
          modality?: string | null
          date?: string | null
          size?: string | null
          storage_path?: string | null
          uploaded_at?: string
        }
        Update: {
          id?: string
          patient_id?: string
          name?: string
          modality?: string | null
          date?: string | null
          size?: string | null
          storage_path?: string | null
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          }
        ]
      }
      patients: {
        Row: {
          address: string | null
          ai_summary: Json | null
          blood_group: string | null
          conditions: string[]
          created_at: string
          created_by: string | null
          dob: string | null
          email: string | null
          emergency_contact: Json | null
          flags: string[]
          id: string
          insurance: Json | null
          last_visit: string | null
          mrn: string
          name: string
          phone: string | null
          primary_care_provider_id: string | null
          risk_score: number | null
          sex: string | null
          updated_at: string
          urgency: string
        }
        Insert: {
          address?: string | null
          ai_summary?: Json | null
          blood_group?: string | null
          conditions?: string[]
          created_at?: string
          created_by?: string | null
          dob?: string | null
          email?: string | null
          emergency_contact?: Json | null
          flags?: string[]
          id?: string
          insurance?: Json | null
          last_visit?: string | null
          mrn: string
          name: string
          phone?: string | null
          primary_care_provider_id?: string | null
          risk_score?: number | null
          sex?: string | null
          updated_at?: string
          urgency?: string
        }
        Update: {
          address?: string | null
          ai_summary?: Json | null
          blood_group?: string | null
          conditions?: string[]
          created_at?: string
          created_by?: string | null
          dob?: string | null
          email?: string | null
          emergency_contact?: Json | null
          flags?: string[]
          id?: string
          insurance?: Json | null
          last_visit?: string | null
          mrn?: string
          name?: string
          phone?: string | null
          primary_care_provider_id?: string | null
          risk_score?: number | null
          sex?: string | null
          updated_at?: string
          urgency?: string
        }
        Relationships: [
          {
            foreignKeyName: "patients_primary_care_provider_id_fkey"
            columns: ["primary_care_provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          }
        ]
      }
      prescriptions: {
        Row: {
          created_at: string
          drug: string
          id: string
          patient_id: string
          pharmacy: string | null
          provider_id: string | null
          quantity: string | null
          refills: number
          rx_number: string
          sig: string
          status: string
        }
        Insert: {
          created_at?: string
          drug: string
          id?: string
          patient_id: string
          pharmacy?: string | null
          provider_id?: string | null
          quantity?: string | null
          refills?: number
          rx_number?: string
          sig: string
          status?: string
        }
        Update: {
          created_at?: string
          drug?: string
          id?: string
          patient_id?: string
          pharmacy?: string | null
          provider_id?: string | null
          quantity?: string | null
          refills?: number
          rx_number?: string
          sig?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "prescriptions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      providers: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string
          npi: string | null
          specialty: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          name: string
          npi?: string | null
          specialty?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          npi?: string | null
          specialty?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      soap_notes: {
        Row: {
          id: string
          patient_id: string
          author: string
          s: string | null
          o: string | null
          a: string | null
          p: string | null
          date: string | null
          created_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          author: string
          s?: string | null
          o?: string | null
          a?: string | null
          p?: string | null
          date?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          patient_id?: string
          author?: string
          s?: string | null
          o?: string | null
          a?: string | null
          p?: string | null
          date?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "soap_notes_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          }
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vitals: {
        Row: {
          id: string
          patient_id: string
          label: string
          value: string
          unit: string
          trend: string | null
          series: Json | null
          measured_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          label: string
          value: string
          unit: string
          trend?: string | null
          series?: Json | null
          measured_at?: string
        }
        Update: {
          id?: string
          patient_id?: string
          label?: string
          value?: string
          unit?: string
          trend?: string | null
          series?: Json | null
          measured_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vitals_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "doctor" | "nurse" | "receptionist"
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
      app_role: ["admin", "doctor", "nurse", "receptionist"],
    },
  },
} as const
