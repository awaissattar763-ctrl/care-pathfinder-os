import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { logAudit } from "@/lib/audit";
import type { Database } from "@/integrations/supabase/types";
import { errMsg } from "./types";

export type Problem = Database["public"]["Tables"]["problems"]["Row"];
export type MedicalHistory = Database["public"]["Tables"]["medical_history"]["Row"];
export type SurgicalHistory = Database["public"]["Tables"]["surgical_history"]["Row"];
export type FamilyHistory = Database["public"]["Tables"]["family_history"]["Row"];
export type SocialHistory = Database["public"]["Tables"]["social_history"]["Row"];
export type Immunization = Database["public"]["Tables"]["immunizations"]["Row"];
export type ImagingStudy = Database["public"]["Tables"]["imaging_studies"]["Row"];
export type CarePlan = Database["public"]["Tables"]["care_plans"]["Row"];
export type FollowUpTask = Database["public"]["Tables"]["follow_up_tasks"]["Row"];

export function usePatientEmr(patientId: string | undefined) {
  return useQuery({
    queryKey: ["patient_emr", patientId],
    enabled: !!patientId,
    queryFn: async () => {
      if (!patientId) throw new Error("No id");
      const [
        problems,
        medHist,
        surgHist,
        famHist,
        social,
        imms,
        imaging,
        plans,
        tasks,
      ] = await Promise.all([
        supabase.from("problems").select("*").eq("patient_id", patientId).order("onset_date", { ascending: false, nullsFirst: false }),
        supabase.from("medical_history").select("*").eq("patient_id", patientId).order("year_diagnosed", { ascending: false, nullsFirst: false }),
        supabase.from("surgical_history").select("*").eq("patient_id", patientId).order("procedure_date", { ascending: false, nullsFirst: false }),
        supabase.from("family_history").select("*").eq("patient_id", patientId).order("relation"),
        supabase.from("social_history").select("*").eq("patient_id", patientId).maybeSingle(),
        supabase.from("immunizations").select("*").eq("patient_id", patientId).order("administered_date", { ascending: false, nullsFirst: false }),
        supabase.from("imaging_studies").select("*").eq("patient_id", patientId).order("study_date", { ascending: false, nullsFirst: false }),
        supabase.from("care_plans").select("*").eq("patient_id", patientId).order("created_at", { ascending: false }),
        supabase.from("follow_up_tasks").select("*").eq("patient_id", patientId).order("due_date", { ascending: true, nullsFirst: false }),
      ]);
      const err = [problems, medHist, surgHist, famHist, social, imms, imaging, plans, tasks].find((r) => r.error)?.error;
      if (err) throw err;
      return {
        problems: (problems.data ?? []) as Problem[],
        medicalHistory: (medHist.data ?? []) as MedicalHistory[],
        surgicalHistory: (surgHist.data ?? []) as SurgicalHistory[],
        familyHistory: (famHist.data ?? []) as FamilyHistory[],
        socialHistory: (social.data ?? null) as SocialHistory | null,
        immunizations: (imms.data ?? []) as Immunization[],
        imagingStudies: (imaging.data ?? []) as ImagingStudy[],
        carePlans: (plans.data ?? []) as CarePlan[],
        followUpTasks: (tasks.data ?? []) as FollowUpTask[],
      };
    },
  });
}

type EmrTable =
  | "problems"
  | "medical_history"
  | "surgical_history"
  | "family_history"
  | "immunizations"
  | "imaging_studies"
  | "care_plans"
  | "follow_up_tasks";

export function useEmrInsert<T extends Record<string, unknown>>(table: EmrTable) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (row: T & { patient_id: string }) => {
      const { data, error } = await supabase.from(table).insert(row as never).select().single();
      if (error) throw error;
      await logAudit(`${table}.create`, table, (data as { id: string }).id, { patient_id: row.patient_id });
      return data;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["patient_emr", v.patient_id] });
      toast.success("Saved");
    },
    onError: (e) => toast.error(errMsg(e, "Could not save")),
  });
}

export function useEmrUpdate<T extends Record<string, unknown>>(table: EmrTable) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patient_id, ...patch }: T & { id: string; patient_id: string }) => {
      const { data, error } = await supabase.from(table).update(patch as never).eq("id", id).select().single();
      if (error) throw error;
      await logAudit(`${table}.update`, table, id, patch as Record<string, unknown>);
      return data;
    },
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ["patient_emr", v.patient_id] }),
    onError: (e) => toast.error(errMsg(e, "Could not update")),
  });
}

export function useEmrDelete(table: EmrTable) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patient_id }: { id: string; patient_id: string }) => {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;
      await logAudit(`${table}.delete`, table, id, {});
      return { patient_id };
    },
    onSuccess: (r) => qc.invalidateQueries({ queryKey: ["patient_emr", r.patient_id] }),
    onError: (e) => toast.error(errMsg(e, "Could not delete")),
  });
}

export function useUpsertSocialHistory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (row: Partial<SocialHistory> & { patient_id: string }) => {
      const { data, error } = await supabase
        .from("social_history")
        .upsert(row as never, { onConflict: "patient_id" })
        .select()
        .single();
      if (error) throw error;
      await logAudit("social_history.upsert", "social_history", (data as { id: string }).id, {
        patient_id: row.patient_id,
      });
      return data as SocialHistory;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["patient_emr", v.patient_id] });
      toast.success("Social history saved");
    },
    onError: (e) => toast.error(errMsg(e, "Could not save")),
  });
}

export function useCompleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patient_id, done }: { id: string; patient_id: string; done: boolean }) => {
      const { error } = await supabase
        .from("follow_up_tasks")
        .update({ status: done ? "completed" : "open", completed_at: done ? new Date().toISOString() : null })
        .eq("id", id);
      if (error) throw error;
      await logAudit("follow_up_tasks.toggle", "follow_up_tasks", id, { done });
      return { patient_id };
    },
    onSuccess: (r) => qc.invalidateQueries({ queryKey: ["patient_emr", r.patient_id] }),
    onError: (e) => toast.error(errMsg(e, "Could not update task")),
  });
}