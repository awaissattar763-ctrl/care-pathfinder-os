import { supabase } from "@/integrations/supabase/client";

export async function logAudit(action: string, entity: string, entityId?: string, metadata?: Record<string, unknown>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("audit_logs").insert({
    user_id: user.id,
    action,
    entity,
    entity_id: entityId ?? null,
    metadata: (metadata ?? {}) as never,
  });
}

/**
 * Logs denied access attempts (route or action level).
 * Throttled per session: each unique route/permission pair is logged once
 * so a user refreshing a forbidden page doesn't flood the audit trail.
 */
const deniedLogged = new Set<string>();

export async function logAccessDenied(
  scope: "route" | "action",
  target: string,
  requiredPermission: string,
  roles: string[],
) {
  const key = `${scope}:${target}:${requiredPermission}`;
  if (deniedLogged.has(key)) return;
  deniedLogged.add(key);
  await logAudit("access.denied", scope, target, {
    required_permission: requiredPermission,
    user_roles: roles,
    path: typeof window !== "undefined" ? window.location.pathname : target,
  });
}