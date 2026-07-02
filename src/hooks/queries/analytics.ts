import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { AuditLog } from "./types";

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
        supabase.from("claims").select("amount,status").gte("submitted_at", startOfMonth.toISOString()),
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