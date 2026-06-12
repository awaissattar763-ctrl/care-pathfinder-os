import type { ReactNode } from "react";
import { Lock } from "lucide-react";
import { toast } from "sonner";
import { usePermissions, rolesWithPermission, type Permission } from "@/lib/rbac";
import { useAuth } from "@/hooks/use-auth";
import { logAccessDenied } from "@/lib/audit";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * Page-level gating: renders children only when the user holds the permission.
 * Optionally renders a fallback (e.g. a disabled control) instead of hiding.
 */
export function Can({
  perm,
  children,
  fallback = null,
}: {
  perm: Permission;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const perms = usePermissions();
  return <>{perms.has(perm) ? children : fallback}</>;
}

function requiresLabel(perm: Permission) {
  const roles = rolesWithPermission(perm).filter((r) => r !== "Admin");
  const list = roles.length > 0 ? roles.join(" or ") : "Admin";
  return `Requires ${list} role`;
}

/**
 * Action-level gating: when permitted, renders children (e.g. a dialog trigger)
 * untouched. When not permitted, renders a visually-matching disabled button
 * with a lock icon and a tooltip explaining which role is required. Clicking
 * the disabled control records a denied-access audit event.
 */
export function GuardedAction({
  perm,
  action,
  children,
  className = "btn btn-primary",
  label,
  icon,
}: {
  perm: Permission;
  /** Audit identifier, e.g. "prescriptions.create" */
  action: string;
  children: ReactNode;
  /** Classes for the disabled stand-in button (match the real trigger) */
  className?: string;
  /** Visible label for the disabled stand-in button */
  label: string;
  icon?: ReactNode;
}) {
  const perms = usePermissions();
  const { roles } = useAuth();

  if (perms.has(perm)) return <>{children}</>;

  const hint = requiresLabel(perm);

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-disabled="true"
            aria-label={`${label} — ${hint}`}
            onClick={() => {
              logAccessDenied("action", action, perm, roles);
              toast.error(hint, { description: "Contact your administrator to request access." });
            }}
            className={`${className} opacity-55 cursor-not-allowed`}
          >
            {icon}
            {label}
            <Lock className="size-3.5 ml-0.5" aria-hidden />
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom">{hint}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
