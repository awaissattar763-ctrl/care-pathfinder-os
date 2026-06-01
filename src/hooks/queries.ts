import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { logAudit } from "@/lib/audit";

export type Patient = Database["public"]["Tables"]["patients"]["Row"];
export type PatientInsert = Database["public"]["Tables"]["patients"]["Insert"];
export type Appointment = Database["public"]["Tables"]["appointments"]["Row"];
export type AppointmentInsert = Database["public"]["Tables"]["appointments"]["Insert"];
export type Prescription = Database["public"]["Tables"]["prescriptions"]["Row"];
export type PrescriptionInsert = Database["public"]["Tables"]["prescriptions"]["Insert"];
export type Claim = Database["public"]["Tables"]["claims"]["Row"];
export type AuditLog = Database["public"]["Tables"]["audit_logs"]["Row"];
export type Provider = Database["public"]["Tables"]["providers"]["Row"];
export type Allergy = Database["public"]["Tables"]["allergies"]["Row"];
export type Vital = Database["public"]["Tables"]["vitals"]["Row"];
export type Document = Database["public"]["Tables"]["documents"]["Row"];
export type SoapNote = Database["public"]["Tables"]["soap_notes"]["Row"];

/* ---------------- Patients ---------------- */

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
        supabase.from("audit_logs").select("*").eq("entity_id", id).order("created_at", { ascending: false }).limit(20)
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
        auditLogs: auditLogs as AuditLog[]
      };
    }
  });
}

export function useCreatePatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: Omit<PatientInsert, "created_by">) => {
      const { data: { user } } = await supabase.auth.getUser();
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
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not add patient"),
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
    onError: (e) => toast.error(e instanceof Error ? e.message : "Update failed"),
  });
}

/* ---------------- Appointments ---------------- */

export function useAppointments() {
  return useQuery({
    queryKey: ["appointments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("*, patient:patients(id,name,mrn,phone,email,urgency), provider:providers(id,name,specialty)")
        .order("scheduled_at", { ascending: true });
      if (error) throw error;
      return data as AppointmentWithRefs[];
    },
  });
}

export type AppointmentWithRefs = Appointment & {
  patient: Pick<Patient, "id" | "name" | "mrn" | "phone" | "email" | "urgency"> | null;
  provider: Pick<Provider, "id" | "name" | "specialty"> | null;
};

export function useProviders() {
  return useQuery({
    queryKey: ["providers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("providers").select("*").order("name");
      if (error) throw error;
      return data as Provider[];
    },
  });
}

export function useUpdateAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<Appointment> & { id: string }) => {
      const { data, error } = await supabase
        .from("appointments")
        .update(patch)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      await logAudit("appointment.update", "appointment", id, patch as Record<string, unknown>);
      return data;
    },
    onMutate: async ({ id, ...patch }) => {
      await qc.cancelQueries({ queryKey: ["appointments"] });
      const prev = qc.getQueryData<AppointmentWithRefs[]>(["appointments"]);
      qc.setQueryData<AppointmentWithRefs[]>(["appointments"], (old) =>
        old?.map((a) => (a.id === id ? { ...a, ...patch } as AppointmentWithRefs : a)) ?? old,
      );
      return { prev };
    },
    onError: (e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["appointments"], ctx.prev);
      toast.error(e instanceof Error ? e.message : "Could not update appointment");
    },
    onSuccess: () => toast.success("Appointment updated"),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useCancelAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      const { data, error } = await supabase
        .from("appointments")
        .update({ status: "cancelled", notes: reason ?? null })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      await logAudit("appointment.cancel", "appointment", id, { reason });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Appointment cancelled");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Cancel failed"),
  });
}

export function useCreateAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (a: AppointmentInsert) => {
      const { data, error } = await supabase.from("appointments").insert(a).select().single();
      if (error) throw error;
      await logAudit("appointment.create", "appointment", data.id, { patient_id: data.patient_id });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Appointment scheduled");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not schedule"),
  });
}

export function useUpdateAppointmentStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data, error } = await supabase
        .from("appointments")
        .update({ status })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      await logAudit("appointment.status", "appointment", id, { status });
      return data;
    },
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: ["appointments"] });
      const prev = qc.getQueryData<Appointment[]>(["appointments"]);
      qc.setQueryData<Appointment[]>(["appointments"], (old) =>
        old?.map((a) => (a.id === id ? { ...a, status } : a)) ?? old,
      );
      return { prev };
    },
    onError: (e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["appointments"], ctx.prev);
      toast.error(e instanceof Error ? e.message : "Status update failed");
    },
    onSuccess: () => toast.success("Appointment updated"),
    onSettled: () => qc.invalidateQueries({ queryKey: ["appointments"] }),
  });
}

