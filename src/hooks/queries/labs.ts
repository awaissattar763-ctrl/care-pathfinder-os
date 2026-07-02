import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { logAudit } from "@/lib/audit";
import type { LabOrder, LabOrderWithRefs, LabResult, LabResultInsert } from "./types";
import { errMsg } from "./types";

export function useLabOrders(patientId?: string) {
  return useQuery({
    queryKey: ["lab_orders", patientId ?? "all"],
    queryFn: async () => {
      let q = supabase
        .from("lab_orders")
        .select("*, patient:patients(*), provider:providers(*), tests:lab_order_tests(*), results:lab_results(*)")
        .order("ordered_at", { ascending: false });
      if (patientId) q = q.eq("patient_id", patientId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as LabOrderWithRefs[];
    },
  });
}

export function useLabOrder(id: string | undefined) {
  return useQuery({
    queryKey: ["lab_order", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lab_orders")
        .select("*, patient:patients(*), provider:providers(*), tests:lab_order_tests(*), results:lab_results(*)")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as LabOrderWithRefs | null;
    },
  });
}

export function useCreateLabOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      patient_id: string;
      provider_id?: string | null;
      priority?: string;
      lab_facility?: string | null;
      clinical_notes?: string | null;
      tests: { test_code?: string | null; test_name: string }[];
    }) => {
      const { tests, ...order } = input;
      const { data: created, error } = await supabase
        .from("lab_orders")
        .insert({
          patient_id: order.patient_id,
          provider_id: order.provider_id ?? null,
          priority: order.priority ?? "routine",
          lab_facility: order.lab_facility ?? null,
          clinical_notes: order.clinical_notes ?? null,
          status: "ordered",
        })
        .select()
        .single();
      if (error) throw error;
      if (tests.length) {
        const { error: testsErr } = await supabase
          .from("lab_order_tests")
          .insert(tests.map((t) => ({ order_id: created.id, test_code: t.test_code ?? null, test_name: t.test_name })));
        if (testsErr) throw testsErr;
      }
      await logAudit("lab_order.create", "lab_order", created.id, {
        patient_id: created.patient_id,
        count: tests.length,
      });
      return created as LabOrder;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["lab_orders"] });
      qc.invalidateQueries({ queryKey: ["patient_details", v.patient_id] });
      toast.success("Lab order created");
    },
    onError: (e) => toast.error(errMsg(e, "Order failed")),
  });
}

export function useUpdateLabOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: { id: string; status: string }) => {
      const patch: Database["public"]["Tables"]["lab_orders"]["Update"] = { status: v.status };
      if (v.status === "collected") patch.collected_at = new Date().toISOString();
      if (v.status === "resulted") patch.resulted_at = new Date().toISOString();
      const { data, error } = await supabase.from("lab_orders").update(patch).eq("id", v.id).select().single();
      if (error) throw error;
      await logAudit("lab_order.status", "lab_order", v.id, { status: v.status });
      return data as LabOrder;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lab_orders"] });
      qc.invalidateQueries({ queryKey: ["lab_order"] });
    },
    onError: (e) => toast.error(errMsg(e, "Update failed")),
  });
}

export function useAddLabResult() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (r: LabResultInsert) => {
      const { data, error } = await supabase.from("lab_results").insert(r).select().single();
      if (error) throw error;
      await supabase
        .from("lab_orders")
        .update({ status: "resulted", resulted_at: new Date().toISOString() })
        .eq("id", r.order_id)
        .neq("status", "cancelled");
      await logAudit("lab_result.create", "lab_result", data.id, { order_id: r.order_id, flag: r.flag ?? "normal" });
      return data as LabResult;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lab_orders"] });
      qc.invalidateQueries({ queryKey: ["lab_order"] });
      toast.success("Result recorded");
    },
    onError: (e) => toast.error(errMsg(e, "Save failed")),
  });
}