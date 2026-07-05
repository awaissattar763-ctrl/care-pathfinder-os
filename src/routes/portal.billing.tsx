import { createFileRoute } from "@tanstack/react-router";
import { Wallet, Receipt, Download, AlertCircle } from "lucide-react";
import { useMyInvoices, useMyPayments, useMyOutstandingBalance } from "@/hooks/portal-queries";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import { PAYMENT_METHOD_LABEL, type PaymentMethod, type InvoiceStatus } from "@/lib/constants";

export const Route = createFileRoute("/portal/billing")({
  component: PortalBilling,
  head: () => ({ meta: [{ title: "Billing — Patient Portal" }] }),
});

const invoiceTone: Record<InvoiceStatus, string> = {
  Draft: "bg-secondary text-foreground",
  Sent: "bg-primary/15 text-primary",
  Paid: "bg-success/15 text-success",
  Overdue: "bg-destructive/15 text-destructive",
  Refunded: "bg-warning/15 text-warning",
  Cancelled: "bg-secondary text-muted-foreground",
};

function PortalBilling() {
  const { data: invoices, isLoading } = useMyInvoices();
  const { data: payments } = useMyPayments();
  const { data: outstanding } = useMyOutstandingBalance();

  function receipt(invId: string) {
    const inv = invoices?.find((i) => i.id === invId);
    if (!inv) return;
    const lines = [
      `HealthOS — Receipt`,
      `Invoice ${inv.invoice_number}`,
      `Issued: ${formatDate(inv.issued_at)}`,
      `Status: ${inv.status}`,
      `Total:   ${formatCurrency(Number(inv.total))}`,
      `Balance: ${formatCurrency(Number(inv.balance_due))}`,
    ].join("\n");
    const blob = new Blob([lines], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${inv.invoice_number}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
        <Wallet className="size-5 text-primary" /> Billing
      </h1>

      <section className="rounded-xl border border-border bg-card p-5">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Outstanding balance</div>
        <div className={`mt-1.5 text-3xl font-semibold tabular-nums ${Number(outstanding ?? 0) > 0 ? "text-destructive" : "text-success"}`}>
          {formatCurrency(Number(outstanding ?? 0))}
        </div>
        {Number(outstanding ?? 0) > 0 && (
          <p className="mt-2 text-xs text-muted-foreground flex items-start gap-1.5">
            <AlertCircle className="size-3.5 mt-0.5 shrink-0 text-warning" />
            Please contact the clinic to arrange payment for open invoices.
          </p>
        )}
      </section>

      <section className="rounded-xl border border-border bg-card overflow-hidden">
        <header className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Receipt className="size-4 text-primary" />
            <h2 className="text-sm font-semibold">My invoices</h2>
          </div>
          <span className="text-xs text-muted-foreground">{invoices?.length ?? 0}</span>
        </header>
        {isLoading ? (
          <div className="p-4 text-sm text-muted-foreground">Loading…</div>
        ) : !invoices || invoices.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">No invoices yet.</div>
        ) : (
          <ul className="divide-y divide-border">
            {invoices.map((inv) => (
              <li key={inv.id} className="px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium text-sm tabular-nums">{inv.invoice_number}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">Issued {formatDate(inv.issued_at)}{inv.due_date ? ` · Due ${formatDate(inv.due_date)}` : ""}</div>
                  </div>
                  <span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-full font-medium ${invoiceTone[inv.status as InvoiceStatus] ?? "bg-secondary text-foreground"}`}>{inv.status}</span>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs">
                  <div className="text-muted-foreground">
                    Total <span className="text-foreground tabular-nums font-medium">{formatCurrency(Number(inv.total))}</span>
                    <span className="mx-1.5">·</span>
                    Balance <span className={`tabular-nums font-medium ${Number(inv.balance_due) > 0 ? "text-destructive" : "text-success"}`}>{formatCurrency(Number(inv.balance_due))}</span>
                  </div>
                  <button onClick={() => receipt(inv.id)} className="text-primary font-medium inline-flex items-center gap-1 hover:underline">
                    <Download className="size-3.5" /> Receipt
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-border bg-card overflow-hidden">
        <header className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Wallet className="size-4 text-primary" />
            <h2 className="text-sm font-semibold">Payment history</h2>
          </div>
          <span className="text-xs text-muted-foreground">{payments?.length ?? 0}</span>
        </header>
        {!payments || payments.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">No payments yet.</div>
        ) : (
          <ul className="divide-y divide-border">
            {payments.map((p) => (
              <li key={p.id} className="px-4 py-3 flex items-center justify-between">
                <div className="min-w-0">
                  <div className="text-sm font-medium">{PAYMENT_METHOD_LABEL[p.method as PaymentMethod] ?? p.method}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{formatDateTime(p.received_at)}{p.reference ? ` · ${p.reference}` : ""}</div>
                </div>
                <div className="text-sm tabular-nums font-medium">{formatCurrency(Number(p.amount))}</div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-[11px] text-muted-foreground text-center">
        For billing questions, please message your care team from the Messages tab.
      </p>
    </div>
  );
}