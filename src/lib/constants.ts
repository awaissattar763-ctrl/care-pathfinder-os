/**
 * Central enums for statuses, urgency, and other shared domain constants.
 * Import from here rather than defining local string arrays in components.
 */

/* ---------------- Patient urgency ---------------- */
export const URGENCY_LEVELS = ["critical", "urgent", "routine", "stable"] as const;
export type UrgencyLevel = (typeof URGENCY_LEVELS)[number];

export const URGENCY_LABEL: Record<UrgencyLevel, string> = {
  critical: "Critical",
  urgent: "Urgent",
  routine: "Routine",
  stable: "Stable",
};

/* ---------------- Appointment status ---------------- */
export const APPOINTMENT_STATUSES = [
  "scheduled",
  "checked-in",
  "in-progress",
  "completed",
  "cancelled",
  "no-show",
] as const;
export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

export const APPOINTMENT_STATUS_LABEL: Record<AppointmentStatus, string> = {
  scheduled: "Scheduled",
  "checked-in": "Checked in",
  "in-progress": "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
  "no-show": "No-show",
};

/* ---------------- Claim status ---------------- */
export const CLAIM_STATUSES = [
  "Submitted",
  "Pending",
  "In review",
  "Approved",
  "Denied",
  "Appealed",
  "Paid",
] as const;
export type ClaimStatus = (typeof CLAIM_STATUSES)[number];

/* ---------------- Invoice status ---------------- */
export const INVOICE_STATUSES = ["Draft", "Sent", "Paid", "Overdue", "Refunded", "Cancelled"] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const INVOICE_STATUS_LABEL: Record<InvoiceStatus, string> = {
  Draft: "Draft",
  Sent: "Sent",
  Paid: "Paid",
  Overdue: "Overdue",
  Refunded: "Refunded",
  Cancelled: "Cancelled",
};

/* ---------------- Payment method ---------------- */
export const PAYMENT_METHODS = ["cash", "card", "insurance", "online"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  cash: "Cash",
  card: "Card",
  insurance: "Insurance",
  online: "Online",
};

/* ---------------- Invoice line-item kind ---------------- */
export const LINE_ITEM_KINDS = [
  "consultation",
  "procedure",
  "lab",
  "imaging",
  "medication",
  "custom",
] as const;
export type LineItemKind = (typeof LINE_ITEM_KINDS)[number];

export const LINE_ITEM_KIND_LABEL: Record<LineItemKind, string> = {
  consultation: "Consultation",
  procedure: "Procedure",
  lab: "Lab test",
  imaging: "Imaging",
  medication: "Medication",
  custom: "Custom",
};

/* ---------------- Lab order status ---------------- */
export const LAB_STATUSES = ["ordered", "collected", "in-progress", "resulted", "cancelled"] as const;
export type LabStatus = (typeof LAB_STATUSES)[number];

export const LAB_STATUS_LABEL: Record<LabStatus, string> = {
  ordered: "Ordered",
  collected: "Collected",
  "in-progress": "In progress",
  resulted: "Resulted",
  cancelled: "Cancelled",
};

/* ---------------- Lab priority ---------------- */
export const LAB_PRIORITIES = ["routine", "urgent", "stat"] as const;
export type LabPriority = (typeof LAB_PRIORITIES)[number];

/* ---------------- Prescription status ---------------- */
export const PRESCRIPTION_STATUSES = ["Draft", "Active", "Completed", "Cancelled"] as const;
export type PrescriptionStatus = (typeof PRESCRIPTION_STATUSES)[number];

/* ---------------- Visit types ---------------- */
export const VISIT_TYPES = ["in-person", "telehealth", "home"] as const;
export type VisitType = (typeof VISIT_TYPES)[number];