import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { logAudit } from "@/lib/audit";

/** Resolve the patient_id linked to the current auth user (if any). */
export function useMyPatientId() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-patient-id", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patient_users")
        .select("patient_id")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data?.patient_id ?? null;
    },
  });
}

export function useMyPatient() {
  const { data: patientId } = useMyPatientId();
  return useQuery({
    queryKey: ["my-patient", patientId],
    enabled: !!patientId,
    queryFn: async () => {
      const { data, error } = await supabase.from("patients").select("*").eq("id", patientId!).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useMyAppointments() {
  const { data: patientId } = useMyPatientId();
  return useQuery({
    queryKey: ["my-appts", patientId],
    enabled: !!patientId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("*, provider:providers(id,name,specialty)")
        .eq("patient_id", patientId!)
        .order("scheduled_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useMyPrescriptions() {
  const { data: patientId } = useMyPatientId();
  return useQuery({
    queryKey: ["my-rx", patientId],
    enabled: !!patientId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prescriptions").select("*")
        .eq("patient_id", patientId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useMyLabResults() {
  const { data: patientId } = useMyPatientId();
  return useQuery({
    queryKey: ["my-labs", patientId],
    enabled: !!patientId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lab_results").select("*")
        .eq("patient_id", patientId!)
        .order("resulted_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useMySoapNotes() {
  const { data: patientId } = useMyPatientId();
  return useQuery({
    queryKey: ["my-soap", patientId],
    enabled: !!patientId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("soap_notes").select("*")
        .eq("patient_id", patientId!)
        .order("date", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

/* -------- Conversations / Messages -------- */

export function useConversations(patientId?: string | null) {
  const { data: myPid } = useMyPatientId();
  const pid = patientId ?? myPid ?? null;
  return useQuery({
    queryKey: ["conversations", pid],
    enabled: !!pid,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .eq("patient_id", pid!)
        .order("last_message_at", { ascending: false });
      if (error) throw error;
      const rows = data ?? [];
      const providerIds = Array.from(new Set(rows.map((r) => r.provider_id).filter(Boolean) as string[]));
      const providers = providerIds.length
        ? (await supabase.from("providers").select("id,name,specialty").in("id", providerIds)).data ?? []
        : [];
      const pmap = new Map(providers.map((p) => [p.id, p]));
      return rows.map((r) => ({ ...r, provider: r.provider_id ? pmap.get(r.provider_id) ?? null : null }));
    },
  });
}

export function useAllConversations() {
  return useQuery({
    queryKey: ["conversations", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .order("last_message_at", { ascending: false });
      if (error) throw error;
      const rows = data ?? [];
      const patientIds = Array.from(new Set(rows.map((r) => r.patient_id)));
      const providerIds = Array.from(new Set(rows.map((r) => r.provider_id).filter(Boolean) as string[]));
      const [patients, providers] = await Promise.all([
        patientIds.length ? supabase.from("patients").select("id,name,mrn").in("id", patientIds) : Promise.resolve({ data: [] as { id: string; name: string; mrn: string }[] }),
        providerIds.length ? supabase.from("providers").select("id,name,specialty").in("id", providerIds) : Promise.resolve({ data: [] as { id: string; name: string; specialty: string | null }[] }),
      ]);
      const pmap = new Map((patients.data ?? []).map((p) => [p.id, p]));
      const prmap = new Map((providers.data ?? []).map((p) => [p.id, p]));
      return rows.map((r) => ({
        ...r,
        patient: pmap.get(r.patient_id) ?? null,
        provider: r.provider_id ? prmap.get(r.provider_id) ?? null : null,
      }));
    },
  });
}

export function useMessages(conversationId: string | null) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const q = useQuery({
    queryKey: ["messages", conversationId],
    enabled: !!conversationId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages").select("*")
        .eq("conversation_id", conversationId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      // mark unread messages not sent by me as read
      const toRead = (data ?? []).filter((m) => !m.read_at && m.sender_user_id !== user?.id);
      if (toRead.length) {
        await supabase
          .from("messages")
          .update({ read_at: new Date().toISOString() })
          .in("id", toRead.map((m) => m.id));
      }
      return data ?? [];
    },
  });
  // realtime
  if (typeof window !== "undefined" && conversationId) {
    // simple effect-less subscription using react-query window focus refetch covers; keep minimal
  }
  return { ...q, refresh: () => qc.invalidateQueries({ queryKey: ["messages", conversationId] }) };
}

export function useSendMessage() {
  const qc = useQueryClient();
  const { user, roles } = useAuth();
  return useMutation({
    mutationFn: async ({ conversationId, body }: { conversationId: string; body: string }) => {
      if (!user) throw new Error("Not signed in");
      const role = roles[0] ?? "patient";
      const { data, error } = await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_user_id: user.id,
        sender_role: role,
        body,
      }).select().single();
      if (error) throw error;
      await logAudit("message.send", "message", data.id, { conversationId });
      return data;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["messages", v.conversationId] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not send message"),
  });
}

export function useCreateConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { patient_id: string; provider_id?: string | null; subject: string }) => {
      const { data, error } = await supabase.from("conversations").insert({
        patient_id: input.patient_id,
        provider_id: input.provider_id ?? null,
        subject: input.subject,
      }).select().single();
      if (error) throw error;
      await logAudit("conversation.create", "conversation", data.id, {});
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["conversations"] }),
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not start conversation"),
  });
}

/* -------- Admin: users + roles + sessions -------- */

export function useAllRoles() {
  return useQuery({
    queryKey: ["admin", "user_roles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAssignRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ user_id, role }: { user_id: string; role: "admin"|"doctor"|"nurse"|"receptionist"|"lab_tech"|"patient" }) => {
      const { data, error } = await supabase.from("user_roles").insert({ user_id, role }).select().single();
      if (error) throw error;
      await logAudit("role.assign", "user_role", data.id, { user_id, role });
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin"] }); toast.success("Role assigned"); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not assign role"),
  });
}

export function useRevokeRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("user_roles").delete().eq("id", id);
      if (error) throw error;
      await logAudit("role.revoke", "user_role", id, {});
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin"] }); toast.success("Role revoked"); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not revoke role"),
  });
}

export function useSessionLog(limit = 50) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["session-log", user?.id, limit],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_sessions_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useProviderSchedules(providerId?: string) {
  return useQuery({
    queryKey: ["provider-schedules", providerId],
    queryFn: async () => {
      let q = supabase.from("provider_schedules").select("*").order("created_at", { ascending: false });
      if (providerId) q = q.eq("provider_id", providerId);
      const { data, error } = await q;
      if (error) throw error;
      const rows = data ?? [];
      const providerIds = Array.from(new Set(rows.map((r) => r.provider_id)));
      const providers = providerIds.length
        ? (await supabase.from("providers").select("id,name").in("id", providerIds)).data ?? []
        : [];
      const pmap = new Map(providers.map((p) => [p.id, p]));
      return rows.map((r) => ({ ...r, provider: pmap.get(r.provider_id) ?? null }));
    },
  });
}

export function useUpsertSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id?: string; provider_id: string; kind: "available"|"out_of_office";
      weekday?: number | null; start_minute?: number | null; end_minute?: number | null;
      starts_at?: string | null; ends_at?: string | null; note?: string | null;
    }) => {
      if (input.id) {
        const { id, ...patch } = input;
        const { data, error } = await supabase.from("provider_schedules").update(patch).eq("id", id).select().single();
        if (error) throw error;
        return data;
      }
      const { data, error } = await supabase.from("provider_schedules").insert(input).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["provider-schedules"] }); toast.success("Schedule saved"); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not save schedule"),
  });
}

export function useDeleteSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("provider_schedules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["provider-schedules"] }); toast.success("Schedule removed"); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not delete schedule"),
  });
}