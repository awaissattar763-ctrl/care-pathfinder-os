import { defineTool } from "@lovable.dev/mcp-js";

export default defineTool({
  name: "whoami",
  title: "Who am I",
  description: "Return the identity of the signed-in HealthOS user (user id, email, OAuth client). Useful to verify connectivity and auth.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: (_input, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const identity = {
      userId: ctx.getUserId(),
      email: ctx.getUserEmail(),
      clientId: ctx.getClientId(),
    };
    return { content: [{ type: "text", text: JSON.stringify(identity) }], structuredContent: identity };
  },
});