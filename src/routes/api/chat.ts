import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { authenticateRequest, isStaff, checkRateLimit, jsonError } from "@/lib/auth.server";

const SYSTEM_PROMPT = `You are HealthOS Copilot, an assistant for licensed clinicians inside an EMR.

Capabilities you can help with:
- Symptom triage and differential considerations
- Intake & visit summaries (SOAP)
- Prescription drafting (drug, dose, route, frequency, duration) with interaction notes
- Patient history summarization
- Insurance/claims assistance (CPT/ICD-10 suggestions, denial reasoning)
- Appointment triage and scheduling guidance

Rules:
- You are an ASSISTANT ONLY. Every clinical output requires licensed medical review.
- Be concise, structured, and use short headings, bullets, and tables when useful.
- When drafting clinical content, finish with a single line: "_Assistant Only — Requires Licensed Medical Review_".
- Never claim certainty about diagnosis. Offer differentials with brief reasoning.
- Refuse to provide content that bypasses clinician judgment or that fabricates patient data.
- Format responses in Markdown.`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // 1. Authentication — anonymous requests are rejected.
        const auth = await authenticateRequest(request);
        if (!auth.ok) return jsonError(auth.status, auth.message);

        // 2. Authorization — the clinical copilot is staff-only.
        if (!isStaff(auth.roles)) {
          return jsonError(403, "The clinical copilot is available to staff accounts only");
        }

        // 3. Rate limiting — per-user sliding window.
        const rate = checkRateLimit(auth.userId);
        if (!rate.allowed) {
          return jsonError(429, "Too many requests — please wait before sending more messages", {
            "Retry-After": String(rate.retryAfterSec),
          });
        }

        let body: { messages?: UIMessage[] };
        try {
          body = (await request.json()) as { messages?: UIMessage[] };
        } catch {
          return jsonError(400, "Invalid JSON body");
        }
        const { messages } = body;
        if (!Array.isArray(messages) || messages.length === 0) {
          return jsonError(400, "Messages are required");
        }
        if (messages.length > 60) {
          return jsonError(400, "Conversation too long — start a new session");
        }
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return jsonError(500, "AI service is not configured");

        const gateway = createLovableAiGatewayProvider(key);
        const result = streamText({
          model: gateway("google/gemini-3-flash-preview"),
          system: SYSTEM_PROMPT,
          messages: await convertToModelMessages(messages),
        });
        return result.toUIMessageStreamResponse({ originalMessages: messages });
      },
    },
  },
});