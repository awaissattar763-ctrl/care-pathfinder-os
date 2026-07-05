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
  name: "list_appointments",
  title: "List appointments",
  description: "List upcoming or recent appointments visible to the signed-in HealthOS user. Optionally filter by patient and date range.",
  inputSchema: {
    patient_id: z.string().uuid().optional().describe("Filter to a single patient."),
    from: z.string().datetime().optional().describe("ISO start of window (inclusive)."),
    to: z.string().datetime().optional().describe("ISO end of window (exclusive)."),
    limit: z.number().int().min(1).max(100).optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    let q = supabaseForUser(ctx)
      .from("appointments")
      .select("id,patient_id,scheduled_at,duration_min,visit_type,status,reason,provider_id,room_id")
      .order("scheduled_at", { ascending: true })
      .limit(input.limit ?? 25);
    if (input.patient_id) q = q.eq("patient_id", input.patient_id);
    if (input.from) q = q.gte("scheduled_at", input.from);
    if (input.to) q = q.lt("scheduled_at", input.to);
    const { data, error } = await q;
    return error
      ? { content: [{ type: "text", text: error.message }], isError: true }
      : { content: [{ type: "text", text: JSON.stringify(data) }], structuredContent: { appointments: data ?? [] } };
  },
});