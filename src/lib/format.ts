/**
 * Shared date, time, and demographic formatters.
 * Prefer these over local helpers in components/routes.
 */

type DateInput = string | number | Date | null | undefined;

function toDate(d: DateInput): Date | null {
  if (d === null || d === undefined || d === "") return null;
  const date = d instanceof Date ? d : new Date(d);
  return Number.isNaN(date.getTime()) ? null : date;
}

const DEFAULT_DATE: Intl.DateTimeFormatOptions = {
  month: "short",
  day: "numeric",
  year: "numeric",
};

const DEFAULT_DATETIME: Intl.DateTimeFormatOptions = {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
};

/** Format a date like "Jan 4, 2025". Returns "—" when nullish/invalid. */
export function formatDate(d: DateInput, options: Intl.DateTimeFormatOptions = DEFAULT_DATE): string {
  const date = toDate(d);
  if (!date) return "—";
  return date.toLocaleDateString(undefined, options);
}

/** Format a date+time like "Jan 4, 3:30 PM". Returns "—" when nullish/invalid. */
export function formatDateTime(d: DateInput, options: Intl.DateTimeFormatOptions = DEFAULT_DATETIME): string {
  const date = toDate(d);
  if (!date) return "—";
  return date.toLocaleString(undefined, options);
}

/** Format only the time-of-day portion. */
export function formatTime(d: DateInput): string {
  const date = toDate(d);
  if (!date) return "—";
  return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

/** Whole years between DOB and now. Returns "—" if unavailable. */
export function calcAge(dob: DateInput): number | "—" {
  const date = toDate(dob);
  if (!date) return "—";
  const diff = Date.now() - date.getTime();
  if (diff < 0) return "—";
  return Math.floor(diff / 3.15576e10);
}

/** Format a number as USD currency. */
export function formatCurrency(value: number | string | null | undefined, currency = "USD"): string {
  const n = typeof value === "string" ? Number(value) : value ?? 0;
  if (Number.isNaN(n as number)) return "—";
  return new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 0 }).format(n as number);
}