import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useAllRoles, useAssignRole, useRevokeRole } from "@/hooks/portal-queries";
import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/lib/rbac";
import { Shield, Trash2, Plus } from "lucide-react";

const ROLES = ["admin","doctor","nurse","receptionist","lab_tech","patient"] as const;

export const Route = createFileRoute("/admin/users")({ component: AdminUsers });

function AdminUsers() {
  const perms = usePermissions();
  const { roles: myRoles } = useAuth();
  const { data: roles } = useAllRoles();
  const assign = useAssignRole();
  const revoke = useRevokeRole();
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState<(typeof ROLES)[number]>("doctor");

  if (!perms.has("admin.users") && !myRoles.includes("admin")) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <Shield className="size-8 mx-auto text-warning mb-3" />
        <h2 className="font-semibold">Restricted</h2>
        <p className="text-sm text-muted-foreground mt-1">You don't have access to user administration.</p>
      </div>
    );
  }

  // Group roles by user
  const grouped = new Map<string, typeof roles>();
  (roles ?? []).forEach((r) => {
    const arr = grouped.get(r.user_id) ?? [];
    arr.push(r); grouped.set(r.user_id, arr);
  });

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">User management</h1>
        <p className="text-sm text-muted-foreground">Assign and revoke role-based access. All actions are audit-logged.</p>
      </header>

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!userId.trim()) return;
          await assign.mutateAsync({ user_id: userId.trim(), role });
          setUserId("");
        }}
        className="rounded-xl border border-border bg-card p-4 flex flex-wrap items-end gap-3"
      >
        <div className="flex-1 min-w-[240px]">
          <label className="text-xs text-muted-foreground">User ID (auth UUID)</label>
          <input value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="00000000-0000-…"
            className="w-full h-10 px-3 rounded-lg bg-secondary text-sm outline-none focus:ring-2 focus:ring-ring/40" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Role</label>
          <select value={role} onChange={(e) => setRole(e.target.value as (typeof ROLES)[number])}
            className="h-10 px-3 rounded-lg bg-secondary text-sm">
            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <button type="submit" disabled={assign.isPending}
          className="h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium inline-flex items-center gap-1 disabled:opacity-50">
          <Plus className="size-4" /> Assign
        </button>
      </form>

      <section className="rounded-xl border border-border bg-card overflow-hidden">
        <header className="px-4 py-3 border-b border-border text-sm font-semibold">All role assignments</header>
        {(roles ?? []).length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">No role assignments yet.</div>
        ) : (
          <ul className="divide-y divide-border">
            {Array.from(grouped.entries()).map(([uid, items]) => (
              <li key={uid} className="px-4 py-3">
                <div className="text-xs font-mono text-muted-foreground truncate">{uid}</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(items ?? []).map((r) => (
                    <span key={r.id} className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-full bg-secondary text-foreground font-medium">
                      {r.role}
                      <button onClick={() => revoke.mutate(r.id)} className="text-destructive hover:text-destructive/80" aria-label={`Revoke ${r.role}`}>
                        <Trash2 className="size-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}