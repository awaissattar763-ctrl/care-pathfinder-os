import type { ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { usePermissions, routePermission } from "@/lib/rbac";
import { AccessDenied } from "@/components/rbac/AccessDenied";

/**
 * Route-level RBAC enforcement.
 * Wraps the staff <Outlet/> in AppShell. Looks up the current pathname in
 * ROUTE_PERMISSIONS and renders AccessDenied (with audit logging) when the
 * signed-in user lacks the required permission.
 */
export function RouteGuard({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { loading, rolesLoading } = useAuth();
  const perms = usePermissions();

  const required = routePermission(pathname);

  // Roles arrive async after the session resolves — never flash Access Denied
  // while permissions are still being verified.
  if (required && (loading || rolesLoading)) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center text-muted-foreground text-sm gap-2">
        <Loader2 className="size-4 animate-spin" /> Verifying permissions…
      </div>
    );
  }

  if (required && !perms.has(required)) {
    return <AccessDenied permission={required} pathname={pathname} />;
  }

  return <>{children}</>;
}
