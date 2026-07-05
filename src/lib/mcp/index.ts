import { auth, defineMcp } from "@lovable.dev/mcp-js";
import whoamiTool from "./tools/whoami";
import listPatientsTool from "./tools/list-patients";
import getPatientTool from "./tools/get-patient";
import listAppointmentsTool from "./tools/list-appointments";

// Direct Supabase issuer — the .lovable.cloud proxy is rejected by mcp-js (issuer
// mismatch). VITE_SUPABASE_PROJECT_ID is inlined by Vite at build time.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "healthos-mcp",
  title: "HealthOS",
  version: "0.1.0",
  instructions:
    "HealthOS clinical tools for the signed-in clinician or patient. Use `whoami` to verify connectivity, `list_patients` / `get_patient` for chart access, and `list_appointments` for scheduling. Row-Level Security enforces per-user visibility on every call.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [whoamiTool, listPatientsTool, getPatientTool, listAppointmentsTool],
});