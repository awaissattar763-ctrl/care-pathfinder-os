import { DefaultChatTransport } from "ai";
import { supabase } from "@/integrations/supabase/client";

/**
 * Chat transport for /api/chat that attaches the current Supabase session
 * token to every request. The server rejects anonymous calls, so every AI
 * surface (Copilot panel, Symptom Checker) must use this transport.
 */
export function createAuthedChatTransport() {
  return new DefaultChatTransport({
    api: "/api/chat",
    fetch: (async (input: RequestInfo | URL, init?: RequestInit) => {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      const headers = new Headers(init?.headers);
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return fetch(input, { ...init, headers });
    }) as typeof fetch,
  });
}
