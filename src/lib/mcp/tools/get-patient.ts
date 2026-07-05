import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function supabaseForUser(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "get_patient",
  title: "Get patient summary",
  description: "Fetch a HealthOS patient chart snapshot: demographics, active problems, allergies, active medications, and recent vitals. RLS applies.",
  inputSchema: {
    patient_id: z.string().uuid().describe("Patient UUID."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ patient_id }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const sb = supabaseForUser(ctx);
    const [p, problems, allergies, meds, vitals] = await Promise.all([
      sb.from("patients").select("id,mrn,name,sex,dob,conditions,flags,risk_score,last_visit").eq("id", patient_id).maybeSingle(),
      sb.from("problems").select("name,icd10,status,onset_date").eq("patient_id", patient_id),
      sb.from("allergies").select("name,reaction,severity").eq("patient_id", patient_id),
      sb.from("prescriptions").select("drug,sig,status,refills").eq("patient_id", patient_id).in("status", ["Active", "Draft"]),
      sb.from("vitals").select("label,value,unit,measured_at").eq("patient_id", patient_id).order("measured_at", { ascending: false }).limit(10),
    ]);
    if (p.error) return { content: [{ type: "text", text: p.error.message }], isError: true };
    if (!p.data) return { content: [{ type: "text", text: "Patient not found or access denied" }], isError: true };
    const summary = {
      patient: p.data,
      problems: problems.data ?? [],
      allergies: allergies.data ?? [],
      activeMedications: meds.data ?? [],
      recentVitals: vitals.data ?? [],
    };
    return { content: [{ type: "text", text: JSON.stringify(summary) }], structuredContent: summary };
  },
});