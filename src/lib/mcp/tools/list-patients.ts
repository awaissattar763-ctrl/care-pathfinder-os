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
  name: "list_patients",
  title: "List patients",
  description: "List patients accessible to the signed-in HealthOS user. Returns id, MRN, name, sex, DOB, and last visit. Row-Level Security limits results to what the caller may see.",
  inputSchema: {
    search: z.string().trim().optional().describe("Optional case-insensitive substring to match against patient name or MRN."),
    limit: z.number().int().min(1).max(100).optional().describe("Max rows to return (default 25)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ search, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    let q = supabaseForUser(ctx)
      .from("patients")
      .select("id,mrn,name,sex,dob,last_visit")
      .order("last_visit", { ascending: false, nullsFirst: false })
      .limit(limit ?? 25);
    if (search) q = q.or(`name.ilike.%${search}%,mrn.ilike.%${search}%`);
    const { data, error } = await q;
    return error
      ? { content: [{ type: "text", text: error.message }], isError: true }
      : { content: [{ type: "text", text: JSON.stringify(data) }], structuredContent: { patients: data ?? [] } };
  },
});