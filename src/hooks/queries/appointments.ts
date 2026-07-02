import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { logAudit } from "@/lib/audit";
import type {
  Appointment,
  AppointmentInsert,
  AppointmentWithRefs,
  Patient,
  Provider,
  Room,
  Waitlist,
  WaitlistInsert,
} from "./types";
import { errMsg } from "./types";

/* ---------------- Reads ---------------- */

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

export function useAppointmentDetail(id: string | undefined) {
  return useQuery({
    queryKey: ["appointment_detail", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("*, patient:patients(*), provider:providers(*)")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data as (Appointment & { patient: Patient | null; provider: Provider | null }) | null;
    },
  });
}

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

export function useRooms() {
  return useQuery({
    queryKey: ["rooms"],
    queryFn: async () => {
      const { data, error } = await supabase.from("rooms").select("*").eq("active", true).order("name");
      if (error) throw error;
      return data as Room[];
    },
  });
}

/* ---------------- Mutations ---------------- */

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
    onError: (e) => toast.error(errMsg(e, "Could not schedule")),
  });
}

export function useUpdateAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<Appointment> & { id: string }) => {
      const { data, error } = await supabase.from("appointments").update(patch).eq("id", id).select().single();
      if (error) throw error;
      await logAudit("appointment.update", "appointment", id, patch as Record<string, unknown>);
      return data;
    },
    onMutate: async ({ id, ...patch }) => {
      await qc.cancelQueries({ queryKey: ["appointments"] });
      const prev = qc.getQueryData<AppointmentWithRefs[]>(["appointments"]);
      qc.setQueryData<AppointmentWithRefs[]>(["appointments"], (old) =>
        old?.map((a) => (a.id === id ? ({ ...a, ...patch } as AppointmentWithRefs) : a)) ?? old,
      );
      return { prev };
    },
    onError: (e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["appointments"], ctx.prev);
      toast.error(errMsg(e, "Could not update appointment"));
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
    onError: (e) => toast.error(errMsg(e, "Cancel failed")),
  });
}

export function useUpdateAppointmentStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data, error } = await supabase.from("appointments").update({ status }).eq("id", id).select().single();
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
      toast.error(errMsg(e, "Status update failed"));
    },
    onSuccess: () => toast.success("Appointment updated"),
    onSettled: () => qc.invalidateQueries({ queryKey: ["appointments"] }),
  });
}

/* ---------------- Recurring series ---------------- */

export function useCreateAppointmentSeries() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      base: AppointmentInsert;
      occurrences: number;
      frequency: "weekly" | "biweekly";
    }) => {
      const seriesId = crypto.randomUUID();
      const rows: AppointmentInsert[] = [];
      const stepDays = input.frequency === "weekly" ? 7 : 14;
      const start = new Date(input.base.scheduled_at as string);
      for (let i = 0; i < input.occurrences; i++) {
        const d = new Date(start);
        d.setDate(d.getDate() + i * stepDays);
        rows.push({
          ...input.base,
          scheduled_at: d.toISOString(),
          series_id: seriesId,
          recurrence_rule: `FREQ=${input.frequency === "weekly" ? "WEEKLY" : "WEEKLY;INTERVAL=2"};COUNT=${input.occurrences}`,
        });
      }
      const { data, error } = await supabase.from("appointments").insert(rows).select();
      if (error) throw error;
      await logAudit("appointment.series.create", "appointment", seriesId, {
        count: rows.length,
        frequency: input.frequency,
      });
      return data;
    },
    onSuccess: (d) => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success(`Series scheduled · ${d?.length ?? 0} visits`);
    },
    onError: (e) => toast.error(errMsg(e, "Series failed")),
  });
}

export function useCancelSeries() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ seriesId, fromDate }: { seriesId: string; fromDate?: string }) => {
      let q = supabase
        .from("appointments")
        .update({ status: "cancelled" })
        .eq("series_id", seriesId)
        .not("status", "in", "(completed,cancelled)");
      if (fromDate) q = q.gte("scheduled_at", fromDate);
      const { error } = await q;
      if (error) throw error;
      await logAudit("appointment.series.cancel", "appointment", seriesId, { fromDate });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Series cancelled");
    },
    onError: (e) => toast.error(errMsg(e, "Could not cancel series")),
  });
}

/* ---------------- Waitlist ---------------- */

export function useWaitlist(status: string | "all" = "waiting") {
  return useQuery({
    queryKey: ["waitlist", status],
    queryFn: async () => {
      let q = supabase
        .from("waitlist")
        .select("*")
        .order("priority", { ascending: false })
        .order("created_at", { ascending: true });
      if (status !== "all") q = q.eq("status", status);
      const { data, error } = await q;
      if (error) throw error;
      return data as Waitlist[];
    },
  });
}

export function useCreateWaitlist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (w: WaitlistInsert) => {
      const { data, error } = await supabase.from("waitlist").insert(w).select().single();
      if (error) throw error;
      await logAudit("waitlist.create", "waitlist", data.id, { patient_id: data.patient_id });
      return data as Waitlist;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["waitlist"] });
      toast.success("Added to waitlist");
    },
    onError: (e) => toast.error(errMsg(e, "Could not add to waitlist")),
  });
}

export function useUpdateWaitlist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<Waitlist> & { id: string }) => {
      const { data, error } = await supabase.from("waitlist").update(patch).eq("id", id).select().single();
      if (error) throw error;
      await logAudit("waitlist.update", "waitlist", id, patch as Record<string, unknown>);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["waitlist"] }),
    onError: (e) => toast.error(errMsg(e, "Update failed")),
  });
}

/* ---------------- Realtime ---------------- */

export function useAppointmentsRealtime() {
  const qc = useQueryClient();
  useEffect(() => {
    const ch = supabase
      .channel("appointments-room")
      .on("postgres_changes", { event: "*", schema: "public", table: "appointments" }, () => {
        qc.invalidateQueries({ queryKey: ["appointments"] });
        qc.invalidateQueries({ queryKey: ["dashboard"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "waitlist" }, () => {
        qc.invalidateQueries({ queryKey: ["waitlist"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [qc]);
}

/* ---------------- Conflict detection ---------------- */

export function findConflict(
  appts: AppointmentWithRefs[],
  candidate: {
    id?: string;
    scheduled_at: string;
    duration_min: number;
    provider_id?: string | null;
    room_id?: string | null;
  },
): AppointmentWithRefs | null {
  const start = new Date(candidate.scheduled_at).getTime();
  const end = start + candidate.duration_min * 60_000;
  for (const a of appts) {
    if (candidate.id && a.id === candidate.id) continue;
    if (a.status === "cancelled" || a.status === "no-show") continue;
    const matchesProvider = candidate.provider_id && a.provider_id === candidate.provider_id;
    const matchesRoom = candidate.room_id && a.room_id === candidate.room_id;
    if (!matchesProvider && !matchesRoom) continue;
    const aStart = new Date(a.scheduled_at).getTime();
    const aEnd = aStart + (a.duration_min ?? 30) * 60_000;
    if (start < aEnd && end > aStart) return a;
  }
  return null;
}