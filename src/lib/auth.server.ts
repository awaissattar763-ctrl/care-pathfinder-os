/**
 * Server-side request authentication for API routes.
 * Verifies the Supabase JWT from the Authorization header against GoTrue,
 * checks staff roles via PostgREST (the user's own JWT + RLS), and applies
 * a per-user sliding-window rate limit.
 */

type AuthResult =
  | { ok: true; userId: string; roles: string[] }
  | { ok: false; status: number; message: string };

function env(name: string): string | undefined {
  return process.env[name];
}

const STAFF_ROLES = new Set(["admin", "doctor", "nurse", "receptionist", "lab_tech"]);

export async function authenticateRequest(request: Request): Promise<AuthResult> {
  const supabaseUrl = env("SUPABASE_URL") ?? env("VITE_SUPABASE_URL");
  const anonKey = env("SUPABASE_PUBLISHABLE_KEY") ?? env("VITE_SUPABASE_PUBLISHABLE_KEY");
  if (!supabaseUrl || !anonKey) {
    return { ok: false, status: 500, message: "Server auth is not configured" };
  }

  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  if (!token) {
    return { ok: false, status: 401, message: "Authentication required" };
  }

  // 1. Validate the JWT with Supabase Auth.
  const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${token}` },
  });
  if (!userRes.ok) {
    return { ok: false, status: 401, message: "Invalid or expired session" };
  }
  const user = (await userRes.json()) as { id?: string };
  if (!user?.id) {
    return { ok: false, status: 401, message: "Invalid session" };
  }

  // 2. Fetch the caller's roles using their own JWT (RLS: users read own roles).
  const rolesRes = await fetch(
    `${supabaseUrl}/rest/v1/user_roles?select=role&user_id=eq.${user.id}`,
    { headers: { apikey: anonKey, Authorization: `Bearer ${token}` } },
  );
  const roles: string[] = rolesRes.ok
    ? ((await rolesRes.json()) as Array<{ role: string }>).map((r) => r.role)
    : [];

  return { ok: true, userId: user.id, roles };
}

export function isStaff(roles: string[]) {
  return roles.some((r) => STAFF_ROLES.has(r));
}

// ---------- Rate limiting (per-user sliding window, in-memory) ----------
// Note: in-memory state is per server instance/isolate. For a single-region
// deployment this is an effective abuse brake; multi-region deployments
// should back this with KV/Redis later.

const WINDOW_MS = 5 * 60 * 1000;
const MAX_REQUESTS = 20;
const hits = new Map<string, number[]>();

export function checkRateLimit(userId: string): { allowed: boolean; retryAfterSec: number } {
  const now = Date.now();
  const windowStart = now - WINDOW_MS;
  const list = (hits.get(userId) ?? []).filter((t) => t > windowStart);
  if (list.length >= MAX_REQUESTS) {
    const retryAfterSec = Math.ceil((list[0] + WINDOW_MS - now) / 1000);
    hits.set(userId, list);
    return { allowed: false, retryAfterSec: Math.max(1, retryAfterSec) };
  }
  list.push(now);
  hits.set(userId, list);
  // Opportunistic cleanup so the map doesn't grow unbounded.
  if (hits.size > 5000) {
    for (const [k, v] of hits) {
      if (v.every((t) => t <= windowStart)) hits.delete(k);
    }
  }
  return { allowed: true, retryAfterSec: 0 };
}

export function jsonError(status: number, message: string, extraHeaders?: Record<string, string>) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json", ...extraHeaders },
  });
}
