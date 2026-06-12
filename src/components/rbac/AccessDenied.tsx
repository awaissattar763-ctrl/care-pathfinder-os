import { useEffect } from "react";
import { Link, useRouter } from "@tanstack/react-router";
import { ShieldX, ArrowLeft, LayoutDashboard, Lock } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { ROLE_LABELS, rolesWithPermission, type Permission } from "@/lib/rbac";
import { logAccessDenied } from "@/lib/audit";

export function AccessDenied({
  permission,
  pathname,
}: {
  permission: Permission;
  pathname: string;
}) {
  const { roles } = useAuth();
  const router = useRouter();
  const required = rolesWithPermission(permission);

  useEffect(() => {
    logAccessDenied("route", pathname, permission, roles);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, permission]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center animate-fade-in-up">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto size-16 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center">
          <ShieldX className="size-8" aria-hidden />
        </div>

        <div className="mt-6 label-eyebrow">403 · Restricted area</div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Access denied</h1>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          Your account doesn't have permission to view this page. If you believe this is a
          mistake, contact your practice administrator.
        </p>

        <div className="mt-6 rounded-xl border border-border bg-card p-4 text-left space-y-3">
          <div className="flex items-start justify-between gap-3">
            <span className="text-xs text-muted-foreground shrink-0 pt-0.5">Your role</span>
            <div className="flex flex-wrap justify-end gap-1.5">
              {roles.length > 0 ? (
                roles.map((r) => (
                  <span key={r} className="pill pill--neutral text-[11px]">
                    {ROLE_LABELS[r] ?? r}
                  </span>
                ))
              ) : (
                <span className="pill pill--warning text-[11px]">No role assigned</span>
              )}
            </div>
          </div>
          <div className="flex items-start justify-between gap-3 border-t border-border pt-3">
            <span className="text-xs text-muted-foreground shrink-0 pt-0.5">Requires</span>
            <div className="flex flex-wrap justify-end gap-1.5">
              {required.map((r) => (
                <span key={r} className="pill pill--info text-[11px]">{r}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2">
          <button onClick={() => router.history.back()} className="btn btn-secondary">
            <ArrowLeft className="size-4" /> Go back
          </button>
          <Link to="/" className="btn btn-primary">
            <LayoutDashboard className="size-4" /> Overview
          </Link>
        </div>

        <div className="mt-8 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
          <Lock className="size-3" aria-hidden /> This access attempt has been recorded in the audit log.
        </div>
      </div>
    </div>
  );
}
