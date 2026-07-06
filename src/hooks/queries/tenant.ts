import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { logAudit } from "@/lib/audit";
import type { Database } from "@/integrations/supabase/types";
import { errMsg } from "./types";

export type Organization = Database["public"]["Tables"]["organizations"]["Row"];
export type Clinic = Database["public"]["Tables"]["clinics"]["Row"];
export type Department = Database["public"]["Tables"]["departments"]["Row"];
export type ClinicMember = Database["public"]["Tables"]["clinic_members"]["Row"];
export type SubscriptionPlan = Database["public"]["Tables"]["subscription_plans"]["Row"];
export type FeatureFlag = Database["public"]["Tables"]["feature_flags"]["Row"];
export type OrgFeatureFlag = Database["public"]["Tables"]["org_feature_flags"]["Row"];

/** All clinics the signed-in user belongs to. */
export function useMyClinics() {
  return useQuery({
    queryKey: ["my_clinics"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [] as (Clinic & { org: Organization })[];
      const { data, error } = await supabase
        .from("clinic_members")
        .select("clinic:clinics(*, org:organizations(*))")
        .eq("user_id", user.id)
        .eq("is_active", true);
      if (error) throw error;
      return (data ?? [])
        .map((r) => r.clinic as unknown as Clinic & { org: Organization })
        .filter(Boolean);
    },
  });
}

export function useActiveClinicId() {
  return useQuery({
    queryKey: ["active_clinic_id"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase
        .from("user_preferences")
        .select("active_clinic_id")
        .eq("user_id", user.id)
        .maybeSingle();
      return data?.active_clinic_id ?? null;
    },
  });
}

export function useSetActiveClinic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (clinicId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");
      const { error } = await supabase
        .from("user_preferences")
        .upsert({ user_id: user.id, active_clinic_id: clinicId }, { onConflict: "user_id" });
      if (error) throw error;
      await logAudit("clinic.switch", "clinic", clinicId, {});
      return clinicId;
    },
    onSuccess: () => {
      // All existing queries scoped by RLS need to refresh
      qc.invalidateQueries();
      toast.success("Clinic switched");
    },
    onError: (e) => toast.error(errMsg(e, "Could not switch clinic")),
  });
}

/** Feature flags effective for the active clinic's organization. */
export function useOrgFeatureFlags() {
  return useQuery({
    queryKey: ["org_feature_flags"],
    queryFn: async () => {
      const [flagsRes, overridesRes] = await Promise.all([
        supabase.from("feature_flags").select("*"),
        supabase.from("org_feature_flags").select("*"),
      ]);
      if (flagsRes.error) throw flagsRes.error;
      if (overridesRes.error) throw overridesRes.error;
      const overrides = new Map((overridesRes.data ?? []).map((o) => [o.flag_code, o.enabled]));
      return (flagsRes.data ?? []).map((f) => ({
        ...f,
        effective: overrides.has(f.code) ? overrides.get(f.code)! : f.default_enabled,
      }));
    },
  });
}

export function useOrganizations() {
  return useQuery({
    queryKey: ["organizations"],
    queryFn: async () => {
      const { data, error } = await supabase.from("organizations").select("*").order("name");
      if (error) throw error;
      return data as Organization[];
    },
  });
}

export function useClinics() {
  return useQuery({
    queryKey: ["clinics_all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clinics")
        .select("*, org:organizations(*), departments(*)")
        .order("name");
      if (error) throw error;
      return data as (Clinic & { org: Organization; departments: Department[] })[];
    },
  });
}

export function useCreateClinic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { org_id: string; name: string; slug: string; timezone?: string }) => {
      const { data, error } = await supabase.from("clinics").insert(payload).select().single();
      if (error) throw error;
      await logAudit("clinic.create", "clinic", data.id, { name: data.name });
      return data as Clinic;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clinics_all"] });
      qc.invalidateQueries({ queryKey: ["my_clinics"] });
      toast.success("Clinic created");
    },
    onError: (e) => toast.error(errMsg(e, "Could not create clinic")),
  });
}

export function useUpdateClinic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<Clinic> & { id: string }) => {
      const { data, error } = await supabase.from("clinics").update(patch).eq("id", id).select().single();
      if (error) throw error;
      await logAudit("clinic.update", "clinic", id, patch as Record<string, unknown>);
      return data as Clinic;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clinics_all"] });
      qc.invalidateQueries({ queryKey: ["my_clinics"] });
      toast.success("Clinic updated");
    },
    onError: (e) => toast.error(errMsg(e, "Update failed")),
  });
}

export function useCreateDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { clinic_id: string; name: string; code?: string | null }) => {
      const { data, error } = await supabase.from("departments").insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clinics_all"] }),
    onError: (e) => toast.error(errMsg(e, "Could not add department")),
  });
}

export function useToggleFeature() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ org_id, flag_code, enabled }: { org_id: string; flag_code: string; enabled: boolean }) => {
      const { error } = await supabase
        .from("org_feature_flags")
        .upsert({ org_id, flag_code, enabled }, { onConflict: "org_id,flag_code" });
      if (error) throw error;
      await logAudit("feature.toggle", "org_feature_flag", flag_code, { enabled });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["org_feature_flags"] }),
    onError: (e) => toast.error(errMsg(e, "Toggle failed")),
  });
}

export function useSubscriptionPlans() {
  return useQuery({
    queryKey: ["subscription_plans"],
    queryFn: async () => {
      const { data, error } = await supabase.from("subscription_plans").select("*").order("price_cents");
      if (error) throw error;
      return data as SubscriptionPlan[];
    },
  });
}

export function useOrgSubscription() {
  return useQuery({
    queryKey: ["org_subscription"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("org_subscriptions")
        .select("*, plan:subscription_plans(*), org:organizations(*)")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}