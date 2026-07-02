import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { logAudit } from "@/lib/audit";
import type {
  Allergy,
  Appointment,
  AuditLog,
  Document,
  Patient,
  PatientInsert,
  Prescription,
  Provider,
  SoapNote,
  Vital,
} from "./types";
import { errMsg } from "./types";

export function usePatients(search = "") {
  return useQuery({
    queryKey: ["patients", search],
    queryFn: async () => {
      let q = supabase.from("patients").select("*").order("created_at", { ascending: false });
      if (search.trim()) {
        const s = `%${search.trim()}%`;
        q = q.or(`name.ilike.${s},mrn.ilike.${s},email.ilike.${s}`);
      }
      const { data, error } = await q;
      if (error) throw error;
      return data as Patient[];
    },
  });
}

export function usePatient(id: string | undefined) {
  return useQuery({
    queryKey: ["patient", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from("patients").select("*").eq("id", id!).maybeSingle();
      if (error) throw error;
      return data as Patient | null;
    },
  });
}

export function usePatientDetails(id: string | undefined) {
  return useQuery({
    queryKey: ["patient_details", id],
    enabled: !!id,
    retry: false,
    queryFn: async () => {
      if (!id) throw new Error("No ID");
      const [
        { data: patient, error: patientErr },
        { data: allergies, error: allergiesErr },
        { data: vitals, error: vitalsErr },
        { data: documents, error: docsErr },
        { data: soapNotes, error: soapErr },
        { data: appointments, error: apptErr },
        { data: prescriptions, error: rxErr },
        { data: auditLogs, error: auditErr },
      ] = await Promise.all([
        supabase.from("patients").select("*, primary_care:providers!patients_primary_care_id_fkey(*)").eq("id", id).single(),
        supabase.from("allergies").select("*").eq("patient_id", id),
        supabase.from("vitals").select("*").eq("patient_id", id).order("measured_at", { ascending: false }),
        supabase.from("documents").select("*").eq("patient_id", id).order("uploaded_at", { ascending: false }),
        supabase.from("soap_notes").select("*").eq("patient_id", id).order("date", { ascending: false }),
        supabase.from("appointments").select("*, provider:providers(*)").eq("patient_id", id).order("scheduled_at", { ascending: false }),
        supabase.from("prescriptions").select("*, provider:providers(*)").eq("patient_id", id).order("created_at", { ascending: false }),
        supabase.from("audit_logs").select("*").eq("entity_id", id).order("created_at", { ascending: false }).limit(20),
      ]);

      if (patientErr) throw patientErr;
      if (allergiesErr) throw allergiesErr;
      if (vitalsErr) throw vitalsErr;
      if (docsErr) throw docsErr;
      if (soapErr) throw soapErr;
      if (apptErr) throw apptErr;
      if (rxErr) throw rxErr;
      if (auditErr) throw auditErr;

      return {
        patient: patient as Patient & { primary_care: Provider | null },
        allergies: allergies as Allergy[],
        vitals: vitals as Vital[],
        documents: documents as Document[],
        soapNotes: soapNotes as SoapNote[],
        appointments: appointments as (Appointment & { provider: Provider | null })[],
        prescriptions: prescriptions as (Prescription & { provider: Provider | null })[],
        auditLogs: auditLogs as AuditLog[],
      };
    },
  });
}

export function useCreatePatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: Omit<PatientInsert, "created_by">) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("patients")
        .insert({ ...p, created_by: user?.id ?? null })
        .select()
        .single();
      if (error) throw error;
      await logAudit("patient.create", "patient", data.id, { name: data.name, mrn: data.mrn });
      return data as Patient;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["patients"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Patient added to registry");
    },
    onError: (e) => toast.error(errMsg(e, "Could not add patient")),
  });
}

export function useUpdatePatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<Patient> & { id: string }) => {
      const { data, error } = await supabase.from("patients").update(patch).eq("id", id).select().single();
      if (error) throw error;
      await logAudit("patient.update", "patient", id, patch as Record<string, unknown>);
      return data as Patient;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["patients"] });
      qc.invalidateQueries({ queryKey: ["patient", v.id] });
      toast.success("Patient updated");
    },
    onError: (e) => toast.error(errMsg(e, "Update failed")),
  });
}