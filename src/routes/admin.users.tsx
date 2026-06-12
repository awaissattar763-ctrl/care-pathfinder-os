import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useAllRoles, useAssignRole, useRevokeRole, useStaffDirectory, useRbacAudit } from "@/hooks/portal-queries";
import { useAuth } from "@/hooks/use-auth";
import {
  usePermissions, ROLE_LABELS, STAFF_ROLES, PERMISSION_GROUPS, roleHasPermission,
} from "@/lib/rbac";
import { PageHeader } from "@/components/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Shield, ShieldX, Trash2, Plus, Check, Minus, UserCog, History, KeyRound,
} from "lucide-react";
import { QueryErrorState } from "@/components/QueryErrorState";

const ROLES = ["admin", "doctor", "nurse", "receptionist", "lab_tech", "patient"] as const;
type RoleKey = (typeof ROLES)[number];

export const Route = createFileRoute("/admin/users")({ component: AdminUsers });

function AdminUsers() {
  const perms = usePermissions();
  const { user: me } = useAuth();
  const { data: roles, isLoading: rolesLoading, isError: rolesError, refetch: refetchRoles } = useAllRoles();
  const { data: staff } = useStaffDirectory();
  const { data: audit } = useRbacAudit(25);
  const assign = useAssignRole();
  const revoke = useRevokeRole();

  const [selectedUser, setSelectedUser] = useState("");
  const [manualId, setManualId] = useState("");
  const [role, setRole] = useState<RoleKey>("doctor");
  const [tab, setTab] = useState<"users" | "matrix" | "audit">("users");

  const nameByUserId = useMemo(() => {
    const m = new Map<string, { name: string; email: string | null }>();
    (staff ?? []).forEach((s) => {
      if (s.user_id) m.set(s.user_id, { name: s.name, email: s.email });
    });
    return m;
  }, [staff]);

  // Route guard already protects this page; keep a defensive check.
  if (!perms.has("admin.users")) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <ShieldX className="size-8 mx-auto text-destructive mb-3" />
        <h2 className="font-semibold">Access denied</h2>
        <p className="text-sm text-muted-foreground mt-1">User administration requires the Admin role.</p>
      </div>
    );
  }

  const grouped = new Map<string, NonNullable<typeof roles>>();
  (roles ?? []).forEach((r) => {
    const arr = grouped.get(r.user_id) ?? [];
    arr.push(r);
    grouped.set(r.user_id, arr);
  });

  const targetUserId = selectedUser === "__manual__" ? manualId.trim() : selectedUser;

  return (
    <div className="animate-fade-in-up">
      <PageHeader
        eyebrow="Administration"
        title="Users & roles"
        description="Assign roles, review the permission matrix, and audit access control events."
      />

      <div className="flex items-center gap-1 bg-secondary rounded-lg p-0.5 w-fit mb-5" role="tablist">
        {([
          ["users", "Role assignments", UserCog],
          ["matrix", "Permission matrix", KeyRound],
          ["audit", "Access audit", History],
        ] as const).map(([key, label, Icon]) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={
              tab === key
                ? "px-3 h-8 rounded-md text-xs font-medium bg-card text-foreground shadow-sm inline-flex items-center gap-1.5"
                : "px-3 h-8 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5"
            }
          >
            <Icon className="size-3.5" /> {label}
          </button>
        ))}
      </div>

      {tab === "users" && (
        <div className="space-y-5">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!targetUserId) return;
              await assign.mutateAsync({ user_id: targetUserId, role });
              setSelectedUser("");
              setManualId("");
            }}
            className="surface p-4 flex flex-wrap items-end gap-3"
          >
            <div className="flex-1 min-w-[240px]">
              <label className="text-xs text-muted-foreground">Staff member</label>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-secondary text-sm outline-none focus:ring-2 focus:ring-ring/40"
              >
                <option value="">Select a user…</option>
                {(staff ?? []).map((s) => (
                  <option key={s.user_id} value={s.user_id ?? ""}>
                    {s.name}{s.email ? ` · ${s.email}` : ""}
                  </option>
                ))}
                <option value="__manual__">Enter user ID manually…</option>
              </select>
            </div>
            {selectedUser === "__manual__" && (
              <div className="flex-1 min-w-[240px]">
                <label className="text-xs text-muted-foreground">User ID (auth UUID)</label>
                <input
                  value={manualId}
                  onChange={(e) => setManualId(e.target.value)}
                  placeholder="00000000-0000-…"
                  className="w-full h-10 px-3 rounded-lg bg-secondary text-sm outline-none focus:ring-2 focus:ring-ring/40"
                />
              </div>
            )}
            <div>
              <label className="text-xs text-muted-foreground">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as RoleKey)}
                className="h-10 px-3 rounded-lg bg-secondary text-sm"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={assign.isPending || !targetUserId}
              className="btn btn-primary disabled:opacity-50"
            >
              <Plus className="size-4" /> Assign role
            </button>
          </form>

          <section className="surface overflow-hidden">
            <div className="section-head">
              <div>
                <div className="section-head__title">Role assignments</div>
                <div className="section-head__sub">
                  {grouped.size} user{grouped.size === 1 ? "" : "s"} · every change is audit-logged
                </div>
              </div>
            </div>
            {rolesError ? (
              <div className="p-5"><QueryErrorState compact title="Couldn't load role assignments" onRetry={() => refetchRoles()} /></div>
            ) : rolesLoading ? (
              <div className="p-5 space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : grouped.size === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">No role assignments yet.</div>
            ) : (
              <ul className="divide-y divide-border">
                {Array.from(grouped.entries()).map(([uid, items]) => {
                  const who = nameByUserId.get(uid);
                  const isMe = uid === me?.id;
                  return (
                    <li key={uid} className="px-5 py-4 flex flex-wrap items-center gap-3">
                      <div className="size-9 rounded-full bg-primary/15 text-primary flex items-center justify-center font-semibold text-sm shrink-0">
                        {(who?.name ?? uid).slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-[180px]">
                        <div className="text-sm font-medium truncate">
                          {who?.name ?? "Unknown user"}{isMe && <span className="ml-2 pill pill--info text-[10px]">You</span>}
                        </div>
                        <div className="text-[11px] font-mono text-muted-foreground truncate">{who?.email ?? uid}</div>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {(items ?? []).map((r) => (
                          <span key={r.id} className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full bg-secondary font-medium">
                            <Shield className="size-3 text-primary" />
                            {ROLE_LABELS[r.role] ?? r.role}
                            <button
                              onClick={() => {
                                if (isMe && r.role === "admin") {
                                  if (!confirm("You are removing your own Admin role. You will lose access to this screen. Continue?")) return;
                                }
                                revoke.mutate(r.id);
                              }}
                              className="text-muted-foreground hover:text-destructive transition-colors"
                              aria-label={`Revoke ${ROLE_LABELS[r.role] ?? r.role} from ${who?.name ?? uid}`}
                              title="Revoke role"
                            >
                              <Trash2 className="size-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      )}

      {tab === "matrix" && (
        <section className="surface overflow-hidden">
          <div className="section-head">
            <div>
              <div className="section-head__title">Permission matrix</div>
              <div className="section-head__sub">What each role can do across HealthOS</div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/40">
                  <th className="text-left font-medium text-xs text-muted-foreground px-5 py-3">Permission</th>
                  {STAFF_ROLES.map((r) => (
                    <th key={r} className="text-center font-medium text-xs text-muted-foreground px-3 py-3 whitespace-nowrap">
                      {ROLE_LABELS[r]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PERMISSION_GROUPS.map((g) => (
                  <GroupRows key={g.group} group={g.group} perms={g.perms} />
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === "audit" && (
        <section className="surface overflow-hidden">
          <div className="section-head">
            <div>
              <div className="section-head__title">Access control audit</div>
              <div className="section-head__sub">Role changes and denied access attempts</div>
            </div>
          </div>
          {(audit ?? []).length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">No access control events recorded yet.</div>
          ) : (
            <ul className="divide-y divide-border">
              {(audit ?? []).map((e) => {
                const meta = (e.metadata ?? {}) as Record<string, unknown>;
                const denied = e.action === "access.denied";
                const who = e.user_id ? nameByUserId.get(e.user_id)?.name ?? e.user_id.slice(0, 8) + "…" : "System";
                return (
                  <li key={e.id} className="px-5 py-3.5 flex items-center gap-3">
                    <div className={denied
                      ? "size-8 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center shrink-0"
                      : "size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0"}>
                      {denied ? <ShieldX className="size-4" /> : <Shield className="size-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm">
                        <span className="font-medium">{who}</span>{" "}
                        {denied ? (
                          <>was denied access to <span className="font-mono text-xs">{String(meta.path ?? e.entity_id ?? "")}</span></>
                        ) : e.action === "role.assign" ? (
                          <>assigned role <span className="font-medium">{ROLE_LABELS[String(meta.role)] ?? String(meta.role)}</span></>
                        ) : (
                          <>revoked a role</>
                        )}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {new Date(e.created_at).toLocaleString()}
                        {denied && meta.required_permission ? ` · required: ${String(meta.required_permission)}` : ""}
                      </div>
                    </div>
                    <span className={denied ? "pill pill--danger text-[10px]" : "pill pill--success text-[10px]"}>
                      {denied ? "Denied" : "Role change"}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}

function GroupRows({ group, perms }: { group: string; perms: string[] }) {
  return (
    <>
      <tr className="bg-secondary/20">
        <td colSpan={STAFF_ROLES.length + 1} className="px-5 py-2 text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
          {group}
        </td>
      </tr>
      {perms.map((p) => (
        <tr key={p} className="border-b border-border/60 hover:bg-primary/[0.03]">
          <td className="px-5 py-2.5 font-mono text-xs">{p}</td>
          {STAFF_ROLES.map((r) => {
            const ok = roleHasPermission(r, p as never);
            return (
              <td key={r} className="text-center px-3 py-2.5">
                {ok ? (
                  <Check className="size-4 text-success inline" aria-label={`${r} allowed`} />
                ) : (
                  <Minus className="size-3.5 text-muted-foreground/40 inline" aria-label={`${r} not allowed`} />
                )}
              </td>
            );
          })}
        </tr>
      ))}
    </>
  );
}
