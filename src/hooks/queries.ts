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
        .select("*, patient:patients(id,name,mrn)")
        .order("scheduled_at", { ascending: true });
      if (error) throw error;
      return data as (Appointment & { patient: Pick<Patient, "id" | "name" | "mrn"> | null })[];
    },
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

      const [patientsCount, todayAppts, monthClaims, openClaims, upcoming] = await Promise.all([
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
      ]);

      const revenueMTD = (monthClaims.data ?? [])
        .filter((c) => c.status === "Approved")
        .reduce((sum, c) => sum + Number(c.amount || 0), 0);
      const nextAppt = upcoming.data?.[0]?.scheduled_at ?? null;

      return {
        patientsTotal: patientsCount.count ?? 0,
        appointmentsToday: todayAppts.count ?? 0,
        revenueMTD,
        openClaims: openClaims.count ?? 0,
        nextAppointmentAt: nextAppt,
      };
    },
  });
}