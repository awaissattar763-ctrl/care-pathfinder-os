import { createServerFn } from "@tanstack/react-start";
import { generateText, Output } from "ai";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

const InputSchema = z.object({ patientId: z.string().uuid() });

const SummarySchema = z.object({
  oneLiner: z.string().describe("Concise one-sentence clinical snapshot"),
  activeConditionsNarrative: z.string(),
  medicationsNarrative: z.string(),
  allergiesNarrative: z.string(),
  recentVisitsNarrative: z.string(),
  outstandingTasks: z.array(z.string()),
  visitPrep: z.object({
    riskFactors: z.array(z.string()),
    missingDocumentation: z.array(z.string()),
    overdueFollowUps: z.array(z.string()),
    talkingPoints: z.array(z.string()),
  }),
  medicationSafety: z.object({
    duplicates: z.array(z.string()),
    allergyConflicts: z.array(z.string()),
    highRiskCombinations: z.array(z.string()),
    notes: z.string(),
  }),
});

export type ClinicalSummary = z.infer<typeof SummarySchema>;

const SYSTEM = `You are HealthOS Clinical Copilot, an ASSISTANT ONLY for licensed clinicians.

Rules:
- Summarize ONLY from the structured patient record provided. Never invent diagnoses, medications, allergies, labs, or events.
- If a field is missing or empty, say so explicitly (e.g. "No allergies documented").
- Do NOT provide medical advice. Provide neutral, factual summaries and flag items the clinician should review.
- For medication safety, only flag concerns supported by the data (e.g. drug listed as allergy, exact duplicate active prescription, well-known high-risk overlap by drug class). When uncertain, say "Possible — clinical review required".
- Be concise. Use plain clinical language. No emoji.
- Every output is for clinician review and requires verification before any action.`;

export const generateClinicalSummary = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => InputSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const id = data.patientId;

    const [pRes, aRes, rxRes, apptRes, vRes, sRes, dRes] = await Promise.all([
      supabase.from("patients").select("*").eq("id", id).single(),
      supabase.from("allergies").select("name,reaction,severity").eq("patient_id", id),
      supabase
        .from("prescriptions")
        .select("drug,sig,status,created_at,quantity,refills")
        .eq("patient_id", id)
        .order("created_at", { ascending: false })
        .limit(40),
      supabase
        .from("appointments")
        .select("scheduled_at,status,visit_type,reason,notes")
        .eq("patient_id", id)
        .order("scheduled_at", { ascending: false })
        .limit(10),
      supabase
        .from("vitals")
        .select("label,value,unit,measured_at,trend")
        .eq("patient_id", id)
        .order("measured_at", { ascending: false })
        .limit(12),
      supabase
        .from("soap_notes")
        .select("date,author,s,o,a,p")
        .eq("patient_id", id)
        .order("date", { ascending: false })
        .limit(5),
      supabase
        .from("documents")
        .select("name,modality,date")
        .eq("patient_id", id)
        .order("uploaded_at", { ascending: false })
        .limit(10),
    ]);

    if (pRes.error || !pRes.data) throw new Error("Patient not found");

    const patient = pRes.data;
    const record = {
      patient: {
        name: patient.name,
        sex: patient.sex,
        dob: patient.dob,
        conditions: patient.conditions ?? [],
        flags: patient.flags ?? [],
        risk_score: patient.risk_score,
        last_visit: patient.last_visit,
      },
      allergies: aRes.data ?? [],
      activePrescriptions: (rxRes.data ?? []).filter((r) => r.status === "Active" || r.status === "Draft"),
      allPrescriptions: rxRes.data ?? [],
      appointments: apptRes.data ?? [],
      recentVitals: vRes.data ?? [],
      soapNotes: sRes.data ?? [],
      documents: dRes.data ?? [],
    };

    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    const gateway = createLovableAiGatewayProvider(key);

    const { experimental_output } = await generateText({
      model: gateway("google/gemini-2.5-flash"),
      system: SYSTEM,
      prompt: `Generate a structured clinical copilot brief for the following patient record. JSON only.\n\nPATIENT_RECORD:\n${JSON.stringify(record, null, 2)}`,
      experimental_output: Output.object({ schema: SummarySchema }),
    });

    // Audit
    await supabase.from("audit_logs").insert({
      user_id: context.userId,
      action: "copilot.generate_summary",
      entity: "patient",
      entity_id: id,
      metadata: { model: "google/gemini-2.5-flash" } as never,
    });

    return { summary: experimental_output as ClinicalSummary, generatedAt: new Date().toISOString() };
  });

export const saveClinicalSummary = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ patientId: z.string().uuid(), summary: z.unknown(), generatedAt: z.string() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const payload = { summary: data.summary, generatedAt: data.generatedAt, generatedBy: context.userId };
    const { error } = await supabase
      .from("patients")
      .update({ ai_summary: payload as never })
      .eq("id", data.patientId);
    if (error) throw new Error(error.message);
    await supabase.from("audit_logs").insert({
      user_id: context.userId,
      action: "copilot.save_summary",
      entity: "patient",
      entity_id: data.patientId,
      metadata: {} as never,
    });
    return { ok: true };
  });