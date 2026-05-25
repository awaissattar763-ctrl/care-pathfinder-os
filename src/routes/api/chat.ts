import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

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
        const { messages } = (await request.json()) as { messages?: UIMessage[] };
        if (!Array.isArray(messages)) {
          return new Response("Messages are required", { status: 400 });
        }
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

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