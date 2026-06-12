import { effectiveStatus, STATUS_LABELS, type Invoice } from "@/hooks/billing-queries";

const TONE: Record<string, string> = {
  draft: "pill--neutral",
  sent: "pill--info",
  pending: "pill--info",
  partially_paid: "pill--warning",
  paid: "pill--success",
  overdue: "pill--danger",
  voided: "pill--neutral",
};

export function InvoiceStatusPill({ invoice, className = "" }: {
  invoice: Pick<Invoice, "status" | "due_date">;
  className?: string;
}) {
  const s = effectiveStatus(invoice);
  return (
    <span className={`pill ${TONE[s] ?? "pill--neutral"} ${className}`}>
      {STATUS_LABELS[s] ?? s}
    </span>
  );
}
