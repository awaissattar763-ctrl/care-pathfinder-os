import { useAuth, type AppRole } from "@/hooks/use-auth";

export type Permission =
  | "patients.read" | "patients.write" | "patients.delete"
  | "appointments.read" | "appointments.write"
  | "prescriptions.read" | "prescriptions.write"
  | "labs.read" | "labs.write" | "labs.result"
  | "claims.read" | "claims.write"
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