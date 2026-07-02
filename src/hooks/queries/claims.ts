import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { logAudit } from "@/lib/audit";
import type { Claim, Patient } from "./types";
import { errMsg } from "./types";

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
      qc.setQueryData<Claim[]>(["claims"], (old) => old?.map((c) => (c.id === id ? { ...c, status } : c)) ?? old);
      return { prev };
    },
    onError: (e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["claims"], ctx.prev);
      toast.error(errMsg(e, "Status update failed"));
    },
    onSuccess: () => toast.success("Claim updated"),
    onSettled: () => qc.invalidateQueries({ queryKey: ["claims"] }),
  });
}