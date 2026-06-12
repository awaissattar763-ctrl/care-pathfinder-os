import { useAuth, type AppRole } from "@/hooks/use-auth";

export type Permission =
  | "patients.read" | "patients.write" | "patients.delete"
  | "appointments.read" | "appointments.write"
  | "prescriptions.read" | "prescriptions.write"
  | "labs.read" | "labs.write" | "labs.result"
  | "claims.read" | "claims.write"
  | "billing.read" | "billing.write" | "billing.void"
  | "telemedicine.join" | "telemedicine.provider"
  | "messages.read" | "messages.write"
  | "admin.users" | "admin.roles" | "admin.schedules"
  | "audit.read" | "compliance.read"
  | "portal.access";

const MATRIX: Record<AppRole | "patient" | "lab_tech", Permission[]> = {
  admin: [
    "patients.read","patients.write","patients.delete",
    "appointments.read","appointments.write",
    "prescriptions.read","prescriptions.write",
    "labs.read","labs.write","labs.result",
    "claims.read","claims.write",
    "billing.read","billing.write","billing.void",
    "telemedicine.join","telemedicine.provider",
    "messages.read","messages.write",
    "admin.users","admin.roles","admin.schedules",
    "audit.read","compliance.read",
  ],
  doctor: [
    "patients.read","patients.write",
    "appointments.read","appointments.write",
    "prescriptions.read","prescriptions.write",
    "labs.read","labs.write",
    "claims.read",
    "billing.read",
    "telemedicine.join","telemedicine.provider",
    "messages.read","messages.write",
    "audit.read",
  ],
  nurse: [
    "patients.read","patients.write",
    "appointments.read","appointments.write",
    "prescriptions.read",
    "labs.read","labs.write",
    "messages.read","messages.write",
  ],
  receptionist: [
    "patients.read","patients.write",
    "appointments.read","appointments.write",
    "claims.read","claims.write",
    "billing.read","billing.write",
    "messages.read",
  ],
  lab_tech: [
    "patients.read",
    "labs.read","labs.write","labs.result",
  ],
  patient: [
    "portal.access","messages.read","messages.write",
  ],
};

export const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  doctor: "Doctor",
  nurse: "Nurse",
  receptionist: "Receptionist",
  lab_tech: "Lab Technician",
  patient: "Patient",
};

export const STAFF_ROLES = ["admin", "doctor", "nurse", "receptionist", "lab_tech"] as const;

/**
 * Route-level protection map. Matched by longest prefix.
 * Routes not listed are open to all authenticated staff.
 */
export const ROUTE_PERMISSIONS: Array<{ prefix: string; perm: Permission }> = [
  { prefix: "/patients", perm: "patients.read" },
  { prefix: "/appointments", perm: "appointments.read" },
  { prefix: "/prescriptions", perm: "prescriptions.read" },
  { prefix: "/labs", perm: "labs.read" },
  { prefix: "/claims", perm: "claims.read" },
  { prefix: "/billing", perm: "billing.read" },
  { prefix: "/telemedicine", perm: "telemedicine.join" },
  { prefix: "/compliance", perm: "compliance.read" },
  { prefix: "/analytics", perm: "audit.read" },
  { prefix: "/admin/users", perm: "admin.users" },
  { prefix: "/admin/schedules", perm: "admin.schedules" },
];

export function routePermission(pathname: string): Permission | null {
  let match: { prefix: string; perm: Permission } | null = null;
  for (const r of ROUTE_PERMISSIONS) {
    if (pathname === r.prefix || pathname.startsWith(r.prefix + "/")) {
      if (!match || r.prefix.length > match.prefix.length) match = r;
    }
  }
  return match?.perm ?? null;
}

/** Which roles hold a given permission — used for "Requires: Doctor or Admin" UI hints. */
export function rolesWithPermission(perm: Permission): string[] {
  return Object.entries(MATRIX)
    .filter(([, perms]) => perms.includes(perm))
    .map(([role]) => ROLE_LABELS[role] ?? role);
}

/** Grouped permissions for the admin permission-matrix screen. */
export const PERMISSION_GROUPS: Array<{ group: string; perms: Permission[] }> = [
  { group: "Patients", perms: ["patients.read", "patients.write", "patients.delete"] },
  { group: "Appointments", perms: ["appointments.read", "appointments.write"] },
  { group: "Prescriptions", perms: ["prescriptions.read", "prescriptions.write"] },
  { group: "Labs", perms: ["labs.read", "labs.write", "labs.result"] },
  { group: "Claims", perms: ["claims.read", "claims.write"] },
  { group: "Billing", perms: ["billing.read", "billing.write", "billing.void"] },
  { group: "Telemedicine", perms: ["telemedicine.join", "telemedicine.provider"] },
  { group: "Messages", perms: ["messages.read", "messages.write"] },
  { group: "Administration", perms: ["admin.users", "admin.roles", "admin.schedules"] },
  { group: "Audit & Compliance", perms: ["audit.read", "compliance.read"] },
];

export function roleHasPermission(role: string, perm: Permission): boolean {
  const perms = MATRIX[role as keyof typeof MATRIX];
  return perms ? perms.includes(perm) : false;
}

export function rolePermissions(roles: string[]): Set<Permission> {
  const set = new Set<Permission>();
  for (const r of roles) {
    const perms = MATRIX[r as keyof typeof MATRIX];
    if (perms) perms.forEach((p) => set.add(p));
  }
  return set;
}

export function usePermissions() {
  const { roles } = useAuth();
  const set = rolePermissions(roles);
  return {
    has: (p: Permission) => set.has(p),
    hasAny: (ps: Permission[]) => ps.some((p) => set.has(p)),
    all: set,
  };
}

export function useIsPatient() {
  const { roles } = useAuth();
  return roles.includes("patient" as AppRole) ||
    (roles.length === 0 ? false : roles.every((r) => r === ("patient" as AppRole)));
}

export function useIsStaff() {
  const { roles } = useAuth();
  return roles.some((r) => ["admin","doctor","nurse","receptionist","lab_tech"].includes(r));
}