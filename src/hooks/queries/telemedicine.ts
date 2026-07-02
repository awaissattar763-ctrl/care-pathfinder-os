import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { logAudit } from "@/lib/audit";
import type { AppointmentWithRefs, SoapNote, SoapNoteInsert } from "./types";
import { errMsg } from "./types";

export function useTelemedicineSessions() {
  return useQuery({
    queryKey: ["telemedicine_sessions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select(
          "*, patient:patients(id,name,mrn,phone,email,urgency,dob,sex), provider:providers(id,name,specialty)",
        )
        .eq("visit_type", "telehealth")
        .order("scheduled_at", { ascending: true });
      if (error) throw error;
      return data as AppointmentWithRefs[];
    },
  });
}

export function useCreateSoapNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (n: SoapNoteInsert) => {
      const { data, error } = await supabase.from("soap_notes").insert(n).select().single();
      if (error) throw error;
      await logAudit("soap.create", "soap_note", data.id, { patient_id: data.patient_id });
      return data as SoapNote;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["patient_details", v.patient_id] });
      toast.success("SOAP note saved to chart");
    },
    onError: (e) => toast.error(errMsg(e, "Save failed")),
  });
}