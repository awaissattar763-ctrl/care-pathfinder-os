import type { AppointmentWithRefs } from "@/hooks/queries";

function pad(n: number) { return String(n).padStart(2, "0"); }

function toICSDate(d: Date) {
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T` +
    `${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  );
}

function escapeText(s: string) {
  return s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

export function appointmentToICS(appt: AppointmentWithRefs): string {
  const start = new Date(appt.scheduled_at);
  const end = new Date(start.getTime() + (appt.duration_min ?? 30) * 60_000);
  const summary = `${appt.reason ?? "Visit"} · ${appt.patient?.name ?? "Patient"}`;
  const description = [
    appt.patient?.name && `Patient: ${appt.patient.name}`,
    appt.patient?.mrn && `MRN: ${appt.patient.mrn}`,
    appt.provider?.name && `Provider: ${appt.provider.name}`,
    appt.visit_type && `Type: ${appt.visit_type}`,
    appt.notes && `Notes: ${appt.notes}`,
  ].filter(Boolean).join("\\n");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//HealthOS//Appointments//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${appt.id}@healthos`,
    `DTSTAMP:${toICSDate(new Date())}`,
    `DTSTART:${toICSDate(start)}`,
    `DTEND:${toICSDate(end)}`,
    `SUMMARY:${escapeText(summary)}`,
    description && `DESCRIPTION:${escapeText(description)}`,
    `STATUS:${appt.status === "cancelled" ? "CANCELLED" : "CONFIRMED"}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean).join("\r\n");
}

export function downloadICS(appt: AppointmentWithRefs) {
  const ics = appointmentToICS(appt);
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `appointment-${appt.id.slice(0, 8)}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}