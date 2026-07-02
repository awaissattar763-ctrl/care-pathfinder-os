import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { logAudit } from "@/lib/audit";
import type { Patient, Prescription, PrescriptionInsert } from "./types";
import { errMsg } from "./types";

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
    onError: (e) => toast.error(errMsg(e, "Could not save Rx")),
  });
}