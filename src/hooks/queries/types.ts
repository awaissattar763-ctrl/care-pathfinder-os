import type { Database } from "@/integrations/supabase/types";

export type Patient = Database["public"]["Tables"]["patients"]["Row"];
export type PatientInsert = Database["public"]["Tables"]["patients"]["Insert"];
export type Appointment = Database["public"]["Tables"]["appointments"]["Row"];
export type AppointmentInsert = Database["public"]["Tables"]["appointments"]["Insert"];
export type Prescription = Database["public"]["Tables"]["prescriptions"]["Row"];
export type PrescriptionInsert = Database["public"]["Tables"]["prescriptions"]["Insert"];
export type Claim = Database["public"]["Tables"]["claims"]["Row"];
export type AuditLog = Database["public"]["Tables"]["audit_logs"]["Row"];
export type Provider = Database["public"]["Tables"]["providers"]["Row"];
export type Allergy = Database["public"]["Tables"]["allergies"]["Row"];
export type Vital = Database["public"]["Tables"]["vitals"]["Row"];
export type Document = Database["public"]["Tables"]["documents"]["Row"];
export type SoapNote = Database["public"]["Tables"]["soap_notes"]["Row"];
export type SoapNoteInsert = Database["public"]["Tables"]["soap_notes"]["Insert"];
export type Room = Database["public"]["Tables"]["rooms"]["Row"];
export type ProviderSchedule = Database["public"]["Tables"]["provider_schedules"]["Row"];
export type Waitlist = Database["public"]["Tables"]["waitlist"]["Row"];
export type WaitlistInsert = Database["public"]["Tables"]["waitlist"]["Insert"];
export type LabOrder = Database["public"]["Tables"]["lab_orders"]["Row"];
export type LabOrderInsert = Database["public"]["Tables"]["lab_orders"]["Insert"];
export type LabOrderTest = Database["public"]["Tables"]["lab_order_tests"]["Row"];
export type LabResult = Database["public"]["Tables"]["lab_results"]["Row"];
export type LabResultInsert = Database["public"]["Tables"]["lab_results"]["Insert"];

export type AppointmentWithRefs = Appointment & {
  patient: Pick<Patient, "id" | "name" | "mrn" | "phone" | "email" | "urgency"> | null;
  provider: Pick<Provider, "id" | "name" | "specialty"> | null;
  room?: Pick<Room, "id" | "name" | "color"> | null;
};

export type LabOrderWithRefs = LabOrder & {
  patient: Patient | null;
  provider: Provider | null;
  tests: LabOrderTest[];
  results: LabResult[];
};

export type ErrorMessage = (e: unknown, fallback: string) => string;
export const errMsg: ErrorMessage = (e, fallback) =>
  e instanceof Error ? e.message : fallback;