/* ---------------- Prescriptions ---------------- */

export function usePrescriptions() {
  return useQuery({
    queryKey: ["prescriptions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prescriptions")
        .select("*, patient:patients(id,name,mrn)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as (Prescription & { patient: Pick<Patient, "id" | "name" | "mrn"> | null })[];
    },
  });
}

export function useCreatePrescription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rx: PrescriptionInsert) => {
      const { data, error } = await supabase.from("prescriptions").insert(rx).select().single();
      if (error) throw error;
      await logAudit("prescription.create", "prescription", data.id, {
        drug: data.drug,
        patient_id: data.patient_id,
      });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["prescriptions"] });
      toast.success("Prescription saved");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not save Rx"),
  });
}

/* ---------------- Claims ---------------- */

export function useClaims() {
  return useQuery({
    queryKey: ["claims"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("claims")
        .select("*, patient:patients(id,name,mrn)")
        .order("submitted_at", { ascending: false });
      if (error) throw error;
      return data as (Claim & { patient: Pick<Patient, "id" | "name" | "mrn"> | null })[];
    },
  });
}

export function useUpdateClaimStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data, error } = await supabase.from("claims").update({ status }).eq("id", id).select().single();
      if (error) throw error;
      await logAudit("claim.status", "claim", id, { status });
      return data;
    },
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: ["claims"] });
      const prev = qc.getQueryData<Claim[]>(["claims"]);
      qc.setQueryData<Claim[]>(["claims"], (old) =>
        old?.map((c) => (c.id === id ? { ...c, status } : c)) ?? old,
      );
      return { prev };
    },
    onError: (e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["claims"], ctx.prev);
      toast.error(e instanceof Error ? e.message : "Status update failed");
    },
    onSuccess: () => toast.success("Claim updated"),
    onSettled: () => qc.invalidateQueries({ queryKey: ["claims"] }),
  });
}

/* ---------------- Audit ---------------- */

export function useAuditLogs(limit = 25) {
  return useQuery({
    queryKey: ["audit_logs", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data as AuditLog[];
    },
  });
}

/* ---------------- Dashboard metrics ---------------- */

export function useDashboardMetrics() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(startOfDay);
      endOfDay.setDate(endOfDay.getDate() + 1);
      const startOfMonth = new Date(startOfDay.getFullYear(), startOfDay.getMonth(), 1);

      const [patientsCount, todayAppts, monthClaims, openClaims, upcoming, weekAppts, missed] = await Promise.all([
        supabase.from("patients").select("id", { count: "exact", head: true }),
        supabase
          .from("appointments")
          .select("id", { count: "exact", head: true })
          .gte("scheduled_at", startOfDay.toISOString())
          .lt("scheduled_at", endOfDay.toISOString()),
        supabase
          .from("claims")
          .select("amount,status")
          .gte("submitted_at", startOfMonth.toISOString()),
        supabase
          .from("claims")
          .select("id", { count: "exact", head: true })
          .in("status", ["Submitted", "In review"]),
        supabase
          .from("appointments")
          .select("scheduled_at")
          .gte("scheduled_at", new Date().toISOString())
          .order("scheduled_at", { ascending: true })
          .limit(1),
        supabase
          .from("appointments")
          .select("status,duration_min")
          .gte("scheduled_at", new Date(startOfDay.getTime() - 6 * 24 * 3600 * 1000).toISOString())
          .lt("scheduled_at", endOfDay.toISOString()),
        supabase
          .from("appointments")
          .select("id", { count: "exact", head: true })
          .eq("status", "no-show")
          .gte("scheduled_at", new Date(startOfDay.getTime() - 30 * 24 * 3600 * 1000).toISOString()),
      ]);

      const revenueMTD = (monthClaims.data ?? [])
        .filter((c) => c.status === "Approved")
        .reduce((sum, c) => sum + Number(c.amount || 0), 0);
      const nextAppt = upcoming.data?.[0]?.scheduled_at ?? null;

      const weekRows = weekAppts.data ?? [];
      const completed = weekRows.filter((a) => a.status === "completed").length;
      const utilization = weekRows.length ? Math.round((completed / weekRows.length) * 100) : 0;

      return {
        patientsTotal: patientsCount.count ?? 0,
        appointmentsToday: todayAppts.count ?? 0,
        revenueMTD,
        openClaims: openClaims.count ?? 0,
        nextAppointmentAt: nextAppt,
        missed30d: missed.count ?? 0,
        utilization7d: utilization,
      };
    },
  });
}