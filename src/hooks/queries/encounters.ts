import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { logAudit } from "@/lib/audit";
import type { Database } from "@/integrations/supabase/types";
import { errMsg } from "./types";

export type Encounter = Database["public"]["Tables"]["encounters"]["Row"];
export type EncounterInsert = Database["public"]["Tables"]["encounters"]["Insert"];
export type EncounterUpdate = Database["public"]["Tables"]["encounters"]["Update"];
export type EncounterDiagnosis = Database["public"]["Tables"]["encounter_diagnoses"]["Row"];
export type EncounterDiagnosisInsert = Database["public"]["Tables"]["encounter_diagnoses"]["Insert"];
export type EncounterTemplate = Database["public"]["Tables"]["encounter_templates"]["Row"];

export type EncounterWithDx = Encounter & {
  diagnoses: EncounterDiagnosis[];
  provider: { id: string; name: string; specialty: string | null } | null;
};

export const ROS_SYSTEMS = [
  "Constitutional",
  "Cardiovascular",
  "Respiratory",
  "Gastrointestinal",
  "Neurological",
  "Musculoskeletal",
  "Skin",
  "Psychiatric",
  "Endocrine",
  "Genitourinary",
] as const;

export const EXAM_SYSTEMS = [
  "General",
  "HEENT",
  "Neck",
  "Cardiovascular",
  "Respiratory",
  "Abdomen",
  "Musculoskeletal",
  "Neurological",
  "Skin",
  "Psychiatric",
] as const;

export const ENCOUNTER_STATUSES = [
  "scheduled",
  "checked-in",
  "in-progress",
  "completed",
  "cancelled",
] as const;
export type EncounterStatus = (typeof ENCOUNTER_STATUSES)[number];

export const VISIT_TYPES = [
  "annual-physical",
  "follow-up",
  "sick-visit",
  "emergency",
  "telemedicine",
  "consultation",
  "procedure",
] as const;
export type EncounterVisitType = (typeof VISIT_TYPES)[number];

export const VISIT_TYPE_LABEL: Record<string, string> = {
  "annual-physical": "Annual Physical",
  "follow-up": "Follow-up",
  "sick-visit": "Sick Visit",
  emergency: "Emergency",
  telemedicine: "Telemedicine",
  consultation: "Consultation",
  procedure: "Procedure",
};

export const ENCOUNTER_STATUS_LABEL: Record<string, string> = {
  scheduled: "Scheduled",
  "checked-in": "Checked In",
  "in-progress": "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

export function usePatientEncounters(patientId: string | undefined) {
  return useQuery({
    queryKey: ["encounters", "patient", patientId],
    enabled: !!patientId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("encounters")
        .select("*, diagnoses:encounter_diagnoses(*), provider:providers(id,name,specialty)")
        .eq("patient_id", patientId!)
        .order("encounter_date", { ascending: false });
      if (error) throw error;
      return (data ?? []) as EncounterWithDx[];
    },
  });
}

export function useEncounter(encounterId: string | undefined) {
  return useQuery({
    queryKey: ["encounter", encounterId],
    enabled: !!encounterId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("encounters")
        .select("*, diagnoses:encounter_diagnoses(*), provider:providers(id,name,specialty)")
        .eq("id", encounterId!)
        .single();
      if (error) throw error;
      return data as EncounterWithDx;
    },
  });
}

export function useEncounterTemplates() {
  return useQuery({
    queryKey: ["encounter_templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("encounter_templates")
        .select("*")
        .order("name");
      if (error) throw error;
      return (data ?? []) as EncounterTemplate[];
    },
  });
}

function invalidatePatientEncounters(qc: ReturnType<typeof useQueryClient>, patientId: string | undefined) {
  qc.invalidateQueries({ queryKey: ["encounters", "patient", patientId] });
  qc.invalidateQueries({ queryKey: ["patient_emr", patientId] });
  qc.invalidateQueries({ queryKey: ["patient_details", patientId] });
}

