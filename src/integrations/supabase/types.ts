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
          created_at: string
          id: string
          name: string
          patient_id: string
          reaction: string | null
          severity: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          patient_id: string
          reaction?: string | null
          severity?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          patient_id?: string
          reaction?: string | null
          severity?: string
        }
        Relationships: [
          {
            foreignKeyName: "allergies_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
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
          recurrence_end: string | null
          recurrence_rule: string | null
          reminder_sent_at: string | null
          room_id: string | null
          scheduled_at: string
          series_id: string | null
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
          recurrence_end?: string | null
          recurrence_rule?: string | null
          reminder_sent_at?: string | null
          room_id?: string | null
          scheduled_at: string
          series_id?: string | null
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
          recurrence_end?: string | null
          recurrence_rule?: string | null
          reminder_sent_at?: string | null
          room_id?: string | null
          scheduled_at?: string
          series_id?: string | null
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
      care_plans: {
        Row: {
          created_at: string
          goal: string | null
          id: string
          interventions: string | null
          owner_provider_id: string | null
          patient_id: string
          start_date: string | null
          status: string | null
          target_date: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          goal?: string | null
          id?: string
          interventions?: string | null
          owner_provider_id?: string | null
          patient_id: string
          start_date?: string | null
          status?: string | null
          target_date?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          goal?: string | null
          id?: string
          interventions?: string | null
          owner_provider_id?: string | null
          patient_id?: string
          start_date?: string | null
          status?: string | null
          target_date?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "care_plans_owner_provider_id_fkey"
            columns: ["owner_provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_plans_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
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
      conversations: {
        Row: {
          created_at: string
          id: string
          last_message_at: string
          patient_id: string
          provider_id: string | null
          subject: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string
          patient_id: string
          provider_id?: string | null
          subject?: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string
          patient_id?: string
          provider_id?: string | null
          subject?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          date: string | null
          id: string
          modality: string | null
          name: string
          patient_id: string
          size: string | null
          uploaded_at: string
        }
        Insert: {
          date?: string | null
          id?: string
          modality?: string | null
          name: string
          patient_id: string
          size?: string | null
          uploaded_at?: string
        }
        Update: {
          date?: string | null
          id?: string
          modality?: string | null
          name?: string
          patient_id?: string
          size?: string | null
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      encounter_diagnoses: {
        Row: {
          code: string | null
          created_at: string
          description: string
          encounter_id: string
          id: string
          is_primary: boolean
          notes: string | null
        }
        Insert: {
          code?: string | null
          created_at?: string
          description: string
          encounter_id: string
          id?: string
          is_primary?: boolean
          notes?: string | null
        }
        Update: {
          code?: string | null
          created_at?: string
          description?: string
          encounter_id?: string
          id?: string
          is_primary?: boolean
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "encounter_diagnoses_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
        ]
      }
      encounter_templates: {
        Row: {
          assessment_template: string | null
          chief_complaint: string | null
          created_at: string
          created_by: string | null
          exam: Json
          hpi_template: string | null
          id: string
          name: string
          plan_template: string | null
          ros: Json
          updated_at: string
          visit_type: string
        }
        Insert: {
          assessment_template?: string | null
          chief_complaint?: string | null
          created_at?: string
          created_by?: string | null
          exam?: Json
          hpi_template?: string | null
          id?: string
          name: string
          plan_template?: string | null
          ros?: Json
          updated_at?: string
          visit_type?: string
        }
        Update: {
          assessment_template?: string | null
          chief_complaint?: string | null
          created_at?: string
          created_by?: string | null
          exam?: Json
          hpi_template?: string | null
          id?: string
          name?: string
          plan_template?: string | null
          ros?: Json
          updated_at?: string
          visit_type?: string
        }
        Relationships: []
      }
      encounters: {
        Row: {
          appointment_id: string | null
          assessment: string | null
          chief_complaint: string | null
          created_at: string
          created_by: string | null
          encounter_date: string
          exam: Json
          follow_up_instructions: string | null
          hpi: string | null
          id: string
          locked: boolean
          patient_id: string
          plan: string | null
          provider_id: string | null
          ros: Json
          signed_at: string | null
          signed_by: string | null
          status: string
          updated_at: string
          visit_type: string
        }
        Insert: {
          appointment_id?: string | null
          assessment?: string | null
          chief_complaint?: string | null
          created_at?: string
          created_by?: string | null
          encounter_date?: string
          exam?: Json
          follow_up_instructions?: string | null
          hpi?: string | null
          id?: string
          locked?: boolean
          patient_id: string
          plan?: string | null
          provider_id?: string | null
          ros?: Json
          signed_at?: string | null
          signed_by?: string | null
          status?: string
          updated_at?: string
          visit_type?: string
        }
        Update: {
          appointment_id?: string | null
          assessment?: string | null
          chief_complaint?: string | null
          created_at?: string
          created_by?: string | null
          encounter_date?: string
          exam?: Json
          follow_up_instructions?: string | null
          hpi?: string | null
          id?: string
          locked?: boolean
          patient_id?: string
          plan?: string | null
          provider_id?: string | null
          ros?: Json
          signed_at?: string | null
          signed_by?: string | null
          status?: string
          updated_at?: string
          visit_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "encounters_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "encounters_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "encounters_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      family_history: {
        Row: {
          age_of_onset: number | null
          condition: string
          created_at: string
          deceased: boolean | null
          id: string
          note: string | null
          patient_id: string
          relation: string
          updated_at: string
        }
        Insert: {
          age_of_onset?: number | null
          condition: string
          created_at?: string
          deceased?: boolean | null
          id?: string
          note?: string | null
          patient_id: string
          relation: string
          updated_at?: string
        }
        Update: {
          age_of_onset?: number | null
          condition?: string
          created_at?: string
          deceased?: boolean | null
          id?: string
          note?: string | null
          patient_id?: string
          relation?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_history_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      follow_up_tasks: {
        Row: {
          assigned_provider_id: string | null
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          patient_id: string
          priority: string | null
          status: string | null
          title: string
          updated_at: string
        }
        Insert: {
          assigned_provider_id?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          patient_id: string
          priority?: string | null
          status?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          assigned_provider_id?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          patient_id?: string
          priority?: string | null
          status?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "follow_up_tasks_assigned_provider_id_fkey"
            columns: ["assigned_provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_up_tasks_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      imaging_studies: {
        Row: {
          body_part: string | null
          created_at: string
          facility: string | null
          id: string
          impression: string | null
          modality: string
          ordered_by: string | null
          patient_id: string
          report_url: string | null
          status: string | null
          study_date: string | null
          study_name: string
          updated_at: string
        }
        Insert: {
          body_part?: string | null
          created_at?: string
          facility?: string | null
          id?: string
          impression?: string | null
          modality: string
          ordered_by?: string | null
          patient_id: string
          report_url?: string | null
          status?: string | null
          study_date?: string | null
          study_name: string
          updated_at?: string
        }
        Update: {
          body_part?: string | null
          created_at?: string
          facility?: string | null
          id?: string
          impression?: string | null
          modality?: string
          ordered_by?: string | null
          patient_id?: string
          report_url?: string | null
          status?: string | null
          study_date?: string | null
          study_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "imaging_studies_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      immunizations: {
        Row: {
          administered_by: string | null
          administered_date: string | null
          created_at: string
          dose_number: number | null
          id: string
          lot_number: string | null
          next_due_date: string | null
          note: string | null
          patient_id: string
          site: string | null
          updated_at: string
          vaccine: string
        }
        Insert: {
          administered_by?: string | null
          administered_date?: string | null
          created_at?: string
          dose_number?: number | null
          id?: string
          lot_number?: string | null
          next_due_date?: string | null
          note?: string | null
          patient_id: string
          site?: string | null
          updated_at?: string
          vaccine: string
        }
        Update: {
          administered_by?: string | null
          administered_date?: string | null
          created_at?: string
          dose_number?: number | null
          id?: string
          lot_number?: string | null
          next_due_date?: string | null
          note?: string | null
          patient_id?: string
          site?: string | null
          updated_at?: string
          vaccine?: string
        }
        Relationships: [
          {
            foreignKeyName: "immunizations_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      lab_order_tests: {
        Row: {
          created_at: string
          id: string
          order_id: string
          test_code: string | null
          test_name: string
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          test_code?: string | null
          test_name: string
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          test_code?: string | null
          test_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "lab_order_tests_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "lab_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      lab_orders: {
        Row: {
          clinical_notes: string | null
          collected_at: string | null
          created_at: string
          id: string
          lab_facility: string | null
          order_number: string
          ordered_at: string
          patient_id: string
          priority: string
          provider_id: string | null
          resulted_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          clinical_notes?: string | null
          collected_at?: string | null
          created_at?: string
          id?: string
          lab_facility?: string | null
          order_number?: string
          ordered_at?: string
          patient_id: string
          priority?: string
          provider_id?: string | null
          resulted_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          clinical_notes?: string | null
          collected_at?: string | null
          created_at?: string
          id?: string
          lab_facility?: string | null
          order_number?: string
          ordered_at?: string
          patient_id?: string
          priority?: string
          provider_id?: string | null
          resulted_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      lab_results: {
        Row: {
          created_at: string
          flag: string
          id: string
          notes: string | null
          order_id: string
          patient_id: string
          reference_range: string | null
          resulted_at: string
          test_code: string | null
          test_name: string
          unit: string | null
          value: string
        }
        Insert: {
          created_at?: string
          flag?: string
          id?: string
          notes?: string | null
          order_id: string
          patient_id: string
          reference_range?: string | null
          resulted_at?: string
          test_code?: string | null
          test_name: string
          unit?: string | null
          value: string
        }
        Update: {
          created_at?: string
          flag?: string
          id?: string
          notes?: string | null
          order_id?: string
          patient_id?: string
          reference_range?: string | null
          resulted_at?: string
          test_code?: string | null
          test_name?: string
          unit?: string | null
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "lab_results_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "lab_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_history: {
        Row: {
          condition: string
          created_at: string
          id: string
          note: string | null
          patient_id: string
          status: string | null
          updated_at: string
          year_diagnosed: number | null
        }
        Insert: {
          condition: string
          created_at?: string
          id?: string
          note?: string | null
          patient_id: string
          status?: string | null
          updated_at?: string
          year_diagnosed?: number | null
        }
        Update: {
          condition?: string
          created_at?: string
          id?: string
          note?: string | null
          patient_id?: string
          status?: string | null
          updated_at?: string
          year_diagnosed?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "medical_history_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachments: Json
          body: string
          conversation_id: string
          created_at: string
          id: string
          read_at: string | null
          sender_role: string
          sender_user_id: string
        }
        Insert: {
          attachments?: Json
          body: string
          conversation_id: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_role: string
          sender_user_id: string
        }
        Update: {
          attachments?: Json
          body?: string
          conversation_id?: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_role?: string
          sender_user_id?: string
        }
        Relationships: []
      }
      patient_users: {
        Row: {
          created_at: string
          id: string
          patient_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          patient_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          patient_id?: string
          user_id?: string
        }
        Relationships: []
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
          primary_care_id: string | null
          risk_score: number
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
          primary_care_id?: string | null
          risk_score?: number
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
          primary_care_id?: string | null
          risk_score?: number
          sex?: string | null
          updated_at?: string
          urgency?: string
        }
        Relationships: [
          {
            foreignKeyName: "patients_primary_care_id_fkey"
            columns: ["primary_care_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
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
      problems: {
        Row: {
          created_at: string
          created_by: string | null
          icd10: string | null
          id: string
          name: string
          note: string | null
          onset_date: string | null
          patient_id: string
          resolved_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          icd10?: string | null
          id?: string
          name: string
          note?: string | null
          onset_date?: string | null
          patient_id: string
          resolved_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          icd10?: string | null
          id?: string
          name?: string
          note?: string | null
          onset_date?: string | null
          patient_id?: string
          resolved_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "problems_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_schedules: {
        Row: {
          created_at: string
          end_minute: number | null
          ends_at: string | null
          id: string
          kind: string
          note: string | null
          provider_id: string
          start_minute: number | null
          starts_at: string | null
          weekday: number | null
        }
        Insert: {
          created_at?: string
          end_minute?: number | null
          ends_at?: string | null
          id?: string
          kind?: string
          note?: string | null
          provider_id: string
          start_minute?: number | null
          starts_at?: string | null
          weekday?: number | null
        }
        Update: {
          created_at?: string
          end_minute?: number | null
          ends_at?: string | null
          id?: string
          kind?: string
          note?: string | null
          provider_id?: string
          start_minute?: number | null
          starts_at?: string | null
          weekday?: number | null
        }
        Relationships: []
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
      rooms: {
        Row: {
          active: boolean
          color: string | null
          created_at: string
          id: string
          location: string | null
          name: string
        }
        Insert: {
          active?: boolean
          color?: string | null
          created_at?: string
          id?: string
          location?: string | null
          name: string
        }
        Update: {
          active?: boolean
          color?: string | null
          created_at?: string
          id?: string
          location?: string | null
          name?: string
        }
        Relationships: []
      }
      soap_notes: {
        Row: {
          a: string | null
          author: string
          created_at: string
          date: string
          id: string
          o: string | null
          p: string | null
          patient_id: string
          s: string | null
        }
        Insert: {
          a?: string | null
          author: string
          created_at?: string
          date?: string
          id?: string
          o?: string | null
          p?: string | null
          patient_id: string
          s?: string | null
        }
        Update: {
          a?: string | null
          author?: string
          created_at?: string
          date?: string
          id?: string
          o?: string | null
          p?: string | null
          patient_id?: string
          s?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "soap_notes_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      social_history: {
        Row: {
          alcohol_use: string | null
          created_at: string
          diet: string | null
          exercise: string | null
          id: string
          living_situation: string | null
          marital_status: string | null
          note: string | null
          occupation: string | null
          patient_id: string
          smoking_status: string | null
          substance_use: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          alcohol_use?: string | null
          created_at?: string
          diet?: string | null
          exercise?: string | null
          id?: string
          living_situation?: string | null
          marital_status?: string | null
          note?: string | null
          occupation?: string | null
          patient_id: string
          smoking_status?: string | null
          substance_use?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          alcohol_use?: string | null
          created_at?: string
          diet?: string | null
          exercise?: string | null
          id?: string
          living_situation?: string | null
          marital_status?: string | null
          note?: string | null
          occupation?: string | null
          patient_id?: string
          smoking_status?: string | null
          substance_use?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "social_history_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: true
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      surgical_history: {
        Row: {
          created_at: string
          facility: string | null
          id: string
          note: string | null
          patient_id: string
          procedure: string
          procedure_date: string | null
          surgeon: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          facility?: string | null
          id?: string
          note?: string | null
          patient_id: string
          procedure: string
          procedure_date?: string | null
          surgeon?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          facility?: string | null
          id?: string
          note?: string | null
          patient_id?: string
          procedure?: string
          procedure_date?: string | null
          surgeon?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "surgical_history_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
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
      user_sessions_log: {
        Row: {
          created_at: string
          event: string
          id: string
          ip: string | null
          metadata: Json
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          event: string
          id?: string
          ip?: string | null
          metadata?: Json
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          event?: string
          id?: string
          ip?: string | null
          metadata?: Json
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      vitals: {
        Row: {
          created_at: string
          id: string
          label: string
          measured_at: string
          patient_id: string
          series: Json | null
          trend: string | null
          unit: string | null
          value: string
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          measured_at?: string
          patient_id: string
          series?: Json | null
          trend?: string | null
          unit?: string | null
          value: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          measured_at?: string
          patient_id?: string
          series?: Json | null
          trend?: string | null
          unit?: string | null
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "vitals_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      waitlist: {
        Row: {
          created_at: string
          duration_min: number
          id: string
          notes: string | null
          patient_id: string
          preferred_from: string | null
          preferred_to: string | null
          priority: number
          provider_id: string | null
          reason: string | null
          status: string
          updated_at: string
          visit_type: string
        }
        Insert: {
          created_at?: string
          duration_min?: number
          id?: string
          notes?: string | null
          patient_id: string
          preferred_from?: string | null
          preferred_to?: string | null
          priority?: number
          provider_id?: string | null
          reason?: string | null
          status?: string
          updated_at?: string
          visit_type?: string
        }
        Update: {
          created_at?: string
          duration_min?: number
          id?: string
          notes?: string | null
          patient_id?: string
          preferred_from?: string | null
          preferred_to?: string | null
          priority?: number
          provider_id?: string | null
          reason?: string | null
          status?: string
          updated_at?: string
          visit_type?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_patient_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role:
        | "admin"
        | "doctor"
        | "nurse"
        | "receptionist"
        | "lab_tech"
        | "patient"
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
      app_role: [
        "admin",
        "doctor",
        "nurse",
        "receptionist",
        "lab_tech",
        "patient",
      ],
    },
  },
} as const