export function useCreateEncounter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (row: EncounterInsert) => {
      const { data: userData } = await supabase.auth.getUser();
      const payload: EncounterInsert = { ...row, created_by: userData.user?.id ?? null };
      const { data, error } = await supabase.from("encounters").insert(payload).select().single();
      if (error) throw error;
      await logAudit("encounter.create", "encounter", data.id, { patient_id: data.patient_id, visit_type: data.visit_type });
      return data as Encounter;
    },
    onSuccess: (d) => {
      invalidatePatientEncounters(qc, d.patient_id);
      toast.success("Encounter created");
    },
    onError: (e) => toast.error(errMsg(e, "Could not create encounter")),
  });
}

export function useUpdateEncounter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patient_id, ...patch }: EncounterUpdate & { id: string; patient_id: string }) => {
      const { data, error } = await supabase.from("encounters").update(patch).eq("id", id).select().single();
      if (error) throw error;
      await logAudit("encounter.update", "encounter", id, { patient_id, fields: Object.keys(patch) });
      return data as Encounter;
    },
    onSuccess: (d) => {
      invalidatePatientEncounters(qc, d.patient_id);
      qc.invalidateQueries({ queryKey: ["encounter", d.id] });
    },
    onError: (e) => toast.error(errMsg(e, "Could not update encounter")),
  });
}

export function useSetEncounterStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patient_id, status }: { id: string; patient_id: string; status: EncounterStatus }) => {
      const { data, error } = await supabase
        .from("encounters")
        .update({ status })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      await logAudit("encounter.status", "encounter", id, { patient_id, status });
      return data as Encounter;
    },
    onSuccess: (d) => {
      invalidatePatientEncounters(qc, d.patient_id);
      qc.invalidateQueries({ queryKey: ["encounter", d.id] });
      toast.success("Status updated");
    },
    onError: (e) => toast.error(errMsg(e, "Could not update status")),
  });
}

export function useSignEncounter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patient_id }: { id: string; patient_id: string }) => {
      const { data: userData } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("encounters")
        .update({
          status: "completed",
          signed_at: new Date().toISOString(),
          signed_by: userData.user?.id ?? null,
          locked: true,
        })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      await logAudit("encounter.sign", "encounter", id, { patient_id });
      return data as Encounter;
    },
    onSuccess: (d) => {
      invalidatePatientEncounters(qc, d.patient_id);
      qc.invalidateQueries({ queryKey: ["encounter", d.id] });
      toast.success("Encounter signed & locked");
    },
    onError: (e) => toast.error(errMsg(e, "Could not sign encounter")),
  });
}

export function useAddDiagnosis() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ patient_id, ...row }: EncounterDiagnosisInsert & { patient_id: string }) => {
      const { data, error } = await supabase
        .from("encounter_diagnoses")
        .insert(row)
        .select()
        .single();
      if (error) throw error;
      await logAudit("encounter.diagnosis.add", "encounter_diagnosis", data.id, {
        encounter_id: row.encounter_id,
        patient_id,
      });
      return { data: data as EncounterDiagnosis, patient_id };
    },
    onSuccess: ({ patient_id, data }) => {
      invalidatePatientEncounters(qc, patient_id);
      qc.invalidateQueries({ queryKey: ["encounter", data.encounter_id] });
    },
    onError: (e) => toast.error(errMsg(e, "Could not add diagnosis")),
  });
}

export function useRemoveDiagnosis() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patient_id, encounter_id }: { id: string; patient_id: string; encounter_id: string }) => {
      const { error } = await supabase.from("encounter_diagnoses").delete().eq("id", id);
      if (error) throw error;
      await logAudit("encounter.diagnosis.remove", "encounter_diagnosis", id, { patient_id, encounter_id });
      return { patient_id, encounter_id };
    },
    onSuccess: ({ patient_id, encounter_id }) => {
      invalidatePatientEncounters(qc, patient_id);
      qc.invalidateQueries({ queryKey: ["encounter", encounter_id] });
    },
    onError: (e) => toast.error(errMsg(e, "Could not remove diagnosis")),
  });
}